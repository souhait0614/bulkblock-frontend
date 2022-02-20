<script lang="ts">
  import type { Users, User, BlockUsers, BlockUser } from "src/types"
  import { isFullUser, Status } from "twitter-d"

  import { fade, slide } from "svelte/transition"
  const duration = { duration: 300 }

  //NOTE テスト用
  import testdata from "../../testdata.json"
  const localDebug = false

  let searchText = ""

  export let cookie

  function post(url) {
    const u = new URL(location.origin + url)
    u.searchParams.set("access_token", cookie["access_token"])
    u.searchParams.set("access_token_secret", cookie["access_token_secret"])
    url = u.toString()
    return fetch(url, {
      method: "POST",
    })
  }
  function get(url) {
    const u = new URL(location.origin + url)
    u.searchParams.set("access_token", cookie["access_token"])
    u.searchParams.set("access_token_secret", cookie["access_token_secret"])
    url = u.toString()
    return fetch(url, {
      method: "GET",
    })
  }

  // 検索
  let promiseUsers: Promise<Users> = null
  async function search() {
    return new Promise<{
      statuses: Status[]
    }>(async (resolve, reject) => {
      const data = localDebug
        ? //NOTE テスト用
          new Response(
            await new Promise((resolve) =>
              setTimeout(() => resolve(JSON.stringify(testdata.search)), 1000)
            )
          )
        : await get("/search?q=" + encodeURIComponent(searchText))
      if (data.ok) {
        resolve(data.json())
      } else {
        reject(Error("データの取得に失敗しました: " + data.status))
      }
    })
  }
  // フォロー一覧とか
  async function getFollowing() {
    return new Promise<{
      ids: string[]
    }>(async (resolve, reject) => {
      const data = localDebug
        ? //NOTE テスト用
          new Response(
            await new Promise((resolve) =>
              setTimeout(
                () => resolve(JSON.stringify(testdata.following)),
                1000
              )
            )
          )
        : await get("/following")
      if (data.ok) {
        resolve(data.json())
      } else {
        reject(Error("データの取得に失敗しました: " + data.status))
      }
    })
  }
  // 対象のユーザーを取得したりする
  let creating = false
  async function createUsers() {
    creating = true
    promiseUsers = new Promise<Users>(async (resolve, reject) => {
      try {
        Promise.all([search(), getFollowing()])
          .then(([searchResult, following]) => {
            let result: Users = {}
            for (const { user } of searchResult.statuses) {
              if (user.id_str in result) continue
              const isFollowing = following.ids.includes(user.id_str)
              result[user.id_str] = {
                following: isFollowing,
                data: user,
                cheched: !isFollowing,
              }
            }
            creating = false
            resolve(result)
          })
          .catch((err) => {
            reject(err)
          })
      } catch (error) {
        reject(error)
      }
    })
  }

  let blockIds = []
  let blockProgress = 0
  let promiseBlockUsers: Promise<BlockUsers> = null
  async function block() {
    blockIds = Object.values(await promiseUsers)
      .map((val) => {
        if (!val.cheched) return
        return val.data.id_str
      })
      .filter((e) => e)
    promiseBlockUsers = new Promise<BlockUsers>(async (resolve) => {
      blockProgress = 0
      let result: BlockUsers = {}
      await Promise.all(
        blockIds.map(async (id) => {
          const data = await post("/block?id=" + id)
          const { ok, statusText } = data
          result[id] = {
            data: data.ok ? await data.json() : undefined,
            ok,
            statusText,
          }
          blockProgress++
        })
      )
      resolve(result)
    })
  }
  function logout() {
    document.cookie = "access_token=;max-age=-1;"
    document.cookie = "access_token_secret=;max-age=-1;"
    location.reload()
  }
</script>

<header>
  <h1>Bulk Block</h1>
  <button on:click={logout}>
    <i>logout</i>
  </button>
</header>
<main id="logged">
  {#if promiseUsers !== null}
    {#await promiseUsers then users}
      <div class="users_count" transition:slide={duration}>
        <span>{Object.keys(users).length}</span>人見つかりました
      </div>
    {/await}
  {/if}
  <div class="search_box">
    <input type="search" bind:value={searchText} />
    <button
      on:click={createUsers}
      disabled={localDebug ? creating : searchText === "" || creating}
    >
      <i>search</i>
    </button>
  </div>
  {#if promiseBlockUsers !== null}
    {#await promiseBlockUsers}
      <p>ブロック中: {blockProgress} / {blockIds.length}</p>
    {:then blockUsers}
      <p>ブロック完了: {blockProgress} / {blockIds.length}</p>
    {/await}
  {/if}
  {#if promiseUsers !== null}
    {#await promiseUsers then users}
      <button
        transition:slide={duration}
        class="block"
        on:click={block}
        disabled={!Object.values(users).some((user) => user.cheched) ||
          creating}>ブロックする</button
      >
      <div class="users_container" transition:fade={duration}>
        <header>
          <span>
            {#key Object.values(users).filter((user) => user.cheched).length}
              <span
              in:fade={duration}
                >{Object.values(users).filter((user) => user.cheched)
                  .length}</span
              >
            {/key}
            <span>
              / {Object.keys(users).length} 人を選択済み
            </span>
          </span>
          {#if Object.values(users).some((user) => !user.cheched)}
            <button
              on:click={() => {
                Object.keys(users).forEach((key) => {
                  users[key].cheched = true
                })
              }}
            >
              <i>done_all</i>
            </button>
          {:else}
            <button
              on:click={() => {
                Object.keys(users).forEach((key) => {
                  users[key].cheched = false
                })
              }}
            >
              <i>remove_done</i>
            </button>
          {/if}
        </header>
        {#each Object.values(users) as user}
          {#if isFullUser(user.data)}
            <label>
              <img
                src={user.data.profile_image_url_https}
                alt={user.data.screen_name}
              />
              <span class="username">
                {user.data.name}
                <a
                  href={"https://twitter.com/" + user.data.screen_name}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @{user.data.screen_name}
                </a>
              </span>
              <span class="description">
                {user.data.description}
              </span>
              <input type="checkbox" bind:checked={user.cheched} />
            </label>
          {/if}
        {/each}
      </div>
    {:catch error}
      <p>{error.message}</p>
    {/await}
  {/if}
</main>

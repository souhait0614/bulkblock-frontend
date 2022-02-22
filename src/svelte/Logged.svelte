<script lang="ts">
  import type { Users, User, BlockUsers, BlockUser } from "src/types"
  import { isFullUser, Status } from "twitter-d"

  import { fade, slide } from "svelte/transition"
  const duration = { duration: 300 }

  //NOTE テスト用
  import testdata from "../../testdata.json"
  const localDebug = true

  const baseUrl = "https://hisubway.online/articles/bulkblock/"
  const headerUrl = baseUrl + "header.html"
  const footerUrl = baseUrl + "footer.html"
  const sideUrl = baseUrl + "side.html"

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
  let selectedUsers = 0
  async function createUsers() {
    creating = true
    selectedUsers = 0
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
            resolve(result)
          })
          .catch((err) => {
            reject(err)
          })
          .finally(() => (creating = false))
      } catch (error) {
        reject(error)
        creating = false
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
  <h1>BulkBlock</h1>
  <iframe src={headerUrl} />
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
  <div class="sticky_container">
    <div class="top_cover">
      <button class="block" on:click={block} disabled={!selectedUsers}
        >ブロックする</button
      >
    </div>
    {#if promiseBlockUsers !== null}
      {#await promiseBlockUsers}
        <p>ブロック中: {blockProgress} / {blockIds.length}</p>
      {:then}
        <p>ブロック完了: {blockProgress} / {blockIds.length}</p>
      {/await}
    {/if}
    {#if promiseUsers !== null}
      {#await promiseUsers then users}
        {(() => {
          selectedUsers = Object.values(users).filter(
            (user) => user.cheched
          ).length
          return ""
        })()}
        <div class="users_container" transition:fade={duration}>
          <header>
            <span>
              {#key selectedUsers}
                <span in:fade={duration}>{selectedUsers}</span>
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
                <i class="check"
                  >{user.cheched ? "check_box" : "check_box_outline_blank"}</i
                >
                <input type="checkbox" bind:checked={user.cheched} />
              </label>
            {/if}
          {/each}
        </div>
      {:catch error}
        <p>{error.message}</p>
      {/await}
    {/if}
  </div>
</main>
<footer>
  <iframe src={footerUrl} />
</footer>
<iframe src={sideUrl} />
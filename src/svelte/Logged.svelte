<script lang="ts">
  import type { Users, User, BlockUsers, BlockUser } from "src/types"
  import { isFullUser, Status } from "twitter-d"

  //NOTE テスト用
  // import testdata from "../../testdata.json"

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
  let users: Promise<Users> = null
  async function search() {
    return new Promise<{
      statuses: Status[]
    }>(async (resolve, reject) => {
      const data = await get("/search?q="+encodeURIComponent(searchText))
      //NOTE テスト用
      // const data = new Response(JSON.stringify(testdata.search))
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
      const data = await get("/following")
      //NOTE テスト用
      // const data = new Response(JSON.stringify(testdata.following))
      if (data.ok) {
        resolve(data.json())
      } else {
        reject(Error("データの取得に失敗しました: " + data.status))
      }
    })
  }
  // 対象のユーザーを取得したりする
  async function createUsers() {
    users = new Promise<Users>(async (resolve, reject) => {
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
      } catch (error) {
        reject(error)
      }
    })
  }

  let blockIds = []
  let blockProgress = 0
  let blockUsers: Promise<BlockUsers> = null
  async function block() {
    blockIds = Object.values(await users)
      .map((val) => {
        if (!val.cheched) return
        return val.data.id_str
      })
      .filter((e) => e)
    blockUsers = new Promise<BlockUsers>(async (resolve) => {
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
  <button on:click={logout}>ログアウト</button>
</header>
<main id="logged">
  <div class="search_box">
    <input
      type="search"
      id=""
      on:change={(e) => (searchText = e.currentTarget.value)}
    />
    <button on:click={createUsers}>検索する</button>
  </div>
  {#if blockUsers !== null}
    {#await blockUsers}
      <p>ブロック中: {blockProgress} / {blockIds.length}</p>
    {:then blockUsers}
      <p>ブロック完了: {blockProgress} / {blockIds.length}</p>
    {/await}
  {/if}
  {#if users !== null}
    {#await users}
      <p>読み込み中</p>
    {:then users}
      <p>{Object.keys(users).length}人見つかりました</p>
      {#if Object.values(users).some((user) => !user.cheched)}
        <button
          on:click={() => {
            Object.keys(users).forEach((key) => {
              users[key].cheched = true
            })
          }}>全選択</button
        >
      {:else}
        <button
          on:click={() => {
            Object.keys(users).forEach((key) => {
              users[key].cheched = false
            })
          }}>選択解除</button
        >
      {/if}

      <button
        on:click={block}
        disabled={!Object.values(users).some((user) => user.cheched)}
        >ブロック</button
      >

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
    {:catch error}
      <p>{error.message}</p>
    {/await}
  {/if}
</main>
<footer>
  <small> &copy; す,は,さ </small>
</footer>

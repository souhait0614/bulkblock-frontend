<script lang="ts">
  import type { Users, User, BlockUsers, BlockUser } from "src/types"
  import { isFullUser, Status } from "twitter-d"

  import { fade, slide } from "svelte/transition"
  const duration = { duration: 300 }

  import ProgressCircle from "svelte-progresscircle"

  //NOTE テスト用
  import testdata from "../../testdata.json"
  const localDebug = false

  const baseUrl = "https://hisubway.online/articles/bulkblock/"
  const headerUrl = baseUrl + "header/"
  const footerUrl = baseUrl + "footer/"
  const sideUrl = baseUrl + "side/"

  let searchText = ""

  export let cookie

  function post(url) {
    const u = new URL("https://bb.hisubway.online" + url)
    u.searchParams.set("access_token", cookie["access_token"])
    u.searchParams.set("access_token_secret", cookie["access_token_secret"])
    url = u.toString()
    return fetch(url, {
      method: "POST",
    })
  }
  function get(url) {
    const u = new URL("https://bb.hisubway.online" + url)
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
      try {
        const data = localDebug
          ? //NOTE テスト用
            new Response(
              await new Promise((resolve) =>
                setTimeout(() => resolve(JSON.stringify(testdata.search)), 1000)
              )
            )
          : await get("/search?q=" + encodeURIComponent(searchText))
        const json = data.json()
        if (data.ok && !("errors" in json)) {
          resolve(json)
        } else {
          reject(json)
        }
      } catch (error) {
        reject(error)
      }
    })
  }
  // フォロー一覧とか
  async function getFollowing() {
    return new Promise<{
      ids: string[]
    }>(async (resolve, reject) => {
      try {
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
        const json = data.json()
        if (data.ok && !("errors" in json)) {
          resolve(json)
        } else {
          reject(json)
        }
      } catch (error) {
        reject(error)
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

  let blocking = false
  let blockIds = []
  let blockProgress = 0
  let promiseBlockUsers: Promise<BlockUsers> = null
  async function block() {
    blocking = true
    const promiseUsersCopy = { ...(await promiseUsers) }
    promiseUsers = null
    selectedUsers = 0
    blockIds = Object.values(promiseUsersCopy)
      .map(({ cheched, data }) => {
        if (!cheched) return
        return data.id_str
      })
      .filter((e) => e)
    promiseBlockUsers = new Promise<BlockUsers>(async (resolve) => {
      blockProgress = 0
      const result: BlockUsers = {}
      await Promise.all(
        blockIds.map(async (id) => {
          const data = localDebug
            ? new Response(
                await new Promise((resolve) =>
                  setTimeout(
                    () => resolve(JSON.stringify(testdata.following)),
                    1000
                  )
                )
              )
            : await post("/block?id=" + id)
          const { ok, statusText } = data
          result[id] = {
            data: data.ok ? await data.json() : undefined,
            ok,
            statusText,
          }
          blockProgress++
        })
      )
      setTimeout(() => {
        blocking = false
        promiseBlockUsers = null
      }, 2400)
      resolve(result)
    })
  }
</script>

<header>
  <h1>BulkBlock</h1>
  <iframe src={headerUrl} title="header" />
</header>

<main id="logged">
  {#if promiseBlockUsers !== null}
    <div
      class="block_progress"
      transition:slide={{ duration: duration.duration * 2 }}
    >
      <ProgressCircle max={blockIds.length} value={blockProgress}>
        {#await promiseBlockUsers}
          <span class="block_progress_text" in:fade={duration}
            ><span>{Math.round((blockProgress / blockIds.length) * 100)}</span
            >%</span
          >
        {:then blockUsers}
          <svg
            class="block_complete_icon"
            transition:slide={duration}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            ><path d="M0 0h24v24H0V0z" fill="none" /><path
              d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"
            /></svg
          >
        {/await}
      </ProgressCircle>
    </div>
    {#await promiseBlockUsers}
      <div class="users_count" in:slide={duration}>
        <span>{blockIds.length}</span>人をブロックしています……
      </div>
    {:then blockUsers}
      <div class="users_count" in:fade={duration} out:slide={duration}>
        <span>{Object.values(blockUsers).filter(({ ok }) => ok).length}</span
        >人をブロックしました
      </div>
    {/await}
  {/if}
  {#if promiseUsers !== null}
    {#await promiseUsers then users}
      {#if Object.keys(users).length}
        <div class="users_count" transition:slide={duration}>
          <span>{Object.keys(users).length}</span>人見つかりました
        </div>
      {/if}
    {/await}
  {/if}
  <form
    class="search_box"
    on:submit={(e) => {
      e.preventDefault()
      createUsers()
    }}
  >
    <!-- svelte-ignore a11y-autofocus -->
    <input type="text" bind:value={searchText} autofocus />
    <button
      class="search"
      disabled={localDebug
        ? creating || blocking
        : searchText.trim() === "" || creating || blocking}
    >
      <i>search</i>
    </button>
    {#if searchText}
      <button
        transition:fade={duration}
        class="clear"
        on:click={(e) => {
          e.preventDefault()
          searchText = ""
        }}
      >
        <i>clear</i>
      </button>
    {/if}
  </form>
  <div class="sticky_container">
    <div class="top_cover">
      <button
        class="block"
        on:click={() => {
          const scroll = document.body.animate(
            [{ marginTop: `-${window.pageYOffset - 1}px` }, { marginTop: 0 }],
            {
              duration: duration.duration,
              easing: "ease-in-out",
            }
          )
          window.scroll(0, 0)
          blocking = true
          scroll.addEventListener("finish", () => {
            block()
          })
        }}
        disabled={!selectedUsers || blocking}>ブロックする</button
      >
    </div>
    {#if promiseUsers !== null}
      {#await promiseUsers then users}
        {#if Object.keys(users).length}
          {(() => {
            selectedUsers = Object.values(users).filter(
              ({ cheched }) => cheched
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
              {#if Object.values(users).some(({ cheched }) => !cheched)}
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
            {#each Object.values(users) as { data, cheched }}
              {#if isFullUser(data)}
                <button
                  on:click={() => (cheched = !cheched)}
                  on:focus={(e) => {
                    const elem = e.currentTarget
                    const clientTop = elem.getBoundingClientRect().top
                    const topCoverClientHeight = 16 * 5
                    const usersContainerClientHeight = 16 * 2 + 22
                    if (
                      clientTop <=
                      topCoverClientHeight + usersContainerClientHeight
                    )
                      window.scrollTo(
                        0,
                        window.pageYOffset +
                          clientTop -
                          window.innerHeight / 1.5
                      )
                  }}
                >
                  <img
                    loading="lazy"
                    src={data.profile_image_url_https}
                    alt={data.screen_name}
                  />
                  <span class="username">
                    {data.name}
                    <a
                      href={"https://twitter.com/" + data.screen_name}
                      target="_blank"
                      rel="noopener noreferrer"
                      on:click={(e)=>{
                        e.stopPropagation()
                      }}
                    >
                      @{data.screen_name}
                    </a>
                  </span>
                  <span class="description">
                    {data.description}
                  </span>
                  <i class="check"
                    >{cheched ? "check_box" : "check_box_outline_blank"}</i
                  >
                </button>
              {/if}
            {/each}
          </div>
        {:else}
          <p class="error_container" transition:slide={duration}>
            対象のユーザーが見つかりませんでした。<br
            />別の検索ワードをお試しください。
          </p>
        {/if}
      {:catch error}
        <p class="error_container" transition:slide={duration}>
          エラーが発生しました。<br />しばらくしてからもう一度お試しください。
        </p>
      {/await}
    {/if}
  </div>
</main>

<footer>
  <iframe loading="lazy" src={footerUrl} title="footer" />
</footer>
<iframe src={sideUrl} title="side" />

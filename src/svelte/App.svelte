<script lang="ts">
  import Guest from "./Guest.svelte"
  import Logged from "./Logged.svelte"

  function cookieObj(cookie: string) {
    const obj = {}
    for (const [key, val] of cookie.split("; ").map((e) => e.split("="))) {
      obj[key] = val
    }
    return obj
  }
  const cookie = cookieObj(document.cookie)

  const logged = "access_token" in cookie && "access_token_secret" in cookie

  const url = new URL(location.href)

  if (url.searchParams.has("logout")) {
    document.cookie = "access_token=;max-age=-1;"
    document.cookie = "access_token_secret=;max-age=-1;"
    location.href = location.origin
  }
</script>

{#if logged}
  <Logged {cookie} />
{:else}
  <Guest />
{/if}

<script lang="ts" context="module">
  const baseUrl = "https://hisubway.online/articles/bulkblock/"
  const footerUrl = baseUrl + "footer.html"
  const sideUrl = baseUrl + "side.html"

  let href = "/login"
  if (location.host === "hisubway.online")
    href = "http://bulkblock.hisubway.online/login?hisubway=true"
</script>

<main id="guest">
  <div>
    <h1>BulkBlock</h1>
    <p>
      アプリの説明を入力アプリの説明を入力アプリの説明を入力アプリの説明を入力アプリの説明を入力アプリの説明を入力
    </p>
    <p>
      アプリの説明を入力アプリの説明を入力アプリの説明を入力アプリの説明を入力アプリの説明を入力アプリの説明を入力
    </p>
  </div>
  <a class="block" {href}>Twitterでログイン</a>
</main>
<footer>
  <iframe src={footerUrl} />
</footer>
<iframe src={sideUrl} />

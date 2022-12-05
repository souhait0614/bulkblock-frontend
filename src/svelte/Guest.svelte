<script lang="ts" context="module">
  const baseUrl = "https://hisubway.online/articles/bulkblock/"
  const footerUrl = baseUrl + "footer/"
  const sideUrl = baseUrl + "side/"

  let href = "/login"
  if (location.host === "hisubway.online")
    href = "http://bb.hisubway.online/login?hisubway=true"
</script>

<main id="guest">
  <a
    class="hisubway"
    href="https://hisubway.online"
    target="_blank"
    rel="noopener noreferrer"
  >
    <img
      src="https://hisubway.online/transfer/hisubway/img/favicon_512.png"
      alt="HiSubway"
    /></a
  >
  <div>
    <h1>BulkBlock</h1>
    <section>
      <h2>About</h2>
      <p>
        キーワードをTwitterで検索し、見つかったアカウントを一括ブロックできるツールです。使い方は、<a
          href="https://hisubway.online/articles/bulkblock/help"
          target="_blank"
          rel="noopener noreferrer">BulkBlockの使い方</a
        >をお読みください。
      </p>
      <p>
        特定のアカウントにリプライをしているアカウント、特定のツイートを引用しているアカウント、Botを使ってスパムツイートをしているアカウントなど、詳細な絞り込みも可能です。詳しくは<a
          href="https://hisubway.online/articles/bulkblock/commands"
          target="_blank"
          rel="noopener noreferrer">検索コマンドについて</a
        >から。
      </p>
      <p>
        このツールでは、Twitterアカウントによる認証が必要です。ツイートやフォローの権限が要求されますが、このツールではブロック以外の操作はしません。
      </p>
    </section>
  </div>
  <a class="block" {href}><span>Twitterでログイン</span></a>
</main>
<footer>
  <iframe loading="lazy" src={footerUrl} title="footer" />
</footer>
<iframe src={sideUrl} title="side" />

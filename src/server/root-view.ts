import { serializePage, type RootView } from "@hono/inertia";

type ManifestEntry = { file: string; css?: string[] };
type Manifest = Record<string, ManifestEntry>;

// production: `vite build` (= `@cloudflare/vite-plugin`) が
// `dist/client/client/.vite/manifest.json` を生成する。`import.meta.glob` を
// eager + 単一パスで呼んで worker bundle に embed する。dev 時はファイルが
// 存在せず glob 結果が空オブジェクトになるが、dev branch はこの値を使わない。
// dev / prod の build 順序は client → worker なので、worker bundle 時点で
// manifest は disk 上に存在する。
const manifestGlob = import.meta.glob<{ default: Manifest }>(
  "../../dist/client/client/.vite/manifest.json",
  { eager: true },
);
const manifest = Object.values(manifestGlob)[0]?.default ?? {};
const prodEntry: ManifestEntry | undefined = manifest["src/client/main.tsx"];

// dev: Vite middleware が /src/client/main.tsx を直接サーブする。
//   @vitejs/plugin-react の Fast Refresh preamble を挿入してから読み込む。
//   preamble が無いと React 初期化時に
//   「@vitejs/plugin-react can't detect preamble」例外で画面が真っ白になる。
// prod: manifest から hashed entry を引いて <script> と <link rel="stylesheet">
//   を emit する。`src/client/main.tsx:1` で `./styles/main.css` を import
//   しているので CSS link を忘れると Tailwind が当たらない (画面は出るが
//   スタイル無しになる)。
const entryScripts = import.meta.env.DEV
  ? `<script type="module" src="/@vite/client"></script>
    <script type="module">
      import RefreshRuntime from '/@react-refresh'
      RefreshRuntime.injectIntoGlobalHook(window)
      window.$RefreshReg$ = () => {}
      window.$RefreshSig$ = () => (type) => type
      window.__vite_plugin_react_preamble_installed__ = true
    </script>
    <script type="module" src="/src/client/main.tsx"></script>`
  : prodEntry
    ? [
        ...(prodEntry.css ?? []).map((f) => `<link rel="stylesheet" href="/${f}">`),
        `<script type="module" src="/${prodEntry.file}"></script>`,
      ].join("\n    ")
    : "";

// ブランド / OGP メタは worker bundle に固定値で埋め込む。
// - title: ページごとに差し替えたい場合は Inertia の props 経由でクライアント側 (e.g. Helmet 相当)
//   で上書きする想定。SSR 段階では brand 名のみ固定で十分。
// - favicon は SVG を第一候補とし、PNG (16/32) と ICO (16+32+48 pack) を fallback で並べる。
//   ・モダンブラウザ: `image/svg+xml` の SVG を採用
//   ・Safari <15 / 古い Firefox: PNG または ICO に fallback
//   ・/favicon.ico はブラウザ自動 fetch のため `<link>` の有無に関わらず存在を期待される
// - og:image / twitter:image / apple-touch-icon は X/Facebook/LinkedIn/iOS が SVG を
//   受理しないため PNG を参照する。
// - ラスタ系資産 (favicon.ico / favicon-{16,32}x{}.png / apple-touch-icon.png / og-image.png) は
//   `scripts/build-brand-images.mjs` が SVG ソースから Playwright で書き出して `public/` に
//   commit 済み。SVG を更新した時はスクリプトを再実行する。
// - APP_URL は env 由来で worker bundle 時点では未確定 (`.dev.vars` / dashboard secret) のため、
//   og:url はクライアント側 absolute URL ではなくサイト相対パスのみを出す。絶対 URL が必要
//   なクローラ向けには将来 request の host から都度組み立てる方式に切り替える。
const BRAND_NAME = "Private Todo";
const BRAND_DESCRIPTION =
  "Cloudflare Workers + Hono + Inertia + React + Better Auth + Drizzle (D1) で動く、ログイン制の小さな Todo アプリ。";

const brandMeta = `<meta name="description" content="${BRAND_DESCRIPTION}" />
    <meta name="theme-color" content="#10b981" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
    <link rel="shortcut icon" href="/favicon.ico" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${BRAND_NAME}" />
    <meta property="og:title" content="${BRAND_NAME}" />
    <meta property="og:description" content="${BRAND_DESCRIPTION}" />
    <meta property="og:image" content="/og-image.png" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${BRAND_NAME}" />
    <meta name="twitter:description" content="${BRAND_DESCRIPTION}" />
    <meta name="twitter:image" content="/og-image.png" />`;

export const rootView: RootView = (page) => `<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${BRAND_NAME}</title>
    ${brandMeta}
    ${entryScripts}
  </head>
  <body>
    <div id="app"></div>
    <script id="page" data-page="app" type="application/json">${serializePage(page)}</script>
  </body>
</html>`;

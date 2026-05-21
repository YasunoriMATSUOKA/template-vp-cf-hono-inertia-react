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

export const rootView: RootView = (page) => `<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Todo</title>
    ${entryScripts}
  </head>
  <body>
    <div id="app"></div>
    <script id="page" data-page="app" type="application/json">${serializePage(page)}</script>
  </body>
</html>`;

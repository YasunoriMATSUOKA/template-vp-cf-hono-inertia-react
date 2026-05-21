import { serializePage, type RootView } from "@hono/inertia";

// dev: Vite middleware が /src/client/main.tsx を直接サーブする。
// prod: @cloudflare/vite-plugin がクライアントビルドを Workers Assets に焼き、
//   manifest.json から実エントリを引く。下では簡略化のため固定パスを書いているが、
//   ビルド後のハッシュ付きファイル名に正確に追従したい場合は
//   import manifest from '../../dist/client/.vite/manifest.json' assert { type: 'json' }
//   で参照するか、@hono/vite-ssg 系のヘルパーに置き換える。
// dev: @vitejs/plugin-react が必要とする Fast Refresh preamble を挿入してから
//   /src/client/main.tsx を読み込む。preamble が無いと React 初期化時に
//   「@vitejs/plugin-react can't detect preamble」例外で画面が真っ白になる。
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
  : `<script type="module" src="/assets/client.js"></script>`;

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

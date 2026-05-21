# Project conventions for AI coding assistants

このファイルはこのリポジトリで作業する全 AI コーディングアシスタント向けの **canonical guidance** です。

以下のファイルは `CLAUDE.md` への symlink です — 編集は `CLAUDE.md` のみに行ってください:

- `AGENTS.md` (OpenAI Codex CLI)
- `GEMINI.md` (Google Gemini CLI)
- `.github/copilot-instructions.md` (GitHub Copilot Chat / Coding Agent)
- `.cursorrules` (Cursor, legacy format で auto-apply)
- `.windsurfrules` (Windsurf, legacy format で auto-apply)

ツール固有の挙動 (permissions, contextFileName 等) は以下の個別 settings に置いています:

- `.claude/settings.json` — Claude Code の共有 permissions
- `.gemini/settings.json` — Gemini CLI のプロジェクト設定

---

## Overview

vite-plus を起点に、Cloudflare Workers + Hono + Inertia.js + React 19 で SSR/CSR を一体運用するテンプレート。
データ層は Cloudflare D1 + Drizzle ORM、認証は Better Auth、UI は Tailwind CSS v4 + DaisyUI 5。
TypeScript 6 系。テストは Vitest (unit) / Playwright (E2E) / Storybook + test-runner (visual + interaction)。

## Directory layout

- `src/client/` — React アプリ (Inertia pages, components)
- `src/server/` — Hono Worker エントリ、API、認証、Inertia adapter
- `e2e/` — Playwright E2E specs
- `migrations/` — Drizzle 自動生成の D1 マイグレーション (`pnpm db:generate` 経由のみ追加)
- `scripts/` — 開発支援スクリプト (young-deps スキャナ等)
- `.storybook/` — Storybook 設定
- `.github/` — Dependabot, GitHub Actions workflow

## Common commands

| 目的                                                                     | コマンド                                                                               |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| 開発サーバ                                                               | `pnpm dev`                                                                             |
| 本番ビルド                                                               | `pnpm build`                                                                           |
| 型 + lint まとめ                                                         | `pnpm check`                                                                           |
| Vitest watch                                                             | `pnpm test`                                                                            |
| Vitest 単発                                                              | `pnpm test:run`                                                                        |
| Playwright E2E                                                           | `pnpm e2e`                                                                             |
| Playwright UI モード                                                     | `pnpm e2e:ui`                                                                          |
| Storybook 起動                                                           | `pnpm storybook`                                                                       |
| Storybook ビルド                                                         | `pnpm build-storybook`                                                                 |
| Storybook test                                                           | `pnpm test-storybook`                                                                  |
| D1 スキーマ → migration                                                  | `pnpm db:generate`                                                                     |
| ローカル D1 適用                                                         | `pnpm db:migrate:local`                                                                |
| 本番 D1 適用                                                             | `pnpm db:migrate:remote`                                                               |
| Cloudflare デプロイ                                                      | `pnpm deploy`                                                                          |
| Worker 型生成                                                            | `pnpm cf-typegen`                                                                      |
| npm 公式署名検証                                                         | `pnpm audit:signatures`                                                                |
| 1Password から secrets 同期 (`.env` / `.dev.vars` 生成、local vault)     | `pnpm secrets:pull:local` (引数省略時の `pnpm secrets:pull` も local にフォールバック) |
| 1Password から secrets 同期 (prod vault で同ファイルを上書き)            | `pnpm secrets:pull:prod` (prod 操作後は local に戻すこと)                              |
| 1Password から secrets 同期 (CI 内専用、local vault の `.dev.vars` のみ) | `pnpm secrets:pull:ci` (要 `OP_SERVICE_ACCOUNT_TOKEN`、local vault を流用)             |
| GitHub Actions の SHA pin を local 更新                                  | `pinact run` (新規 action を足した時に `@vN` → full SHA に変換)                        |

## Auto-generated artifacts

開発者が手で意識せずに済むよう、生成系コマンドの大半は lifecycle hook で自動発火する。
**`migrations/*.sql` だけは SQL 差分の目視 review を要する** ため例外として手動。

| 生成物                                                                                 | ソース                                           | 手動コマンド            | 自動 trigger                                                        | commit?         |
| -------------------------------------------------------------------------------------- | ------------------------------------------------ | ----------------------- | ------------------------------------------------------------------- | --------------- |
| `worker-configuration.d.ts`                                                            | `wrangler.jsonc`                                 | `pnpm cf-typegen`       | `postinstall` / `predev` / `prebuild`                               | NO (gitignored) |
| `migrations/*.sql`, `migrations/meta/_journal.json`                                    | `src/server/db/schema.ts`                        | `pnpm db:generate`      | **手動** — SQL 差分を必ず review してから commit                    | YES             |
| local D1 state (`.wrangler/state/`)                                                    | `migrations/*.sql`                               | `pnpm db:migrate:local` | `predev`                                                            | NO (gitignored) |
| `src/client/pages.gen.ts`                                                              | `src/client/pages/**/*.tsx`                      | (なし)                  | `@hono/inertia/vite` plugin が dev/build 中に自動再生成             | NO (gitignored) |
| `src/server/db/schema.ts` の auth 系テーブル (user / session / account / verification) | Better Auth (Kysely D1 adapter) の hardcoded SQL | (CLI なし)              | **手動同期** — Better Auth のバージョンを上げた際に列名追加等を反映 | YES             |

補足:

- **auth テーブルの列名 (camelCase)** は Better Auth 内蔵の Kysely D1 adapter が hardcoded SQL で発行する仕様に合わせる必要があり、Drizzle 慣習 (snake_case) より優先される。`src/server/db/schema.ts` のコメントに記載済み
- 旧 `auth:generate` (= `better-auth generate`) スクリプトは削除済み。本プロジェクトは Kysely D1 adapter で動かしており、Drizzle adapter 専用の `better-auth generate` で生成すべき対象がない
- `pnpm db:generate` 直後は **必ず `migrations/*.sql` を `git diff` で確認** し、想定外の DROP / ALTER が混入していないか目視する
- lifecycle hook の中身は `package.json` の `postinstall` / `predev` / `prebuild` を参照

## Toolchain

- Node `>=20.0.0`
- pnpm `11.1.3` (`packageManager` で固定、`engineStrict: true` で範囲外は install/run fail)
- 推奨: `corepack enable` してから pnpm を呼ぶ (CI は packageManager から自動解決)

## Supply chain policy (重要 — AI が破ってはいけないルール)

`pnpm-workspace.yaml` で以下を強制しています:

- **`saveExact: true`** — 新規 `pnpm add` は exact 版で書く。`^` / `~` を勝手に付けない
- **`minimumReleaseAge: 10080`** (分 = 7 日) — publish から 7 日未満の version は install 不可。
  例外は `minimumReleaseAgeExclude` (grandfather list) に列挙
- **`engineStrict: true`** — `engines.node` / `engines.pnpm` 範囲外で install/run fail
- **`verifyDepsBeforeRun: warn`** — node_modules と lockfile が drift していたら起動時に警告
  (元は `error` だが、`pnpm install --config.minimum-release-age=0` で install した state と
  workspace 設定の drift が原因で `pnpm <cmd>` が全部 fail する UX を避けるため `warn` に
  ダウングレード済み。CI 側は `sed` で念のため `warn` に揃える step を残しているが、
  workspace.yaml が既に `warn` なので no-op として動作する)
- **`overrides`**:
  - `esbuild: '>=0.24.3'` — GHSA-67mh-4wv8-2f99 (dev server リクエスト偽装) patch
  - `ws: '>=8.20.1'` — GHSA-58qx-3vcg-4xpx (uninitialized memory disclosure) patch

  → transitive 経路の脆弱性 patch を保つため、勝手に外さない。

GitHub Actions 側も同じ思想で、`.github/workflows/*.yml` の `uses:` は **full SHA + `# vX.Y.Z` comment** で pin する。
新規 action を足した時は `pinact run` でローカル変換、CI の audit job で `pinact --check` 相当の verify が走り、
mutable ref への regression は merge gate で fail する。SHA bump は Dependabot (`github-actions` ecosystem) が
SHA と comment を一緒に更新する。

新規パッケージ追加時に `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` を見たら:

1. その version がまだ 7 日経っていない → 待つ (最も安全)
2. 急ぎ必要 → ユーザーに相談の上 `minimumReleaseAgeExclude` に追記
3. CI と同じく一時 override → `pnpm install --config.minimum-release-age=0`
   (Dependabot security PR マージ直後のローカル install 等、CI 側で audit ゲートを通っている場合のみ)

## CI gate (`.github/workflows/ci.yml`)

PR と main push で 2 job 構成。workflow top-level に `permissions: contents: read` を置き、
`GITHUB_TOKEN` を default で read-only に絞っている (defense in depth)。

### `audit` job (fail-fast の門)

1. checkout
2. **pinact verify** (`suzuki-shunsuke/pinact-action`, `skip_push: true`) — `.github/workflows/**` の
   `uses:` が full SHA + `# vX.Y.Z` comment 形式に pin されているか検証。unpinned/mutable ref に
   regression したら ここで fail
3. `pnpm audit` — lockfile ベース、install 前に既知脆弱性ゼロを確認
4. `pnpm install --frozen-lockfile --config.minimum-release-age=0` — CI 上のみ cooldown 無視
5. `pnpm audit:signatures` — 公式 npm 署名検証 (install 後の node_modules ツリーが必要)

### `verify` job (audit に依存、matrix で並列)

matrix: `[check, build, test, build-storybook, test-storybook, e2e]`。各 task は
独立 runner で並列実行され、checkout → pnpm/Node setup → install → 該当 task の順。
Playwright を要する `e2e` / `test-storybook` 内で `playwright install --with-deps chromium`。

`e2e` task のみ `.dev.vars` (Better Auth / Google OAuth credentials) が必要なので、
**`matrix.task == 'e2e'` 限定**で 2 step が走る (install 後・task switch 前):

1. `Install 1Password CLI` (`1password/install-cli-action`)
2. `Inject .dev.vars from 1Password` — この step だけが env に
   `OP_SERVICE_ACCOUNT_TOKEN` (GitHub repo secret) を持ち、`pnpm secrets:pull:ci` で
   `template-vp-cf-hono-inertia-react-local` vault (local 開発と共用) の `.dev.vars`
   Item を `.dev.vars` ファイルに展開する。Service Account はこの vault に read-only
   でスコープする

token は inject step のみで env 化し、後続の e2e 実行 step には伝播しない。他の matrix
task (`check`/`build`/`test`/`build-storybook`/`test-storybook`) には token も
`.dev.vars` も渡らない。

e2e 実行直後 (`if: always()` で失敗時も走る) に `.dev.vars` / `.env` を `rm -f` で削除し、
artifact upload 等で secret がリークしないようにする。GitHub-hosted runner は ephemeral
だが、露出窓を最小化する defense in depth。

設計の中核: **CI が緑 = audit が通っている = age 制約を一時 skip しても安全**。
さらに **secret は audit gate 通過後の最小限の 1 step でしか露出しない**。

`.pinact.yaml` は `pinact init` の default 設定のまま。新規 action を追加した時はローカルで
`pinact run` を叩けば SHA pin に変換される。

## Dependabot policy (`.github/dependabot.yml`)

2 ecosystem を並走させる。両方とも daily / 最大 5 PR / 7 日 cooldown / patch+minor を 1 PR に group:

- **npm** — `package.json` / `pnpm-lock.yaml`。commit prefix は `deps` / `deps-dev` (dev dep)
- **github-actions** — `.github/workflows/**`。commit prefix は `ci`。`uses:` が
  `<full-sha> # vX.Y.Z` 形式で pin されているため、Dependabot は SHA と version comment を
  同時に更新する

security update は cooldown 無視で即 PR (Dependabot 標準動作、追加 config 不要)。
security PR マージ直後にローカルで install が fail する場合の workaround は `README.md` の同名節を参照。

## Testing layers

- **Vitest** (`pnpm test:run`) — unit、`vitest.config.ts`
- **Playwright** (`pnpm e2e`) — E2E、`playwright.config.ts`、artifact は `test-results/` / `playwright-report/`
- **Storybook + test-runner** (`pnpm test-storybook`) — visual + interaction、
  `jest-image-snapshot` で `__image_snapshots__/` に screenshot diff

## Type check

```
pnpm exec tsc --noEmit --ignoreDeprecations 6.0
```

`--ignoreDeprecations 6.0` は TS 6.0 系の deprecation 警告抑制 (依存側がまだ古い API を使うため)。
依存が追従したら外す。

## 触らないもの

- `pnpm-workspace.yaml` の supply chain ブロック (`allowBuilds` / `overrides` / `minimumReleaseAge*` /
  `saveExact` / `engineStrict` / `verifyDepsBeforeRun` / `fund`)
- `.github/workflows/ci.yml` / `.github/dependabot.yml` (合意済みの構成)
- `migrations/` の既存ファイル (新規追加は `pnpm db:generate` 経由のみ)
- `worker-configuration.d.ts` (自動生成、`pnpm cf-typegen` で更新)
- `.dev.vars` / `.env` (シークレット、`.dev.vars.example` / `.env.example` を「どの変数が必要か」の
  source of truth として残す。値の同期は `.dev.vars.1password.tpl` / `.env.1password.tpl` +
  `pnpm secrets:pull` で行う — 詳細は `README.md` の "ローカル開発 setup" 節)

## AI は実行しないコマンド

production / shared state に影響するため `.claude/settings.json` で deny 済み:

- `pnpm deploy` / `wrangler deploy`
- `pnpm db:migrate:remote`
- `git push --force` / `git push -f`
- `rm -rf`

これらが必要な場合は人間オペレーターに依頼してください。

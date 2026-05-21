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

| 目的                    | コマンド                 |
| ----------------------- | ------------------------ |
| 開発サーバ              | `pnpm dev`               |
| 本番ビルド              | `pnpm build`             |
| 型 + lint まとめ        | `pnpm check`             |
| Vitest watch            | `pnpm test`              |
| Vitest 単発             | `pnpm test:run`          |
| Playwright E2E          | `pnpm e2e`               |
| Playwright UI モード    | `pnpm e2e:ui`            |
| Storybook 起動          | `pnpm storybook`         |
| Storybook ビルド        | `pnpm build-storybook`   |
| Storybook test          | `pnpm test-storybook`    |
| D1 スキーマ → migration | `pnpm db:generate`       |
| ローカル D1 適用        | `pnpm db:migrate:local`  |
| 本番 D1 適用            | `pnpm db:migrate:remote` |
| Cloudflare デプロイ     | `pnpm deploy`            |
| Worker 型生成           | `pnpm cf-typegen`        |
| npm 公式署名検証        | `pnpm audit:signatures`  |

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
- **`verifyDepsBeforeRun: error`** — node_modules と lockfile が drift していたら起動 fail
- **`overrides`**:
  - `esbuild: '>=0.24.3'` — GHSA-67mh-4wv8-2f99 (dev server リクエスト偽装) patch
  - `ws: '>=8.20.1'` — GHSA-58qx-3vcg-4xpx (uninitialized memory disclosure) patch

  → transitive 経路の脆弱性 patch を保つため、勝手に外さない。

新規パッケージ追加時に `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` を見たら:

1. その version がまだ 7 日経っていない → 待つ (最も安全)
2. 急ぎ必要 → ユーザーに相談の上 `minimumReleaseAgeExclude` に追記
3. CI と同じく一時 override → `pnpm install --config.minimum-release-age=0`
   (Dependabot security PR マージ直後のローカル install 等、CI 側で audit ゲートを通っている場合のみ)

## CI gate (`.github/workflows/ci.yml`)

PR と main push で以下の順序で fail-fast:

1. `pnpm audit` — lockfile ベース、install 前に既知脆弱性ゼロを確認
2. `pnpm install --frozen-lockfile --config.minimum-release-age=0` — CI 上のみ cooldown 無視
3. `pnpm audit:signatures` — 公式 npm 署名検証 (install 後の node_modules ツリーが必要)
4. `pnpm exec tsc --noEmit --ignoreDeprecations 6.0` — 型チェック
5. `pnpm test:run` — Vitest
6. `pnpm exec playwright install --with-deps chromium`
7. `pnpm e2e` — Playwright
8. `pnpm build` — 本番ビルド成立確認 (deploy はしない)

設計の中核: **CI が緑 = audit が通っている = age 制約を一時 skip しても安全**。

## Dependabot policy (`.github/dependabot.yml`)

- npm エコシステム / daily / 最大 5 PR
- routine update: 7 日 cooldown 後に PR、patch + minor は 1 PR に group 化、major は個別
- security update: cooldown 無視で即 PR (Dependabot 標準動作、追加 config 不要)

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
- `.dev.vars` / `.env` (シークレット、`.dev.vars.example` / `.env.example` を真正性の基準にする)

## AI は実行しないコマンド

production / shared state に影響するため `.claude/settings.json` で deny 済み:

- `pnpm deploy` / `wrangler deploy`
- `pnpm db:migrate:remote`
- `git push --force` / `git push -f`
- `rm -rf`

これらが必要な場合は人間オペレーターに依頼してください。

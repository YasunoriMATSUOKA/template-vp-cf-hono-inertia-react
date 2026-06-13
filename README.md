# template-vp-cf-hono-inertia-react

[![CI](https://github.com/YasunoriMATSUOKA/template-vp-cf-hono-inertia-react/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/YasunoriMATSUOKA/template-vp-cf-hono-inertia-react/actions/workflows/ci.yml?query=branch%3Amain)

Vite + Cloudflare Workers + Hono + Inertia.js + React テンプレート。

## Generated files & lifecycle hooks

開発者が手で叩くべきコマンドは最小限になるよう、`package.json` の `scripts` で
lifecycle hook を仕掛けてあります。普段は気にせず `pnpm install` → `pnpm dev` で動きます。

- **`pnpm install`** → `postinstall` で `pnpm cf-typegen` が走り `worker-configuration.d.ts` を生成。clone 直後でも `pnpm exec tsc` が通る。
- **`pnpm dev`** → `predev` で `cf-typegen` + `db:migrate:local` が先に走る。ローカル D1 に未適用 migration があれば自動適用される。
- **`pnpm build`** → `prebuild` で `cf-typegen` が走り、最新の wrangler bindings 型でビルドされる。
- **`src/client/pages.gen.ts`** → `@hono/inertia/vite` が dev/build 中に自動再生成 (手動操作不要)。

**手動で叩く必要が残るのは 1 つだけ**:

- `pnpm db:generate` — `src/server/db/schema.ts` を変更したあと、`migrations/*.sql` を新規生成する。
  生成された SQL は `git diff` で目視 review してから commit する (DROP / ALTER の混入チェック)。
  生成後は次回 `pnpm dev` 時に `predev` が `pnpm db:migrate:local` で自動適用してくれる。

詳細・背景は `CLAUDE.md` の「Auto-generated artifacts」セクションを参照。

## ローカル開発 setup (.env / .dev.vars を 1Password から pull)

`.env` (drizzle-kit が D1 HTTP API で使う) と `.dev.vars` (Wrangler が runtime で読む) は
いずれも gitignored で、`.env.example` / `.dev.vars.example` に必要な変数名だけが書いてあります。
値は 1Password の vault に集約し、`op` CLI で template → 実ファイル展開する運用です。

### 初期 setup (1 回だけ)

1. 1Password CLI をインストール: `brew install 1password-cli` (Windows は `winget install 1password-cli`)
2. 1Password デスクトップアプリの **Developer → Integrate with 1Password CLI** を ON にして
   biometric / touch-ID で sign-in できるようにする
3. vault `template-vp-cf-hono-inertia-react-local` に下記 2 Item を作る (Secure Note 型、
   field 名は env var 名と同一、field type は `password` / concealed 推奨):
   - Item `.env` — `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_DATABASE_ID` / `CLOUDFLARE_D1_TOKEN`
   - Item `.dev.vars` — `APP_URL` / `BETTER_AUTH_SECRET` / `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
     (local vault では `APP_URL=http://localhost:5173` を入れておく。`APP_URL` は厳密には secret ではないが、他の field と同じ Item に置いて pull の往復を増やさない)
4. アクセス確認: `op vault get template-vp-cf-hono-inertia-react-local`

### 日常の操作

```bash
pnpm secrets:pull:local   # local vault から `.env` / `.dev.vars` を再生成
pnpm secrets:pull:prod    # prod vault から同ファイルを上書き (prod ops 終了後は local に戻す)
pnpm secrets:pull         # 引数省略時は local (`secrets:pull:local` のエイリアス)
pnpm dev                  # 通常起動 (predev で D1 migration が自動適用)
```

`.env` / `.dev.vars` は Wrangler / drizzle-kit が固定パスで読むため 1 セットしか持てない。
`secrets:pull:prod` は **同じファイルを prod 値で上書きする**ので、`pnpm db:migrate:remote`
等の prod 操作が終わったら `pnpm secrets:pull:local` で戻す運用にする。

`pnpm secrets:pull*` は `predev` などに組み込んでいない。`pnpm dev` ごとに op の
biometric 認証を求められる摩擦を避けるため、**secret を rotate した時 / 環境を切替える
時だけ手動で叩く** スタイル。

### 変数を増やす場合

3 箇所を同時に更新する:

1. `.env.example` (or `.dev.vars.example`) に変数名と placeholder
2. `.env.1password.tpl` (or `.dev.vars.1password.tpl`) に `op://...` 参照
3. 1Password vault の対応 Item に field を追加

`.env.example` / `.dev.vars.example` は「どの変数が必要か」の source of truth として
残します (1Password を使わない reviewer や AI が必要変数を把握できるように)。

### 別環境を扱う場合 (local / prod 以外)

1Password 側に同じ Item / Field 構造で `template-vp-cf-hono-inertia-react-<env>` を
作って `pnpm secrets:pull <env>` または `APP_ENV=<env> pnpm secrets:pull` で切り替える。
template ファイルとスクリプトは変更不要。`secrets:pull:<env>` の wrapper が欲しい場合は
`package.json` に 1 行足す (例: `"secrets:pull:staging": "node scripts/secrets-pull.mjs staging"`)。

### CI (GitHub Actions) からの pull

CI も **`template-vp-cf-hono-inertia-react-local` vault を流用**する (CI 専用 vault は
作らない)。e2e では Worker ランタイム秘密 (`.dev.vars` Item) に加えて Mailosaur 資格情報
(`.env` Item の `MAILOSAUR_*`) も要るため、`secrets:pull:ci` は `.dev.vars` と `.env` の
両方を pull する。Service Account は local vault に read-only でスコープして発行する。

**初期 setup (1 回だけ)**:

1. 1Password の Developer 設定で **Service Account** を発行し、
   `template-vp-cf-hono-inertia-react-local` vault に **read-only** でアクセスを付与する。
   token を取得
2. GitHub repo の **Settings → Secrets and variables → Actions → Repository secrets**
   に `OP_SERVICE_ACCOUNT_TOKEN` として token を登録 (この 1 secret だけが必要)

注意: Service Account を read-only に絞ることで、CI 経由で local vault の secret が
書き換えられる事故を防ぐ。worker runtime で使う `BETTER_AUTH_SECRET` / `GOOGLE_*` が
local 開発と CI で同じになるので、テスト用に独立した値を持たせたい場合は
`template-vp-cf-hono-inertia-react-ci` 等を別途用意して `secrets:pull:ci` を切替える
構成にできる (その場合は `package.json` の `secrets:pull:ci` の引数を `ci .dev.vars` に戻す)。

**CI 内の挙動** (`.github/workflows/ci.yml`):

- `OP_SERVICE_ACCOUNT_TOKEN` は **audit job では一切参照されない** (`pnpm audit` /
  `pnpm install` / `pnpm audit:signatures` / pinact verify は secret 不要)
- audit gate を通過した後の `verify` job でも、**`matrix.task == 'e2e'`** の 2 step
  だけが secret に触れる:
  - `Install 1Password CLI` — `1password/install-cli-action` (SHA pinned)
  - `Inject .dev.vars from 1Password` — この step 限定で `OP_SERVICE_ACCOUNT_TOKEN`
    を env に置き、`pnpm secrets:pull:ci` (内部で `local` vault から `.dev.vars` のみ
    生成) を実行
- 後続の e2e 実行 step は token を持たず、disk 上の `.dev.vars` 経由でだけ secret に
  アクセスする
- e2e 実行直後 (`if: always()` で失敗時も) に `.dev.vars` / `.env` を `rm -f` で削除し、
  後続 step / artifact upload に secret が混入しないようにする
- 他の matrix task (`check` / `build` / `test` / `build-storybook` /
  `test-storybook`) は token も `.dev.vars` も持たずに完走する

## GitHub Actions hardening

このリポジトリの `.github/workflows/ci.yml` は以下で hardening されています:

- workflow の top-level に `permissions: contents: read` を置き、`GITHUB_TOKEN` を
  read-only に絞っている (defense in depth)
- audit job で [`pinact`](https://github.com/suzuki-shunsuke/pinact) を `skip_push` モードで走らせ、
  `.github/workflows/**` の `uses:` が full SHA + `# vX.Y.Z` comment 形式に pin
  されているかを検証する。手で `@v4` などの mutable ref に書き戻された PR は CI で fail
- 新規 action を追加する時はローカルで `pinact run` を叩くと SHA pin 形式に変換される
- Dependabot は npm + github-actions の 2 ecosystem を回しており、github-actions 側は
  SHA + comment を同時に bump する。`.pinact.yaml` は `pinact init` の default のまま
- 1Password Service Account Token (`OP_SERVICE_ACCOUNT_TOKEN` repo secret) は audit
  gate 通過後の `verify` job 内、**`matrix.task == 'e2e'` の inject step 限定**でしか
  env に置かれない。詳細は上記「CI (GitHub Actions) からの pull」節を参照

## Chromatic (ビジュアル回帰 — クラウド)

Storybook と Playwright (E2E) の実行結果を [Chromatic](https://www.chromatic.com) に連携し、
クラウド上でビジュアル diff のレビューができる。`storybook-addon-vis` のローカル/CI 完結な
ビジュアル回帰 (`__vis__/`) は併用しており、Chromatic はクラウド側のレビュー基盤として追加している。

> **Chromatic は Storybook と E2E (Playwright) で別プロジェクトを要求する。**同一 repo に
> リンクした 2 つの Chromatic project を作り、それぞれの project token で CI を 2 回走らせる構成。
> token も 2 つ必要 ([Combine stories & E2E](https://www.chromatic.com/docs/combine-stories-e2e/))。

- **専用 workflow**: `.github/workflows/chromatic.yml` (ci.yml には手を入れない)。2 job 構成:
  - `chromatic-storybook` — `pnpm build-storybook` の出力を [`chromaui/action`](https://github.com/chromaui/action) でアップロード
  - `chromatic-playwright` — E2E を実行し各ページの archive を生成、`chromatic --playwright` でアップロード
    (`pnpm dev` が `.dev.vars` を読むため ci.yml の e2e task と同じ 1Password 注入を行う)
- E2E spec は `import { test, expect } from "@chromatic-com/playwright"` (Playwright の薄いラッパー)。
  Chromatic 非実行時は通常の Playwright として動くので、ci.yml の `e2e` task はそのまま緑のまま。
  特定地点で追加スナップショットが欲しい場合のみ `takeSnapshot(page, testInfo)` を足す。

### 手作業の初期 setup

AI / コードでは完結しない。以下を人間オペレーターが 1 回だけ行う:

1. <https://www.chromatic.com> に GitHub でサインインし、この repo をリンクした Chromatic project を
   **2 つ**作成する (例: `...-storybook` と `...-playwright`)。それぞれの **project token** を取得する。
2. repo の **Settings → Secrets and variables → Actions** に 2 つの token を登録する:
   - `CHROMATIC_STORYBOOK_PROJECT_TOKEN` — Storybook 用 project の token
   - `CHROMATIC_PLAYWRIGHT_PROJECT_TOKEN` — Playwright (E2E) 用 project の token

   (`OP_SERVICE_ACCOUNT_TOKEN` は CI の e2e で使う既存 secret を流用するので追加作業なし。)

3. 最初の Chromatic 実行で取得したスナップショットが各 project の baseline になる。以降の変化が diff
   としてレビュー対象になる。`exitZeroOnChanges: true` のため視覚変化は CI 失敗にせずレビュー扱い
   (必ずゲートにしたい場合は `chromatic.yml` の同設定を外す)。

### ローカルから手動実行

token は `.dev.vars` / `.env` には入れず、環境変数として渡す。Storybook 用 / Playwright 用で
**別の token** を使う点に注意 (chromatic CLI は `CHROMATIC_PROJECT_TOKEN` env を読む):

```sh
# Storybook (Storybook 用 project の token)
pnpm build-storybook
CHROMATIC_PROJECT_TOKEN=<storybook-token> pnpm chromatic:storybook

# Playwright (.dev.vars が必要 / Playwright 用 project の token)
pnpm e2e
CHROMATIC_PROJECT_TOKEN=<playwright-token> pnpm chromatic:playwright
```

## Email + Password 認証とメール送信 (確認 / リセット / メール変更)

Google OAuth に加えて email + password 認証を提供する。認証メール (メールアドレス確認 /
パスワードリセット / メールアドレス変更確認) の送信 transport は環境で切り替わる
(`src/server/features/auth/email.ts`):

| 環境                                         | transport                                       | メール確認 (`requireEmailVerification`) |
| -------------------------------------------- | ----------------------------------------------- | --------------------------------------- |
| 本番 (`wrangler deploy`)                     | Cloudflare Email Sending (`send_email` binding) | 必須                                    |
| ローカル dev / E2E (`pnpm dev` / `pnpm e2e`) | ローカル Node リレー → Mailosaur SMTP           | 必須                                    |

**方針: ローカルは常に実メール送信 (Mailosaur)**。`pnpm dev` は `scripts/dev.mjs` 経由で
メールリレー + Worker を同時起動し、認証メールが実際に Mailosaur へ届く (= 本番と同じ
「確認必須」挙動でローカル検証できる)。素の console 出力モードは廃止 (フォールバックとしては残存)。

切替シグナルは `env.MAIL_RELAY_URL` (ローカルでは `.dev.vars` に常設) と本番ビルド判定。
**本番保護**: relay 分岐は `if (import.meta.env.DEV && env.MAIL_RELAY_URL)` でガードしてあり、
本番ビルド (`import.meta.env.DEV === false`) では **この分岐ごと dead-code 除去**される。
→ 本番 Worker のバンドルにリレー送信のコードは含まれず、本番が誤ってリレー送信になることは
構造的に起こり得ない (本番は `send_email` binding のみ)。

DB マイグレーションは不要 (`user.emailVerified` / `verification` / `account.password` は既存)。

### 本番でメールを送る (Cloudflare Email Sending) — 手作業

1. Cloudflare dashboard → **Email → Email Routing** で送信ドメインを onboard
   (DNS に MX / SPF(TXT) / DKIM を設定し検証)。onboard 後は任意の宛先へ送信できる。
2. `wrangler.jsonc` の `send_email` binding (`SEND_EMAIL`) がそのドメインを使う。
3. 送信元 `EMAIL_FROM` を**そのドメイン上のアドレス**にし、prod の Worker var/secret に登録する。
4. **onboard 前に `send_email` binding 付きで deploy しない** (ドメイン未検証だと `send()` が失敗する)。

### ローカル dev / E2E でのメール経路

`MAIL_RELAY_URL` は `.dev.vars` に常設 (`http://localhost:3001/send`)。`pnpm dev` /
`pnpm e2e` はともに **メールリレー (`scripts/mail-relay.mjs`, port 3001) + Worker** を
`scripts/dev.mjs` で同時起動する (Playwright も `pnpm dev` を webServer として使うだけ)。
Worker が送る認証メールはリレー → **Mailosaur SMTP** に転送され (送信ドメイン不要)、
E2E では Playwright が Mailosaur API で受信して確認/リセット/変更リンクを踏む。

対象フロー: `e2e/auth-signup-verify.spec.ts` / `auth-password-reset.spec.ts` /
`auth-change-email.spec.ts` / `auth-change-password.spec.ts`、および `global-setup.ts`
(todos 用の検証済みユーザー生成)。

**秘密の置き場所**: Mailosaur 資格情報は **Worker ランタイムには渡らない**テスト基盤専用なので、
`.dev.vars` (Wrangler runtime) ではなく **`.env` (Node ツール用) 側**に置く (Playwright と
リレーが `.env` を parse して参照)。これにより Worker の `Env` 型が汚れず、Mailosaur を本番
Cloudflare に登録する必要も無い。`EMAIL_FROM` だけは本番の送信元として `.dev.vars` (= 本番 Worker
var) 側に置く。

**手作業 (1 回だけ)**: [Mailosaur](https://mailosaur.com) でアカウント + Server を作成し、
1Password の **`.env` Item** に以下を登録する (`.env.1password.tpl` 参照):

- `MAILOSAUR_API_KEY` / `MAILOSAUR_SERVER_ID`
- `MAILOSAUR_SMTP_HOST` / `MAILOSAUR_SMTP_PORT` / `MAILOSAUR_SMTP_USER` / `MAILOSAUR_SMTP_PASS`

> `op inject` は参照 field が 1 つでも欠けると全体が fail する。**E2E を実行しない環境でも**
> これら 6 field を 1Password の `.env` Item に作成しておくこと (値は空文字で可)。空なら
> `secrets:pull` は通り、`pnpm e2e` 実行時に `global-setup` が「未設定」を明示して止まる。

登録後 `pnpm secrets:pull:local` で `.env` / `.dev.vars` を再生成し、`pnpm dev` または
`pnpm e2e` を実行する。CI は既存 e2e task の 1Password 注入 (`secrets:pull:ci` =
`.dev.vars` + `.env` を pull) でこれらを取得する (workflow の step 構成は不変)。

### ローカルで実メールを手で確認する

`pnpm dev` を起動した状態でブラウザからサインアップ等を行うと、認証メールが Mailosaur に
届く (dashboard で本文・リンクを確認)。メール内リンクは `APP_URL` (= `http://localhost:5173/...`)
なのでローカルのブラウザで開けば確認フローが完了する。終了は **Ctrl+C** で、リレー・Worker・
workerd まで含めてまとめて停止する (`scripts/dev.mjs` がプロセスグループごと kill する)。

> `MAIL_RELAY_URL` が立っているので `requireEmailVerification` が有効。サインアップ後はメール
> 確認が必須で、確認済みアカウントでのみメール変更が「旧 → 新」の 2 段階フローになる。

## Runtime hardening (Hono Worker 側の defense in depth)

実装済 (`src/server/`):

- **Security response headers** — `middleware/security-headers.ts` で `hono/secure-headers` を
  全レスポンスに適用。CSP は prod で `script-src 'self'`、dev は Vite HMR / React Refresh
  preamble のため `'unsafe-inline' 'unsafe-eval'` を許容する分岐 (`import.meta.env.DEV` で切替)。
  HSTS は prod のみ `max-age=31536000; includeSubDomains`。
- **CSRF protection** — `hono/csrf` を `/api/auth/*` を除く全 path に適用。`/api/auth/*` は
  Better Auth の origin-check middleware が独自検証する。Inertia は `application/json` で
  POST するため hono/csrf の content-type ガード対象外で素通りし、cross-origin の form POST
  (`x-www-form-urlencoded` / `multipart/form-data` / `text/plain`) のみが 403 になる。
- **Better Auth 設定の厳格化** — `features/auth/auth.ts` で `trustedOrigins` / cookie の
  `Secure`/`HttpOnly`/`SameSite=Lax` / session の `expiresIn`/`updateAge` を明示。
- **Auth エンドポイントの rate limiting** — `middleware/rate-limit.ts` + `wrangler.jsonc` の
  `ratelimits` binding (`AUTH_RATE_LIMITER`, 10 req / 60s / IP) を `/api/auth/sign-in/*` と
  `/api/auth/sign-up/*` に適用。dev/CI では Workers Rate Limiting は noop fallback。
- **Route param 検証** — `features/todos/validators.ts` の `todoIdParam` で UUID 形式を
  強制し、`zValidator("param", ...)` で 400 を返す。
- **Global error handler** — `index.ts` の `.onError` でスタック / DB エラー文言を握り
  潰し `{"error":"Internal Server Error"}` (500) を返す。詳細は console.error 経由で
  Cloudflare Logpush に流す。

### 本番化前 TODO (まだ未実装)

- **OAuth token の at-rest 暗号化** — `src/server/db/schema.ts` の `account` テーブルでは
  `accessToken` / `refreshToken` / `idToken` が平文で保存される (Better Auth 標準動作)。
  本番で Google API を実コールする機能 (Calendar / Drive 等) を追加する場合は、Better Auth の
  `databaseHooks.account.create.before` / `update.before` / `read.after` で `crypto.subtle`
  (AES-GCM) 暗号化を実装し、`TOKEN_ENCRYPTION_KEY` を Worker Secret として追加する。
- **`redirectTo` / `callbackURL` の allowlist 化** — 現状 `SignInButton` / `SignOutButton` の
  prop は内部 hardcode のみで実害なし。URL クエリから渡す改修が入る段階で内部 path 限定の
  helper (`safe-redirect.ts`) を導入する。
- **`import.meta.env.DEV` const-fold の build-time assertion** — `@cloudflare/vite-plugin` の
  定数置換が壊れた場合に email/password 認証が本番で有効化されないよう、`pnpm build` 後に
  `dist/worker/*.js` を grep する post-step を入れる選択肢がある。現状は plugin を信頼。

## Cloudflare Workers への自動 deploy (Workers Builds)

main への push で自動 deploy するために **Cloudflare Workers Builds** (Cloudflare 側の
GitHub 連携機能) を使う。テスト/品質ゲートは `.github/workflows/ci.yml` に残し、deploy
実体だけ Cloudflare 側に寄せる併用構成。GitHub Actions に CF API Token を持たせず、
deploy 用 workflow YAML も増やさずに済む。

CI green を deploy の事前条件にする仕掛けは **branch protection の必須 status check**
で実現する (Workers Builds 自体は GitHub の status checks を見ない仕様だが、main への
merge が CI green 前提なら実質的に deploy も CI green 前提になる)。

### 構成概要

| 領域                                                                                                    | 担当                                                          |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| PR / main への push 時の test, lint, type check, dead-code/循環参照, e2e, audit, signatures             | GitHub Actions (`ci.yml`)                                     |
| CI green の強制                                                                                         | GitHub branch protection (`main` の必須 status check)         |
| main push 後の build + D1 migration + deploy                                                            | Cloudflare Workers Builds                                     |
| Worker runtime secrets (`APP_URL` / `BETTER_AUTH_SECRET` / `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`) | Cloudflare dashboard (一度登録すれば deploy 越しに保持される) |
| 真正性ソース (人間が値を保管する場所)                                                                   | 1Password prod vault `template-vp-cf-hono-inertia-react-prod` |

build 手順は `package.json` の `cf:build` script に集約してある
(`pnpm db:migrate:remote → pnpm build → pnpm build`)。
Cloudflare 側の Build command 欄に `pnpm cf:build` を指定する
(wrangler.jsonc の `build.command` は `@cloudflare/vite-plugin` 配下では ignore されるため、
dashboard 側に書いて Workers Builds から直接実行させる)。

`pnpm build` を 2 回叩いているのは **意図的**。`@cloudflare/vite-plugin` が
`todo_app` (worker) 環境を `client` 環境より **先に** build する仕様のため、初回 build
時点で `dist/client/client/.vite/manifest.json` がまだ存在せず、`src/server/root-view.ts`
の `import.meta.glob` が空オブジェクトを返してしまう (= production HTML の `<script>` /
`<link>` が空白になり、画面が真っ白になる)。1 回目で client manifest が disk に出力
されたあと、2 回目の worker build で root-view.ts が manifest を glob 経由で embed
できるようになる。

### 前提リソース (初回 setup の事前準備)

| 項目                 | 内容                                                                                                                                                                                                |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1Password prod vault | `template-vp-cf-hono-inertia-react-prod` に Item `.dev.vars` を作成し、`APP_URL` (`https://<prod-domain>`) / `BETTER_AUTH_SECRET` / `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` の 4 field を埋める |
| Cloudflare D1        | `todo-app-db` を本番アカウントに用意 (`wrangler d1 create todo-app-db`)。`wrangler.jsonc` の `database_id` を prod の ID で書き換えるか、env 分離するかを決める                                     |
| Cloudflare R2        | bucket `todo-app-files` を **事前作成** (`wrangler r2 bucket create todo-app-files`)。存在しないと deploy が fail する                                                                              |
| Google OAuth         | prod ドメインの `https://<prod-domain>/api/auth/callback/google` を Google Cloud Console の OAuth client の Authorized redirect URIs に追加                                                         |

### Workers Builds の接続手順 (dashboard)

1. Cloudflare dashboard → **Workers & Pages** → 該当 Worker (`todo-app`) → **Settings** → **Builds**
2. **Connect to Git** → Cloudflare の GitHub App を install (リポジトリスコープを必要分のみに絞る)
3. **Repository**: `YasunoriMATSUOKA/template-vp-cf-hono-inertia-react`
4. **Production branch**: `main`
5. **Build command**: `pnpm cf:build`
6. **Deploy command**: `pnpm deploy` (= `wrangler deploy --config dist/client/todo_app/wrangler.json`、空欄不可。`@cloudflare/vite-plugin` が build 時に生成する `dist/client/todo_app/wrangler.json` を使わないと wrangler が `src/server/index.ts` を再 bundle してしまい、vite が emit した hashed assets と整合が取れない)
7. **Node version**: 24 / **Package manager**: pnpm (`packageManager` field から自動判定されるはずだが念のため明示)
8. Save → 初回 build が走る (後述の bootstrap 済みなら成功するはず)

> [!NOTE]
> Workers Builds の dashboard には Pages にあった独立した **Install command** 欄が無く、install は lockfile から package manager を auto-detect して固定コマンドで実行される (= `pnpm install` を flag 無しで叩く)。env var (`npm_config_minimum_release_age=0` 等) も pnpm の policy override では効かないため、`pnpm-workspace.yaml` の **`minimumReleaseAgeExclude`** に young version を明示列挙する方式で deploy 通している (lockfile を更新するたび同 PR でこのリストも更新する運用)。詳細は `CLAUDE.md` の Supply chain policy 節を参照。

### Worker secrets の登録 (one-time)

dashboard → Worker → **Settings** → **Variables and Secrets** → **+ Add** を 4 回。
それぞれ Type: **Secret** を選び、値は 1Password prod vault から手動コピー:

- `APP_URL` (`https://<prod-domain>` — 厳密には secret ではないが、他の field と同じ仕組みに揃えて Secret で登録)
- `BETTER_AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

一度登録すれば後続 `wrangler deploy` を繰り返しても保持される (`wrangler deploy` は
Secret namespace に触らない)。rotation は 1Password で値を更新した上で dashboard
で再登録 (or `wrangler secret put` をローカルから)。

### GitHub branch protection の必須 status check 化

CI green でない PR を main に merge させないことで、Workers Builds が deploy する
commit を CI green に限定する。

GitHub repo → **Settings** → **Branches** → main の branch protection rule で:

- "Require status checks to pass before merging" を有効
- 必須 check に `audit & install` および `verify (check)` / `verify (build)` /
  `verify (test)` / `verify (build-storybook)` / `verify (test-storybook)` /
  `verify (e2e)` の **7 件** を登録 (= `ci.yml` の全 job)

`verify (check)` は `pnpm check` (= `vp check` の format/lint/型 + **knip** の不要コード検出 +
**dependency-cruiser** の循環参照 / client⇔server 境界検査) を走らせる。静的解析を `pnpm check` に
連結してあるので、`ci.yml` を変更せずにこの gate へ含めている (詳細は `CLAUDE.md`「静的解析」節)。

### 初回 bootstrap deploy (Workers Builds 接続前に推奨)

Workers Builds を接続した時点で Worker (`todo-app`) が dashboard に存在しないと、
GitHub 連携設定 UI から開けない。最初の 1 回だけローカルから手動で Worker を生成する:

```bash
pnpm secrets:pull:prod                 # prod vault から .env / .dev.vars を生成
pnpm cf:build                          # sed → db:migrate:remote → vite build (dist/client/todo_app/wrangler.json も生成)
pnpm deploy                            # 上記生成 config 経由で Worker を新規作成
pnpm exec wrangler secret bulk .dev.vars  # secrets を登録 (上記 dashboard 登録の代替でも OK)
rm -f .dev.vars .env                   # ローカル secret を即削除
pnpm secrets:pull:local                # local 開発用に戻す
```

`pnpm deploy` は内部で `wrangler deploy --config dist/client/todo_app/wrangler.json`
を呼ぶ。`todo_app` 部分は worker name `todo-app` のハイフン→アンダースコア変換で
決まるので、`wrangler.jsonc` の `name` を変えた場合は `package.json` の `deploy`
script の path も追従させること。

この時点で Worker / D1 schema / Worker secrets が揃った状態になるので、後は Workers
Builds 接続 → 以降は push to main で自動 deploy される。

### Rollback

dashboard → Worker → **Deployments** タブで:

- 過去の version 一覧から目的の version を選んで **Rollback** ボタン
- もしくはローカルから `pnpm exec wrangler rollback [--version-id <ID>]`

D1 migration は schema を進める方向の操作なので、code rollback だけでは schema は
戻らない。Schema rollback が必要な場合は手動で revert migration を書く (expand /
contract 規律を守っていれば、新 schema は旧 code でも互換のはず)。

### Destructive migration の注意

`pnpm cf:build` は内部で `pnpm db:migrate:remote` を auto 実行するため、
**destructive な migration** (DROP COLUMN / DROP TABLE / 非互換な ALTER) は

1. 先に新カラムを足す additive な migration を deploy (expand)
2. アプリケーション側を新カラムだけ参照するように更新して deploy
3. 旧カラムを参照するコードが無くなったことを確認してから DROP migration を deploy (contract)

の **expand / contract 2 段階** で運用する。`pnpm db:generate` 直後の `git diff` で
予期せぬ DROP / ALTER が混入していないか必ず目視 review すること
(CLAUDE.md の「Auto-generated artifacts」セクション参照)。

## young version をマージする時の運用

Dependabot security PR や `pnpm up` で publish から 7 日未満の version が
lockfile に入ると、CI / Cloudflare Workers Builds の install で:

```
ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION
```

が出ます (CI 側で `--config.minimum-release-age=0` は **使わない**運用に
切り替えています — Cloudflare 側で同等の override 経路が無いため、
allowlist を canonical source of truth にする方針)。

対応は PR の中で:

```bash
node scripts/find-young-deps.mjs > /tmp/young.txt   # 現 lockfile の若い version を列挙
# /tmp/young.txt の出力を pnpm-workspace.yaml の minimumReleaseAgeExclude に追記
pnpm install --frozen-lockfile                       # override 無しで install が通れば OK
git add pnpm-workspace.yaml
```

ローカルで急ぎ install を通したいときの一時 escape hatch:

```bash
pnpm install --frozen-lockfile --config.minimum-release-age=0
```

ただし `verifyDepsBeforeRun: error` の下では state file が drift して
後続 `pnpm <cmd>` が fail するので、本筋は **PR で `minimumReleaseAgeExclude`
を更新する**こと。age を過ぎたパッケージは半年に 1 度くらい
`find-young-deps.mjs` の diff を取って整理する。

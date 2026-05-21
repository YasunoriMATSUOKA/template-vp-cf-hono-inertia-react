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
作らない)。e2e で必要なのは `.dev.vars` Item の 3 field だけなので、Service Account を
local vault に read-only でスコープして発行する。

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
| PR / main への push 時の test, lint, type check, e2e, audit, signatures                                 | GitHub Actions (`ci.yml`)                                     |
| CI green の強制                                                                                         | GitHub branch protection (`main` の必須 status check)         |
| main push 後の build + D1 migration + deploy                                                            | Cloudflare Workers Builds                                     |
| Worker runtime secrets (`APP_URL` / `BETTER_AUTH_SECRET` / `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`) | Cloudflare dashboard (一度登録すれば deploy 越しに保持される) |
| 真正性ソース (人間が値を保管する場所)                                                                   | 1Password prod vault `template-vp-cf-hono-inertia-react-prod` |

build 手順は `package.json` の `cf:build` script に集約してある
(`sed (verifyDepsBeforeRun 緩和) → pnpm db:migrate:remote → pnpm build`)。
Cloudflare 側の Build command 欄に `pnpm cf:build` を指定する
(wrangler.jsonc の `build.command` は `@cloudflare/vite-plugin` 配下では ignore されるため、
dashboard 側に書いて Workers Builds から直接実行させる)。

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

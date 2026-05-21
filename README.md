# template-vp-cf-hono-inertia-react

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
   - Item `.dev.vars` — `BETTER_AUTH_SECRET` / `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
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

## Security update をマージした直後のローカル install

Dependabot の security PR がマージされた直後、その更新が publish から
7 日以内 (= `minimumReleaseAge` cutoff 内) だと、ローカルで
`pnpm install` が以下のエラーで fail することがあります:

```
ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION
```

CI と同じく cooldown を一時的に無視して install:

```bash
pnpm install --frozen-lockfile --config.minimum-release-age=0
```

CI 側で merge 前に `pnpm audit` + `pnpm audit:signatures` を通過済みなので、
このタイミングで age 制約を skip しても安全という設計です。次回以降の
通常 install (= age 経過後) は引き続き `pnpm install` だけで OK。

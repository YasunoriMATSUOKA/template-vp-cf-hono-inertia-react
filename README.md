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

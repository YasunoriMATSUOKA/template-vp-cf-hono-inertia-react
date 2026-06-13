# 1Password CLI template for .dev.vars (Wrangler runtime secrets).
# Run `pnpm secrets:pull` to materialize this into `.dev.vars`. Defaults to APP_ENV=local.
APP_URL=op://template-vp-cf-hono-inertia-react-${APP_ENV}/.dev.vars/APP_URL
BETTER_AUTH_SECRET=op://template-vp-cf-hono-inertia-react-${APP_ENV}/.dev.vars/BETTER_AUTH_SECRET
GOOGLE_CLIENT_ID=op://template-vp-cf-hono-inertia-react-${APP_ENV}/.dev.vars/GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=op://template-vp-cf-hono-inertia-react-${APP_ENV}/.dev.vars/GOOGLE_CLIENT_SECRET
# 認証メール送信元 (本番は Cloudflare Email Routing の onboard 済みドメイン上のアドレス)
EMAIL_FROM=op://template-vp-cf-hono-inertia-react-${APP_ENV}/.dev.vars/EMAIL_FROM
# ローカル (dev / E2E) のリレー URL。本番には設定せず、email.ts の DEV ガードで本番では無視される。
# (Mailosaur 資格情報は .env 側。Worker ランタイムには渡さないため)
MAIL_RELAY_URL=http://localhost:3001/send

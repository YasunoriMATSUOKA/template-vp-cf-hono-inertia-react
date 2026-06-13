# 1Password CLI template for .env.
# Run `pnpm secrets:pull` to materialize this into `.env`. Defaults to APP_ENV=local.
# Switch environment with `APP_ENV=<env> pnpm secrets:pull` (requires a matching vault).
CLOUDFLARE_ACCOUNT_ID=op://template-vp-cf-hono-inertia-react-${APP_ENV}/.env/CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_DATABASE_ID=op://template-vp-cf-hono-inertia-react-${APP_ENV}/.env/CLOUDFLARE_DATABASE_ID
CLOUDFLARE_D1_TOKEN=op://template-vp-cf-hono-inertia-react-${APP_ENV}/.env/CLOUDFLARE_D1_TOKEN
# E2E (Mailosaur) 用。Playwright / メールリレー (Node) が参照する (Worker は不使用)。
# E2E を使わない環境では 1Password 側の field を空文字で作っておけば op inject は通る。
MAILOSAUR_API_KEY=op://template-vp-cf-hono-inertia-react-${APP_ENV}/.env/MAILOSAUR_API_KEY
MAILOSAUR_SERVER_ID=op://template-vp-cf-hono-inertia-react-${APP_ENV}/.env/MAILOSAUR_SERVER_ID
MAILOSAUR_SMTP_HOST=op://template-vp-cf-hono-inertia-react-${APP_ENV}/.env/MAILOSAUR_SMTP_HOST
MAILOSAUR_SMTP_PORT=op://template-vp-cf-hono-inertia-react-${APP_ENV}/.env/MAILOSAUR_SMTP_PORT
MAILOSAUR_SMTP_USER=op://template-vp-cf-hono-inertia-react-${APP_ENV}/.env/MAILOSAUR_SMTP_USER
MAILOSAUR_SMTP_PASS=op://template-vp-cf-hono-inertia-react-${APP_ENV}/.env/MAILOSAUR_SMTP_PASS

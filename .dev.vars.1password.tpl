# 1Password CLI template for .dev.vars (Wrangler runtime secrets).
# Run `pnpm secrets:pull` to materialize this into `.dev.vars`. Defaults to APP_ENV=local.
BETTER_AUTH_SECRET=op://template-vp-cf-hono-inertia-react-${APP_ENV}/.dev.vars/BETTER_AUTH_SECRET
GOOGLE_CLIENT_ID=op://template-vp-cf-hono-inertia-react-${APP_ENV}/.dev.vars/GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=op://template-vp-cf-hono-inertia-react-${APP_ENV}/.dev.vars/GOOGLE_CLIENT_SECRET

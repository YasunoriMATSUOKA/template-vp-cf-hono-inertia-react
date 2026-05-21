import { Hono } from "hono";
import type { Auth } from "./auth";
import { authRateLimitMiddleware } from "~/server/middleware/rate-limit";

// /api/auth/sign-in/* と /api/auth/sign-up/* は per-IP rate limit を掛ける
// (Cloudflare 本番でのみ実効。dev/CI は noop に近い)。残りの auth ルートは
// callback / session GET 等で頻度が出るためそのまま通す。
const app = new Hono<{ Bindings: Env; Variables: { auth: Auth } }>()
  .use("/sign-in/*", authRateLimitMiddleware)
  .use("/sign-up/*", authRateLimitMiddleware)
  .all("*", (c) => c.var.auth.handler(c.req.raw));

export default app;

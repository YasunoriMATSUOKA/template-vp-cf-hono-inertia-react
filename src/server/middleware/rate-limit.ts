import type { MiddlewareHandler } from "hono";

// Cloudflare Workers Rate Limiting API (per-IP) で auth エンドポイントを保護する。
// CF-Connecting-IP を key にし、binding (wrangler.jsonc の `ratelimits` で定義) の
// simple.limit / simple.period を超えた時点で 429 を返す。
//
// ローカル / CI では Workers Rate Limiting は noop に近い fallback となるため、E2E は
// 通常通り走る (本番でのみ実値が効く)。
//
// 注: signin POST 時にもクライアント IP が取れないケース (e.g. proxy のため `cf-connecting-ip`
// が空) があり得る。その場合は URL.pathname を fallback key にしてグローバルカウンタとして
// 動かす (壊滅的なブルートフォースだけは防ぐ目的)。
export const authRateLimitMiddleware: MiddlewareHandler<{
  Bindings: Env;
}> = async (c, next) => {
  // X-Forwarded-For は "client, proxy1, proxy2" 形式でカンマ区切り複数 IP が並ぶことが
  // あるので、先頭 (= origin client) のみを取り出して key の揺れを防ぐ。
  // Cloudflare 環境では通常 cf-connecting-ip が単一値で先にヒットする。
  const xff = c.req.header("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = c.req.header("cf-connecting-ip") ?? xff ?? "unknown";
  const key = `${new URL(c.req.url).pathname}:${ip}`;
  const { success } = await c.env.AUTH_RATE_LIMITER.limit({ key });
  if (!success) {
    return c.json({ error: "Too Many Requests" }, 429);
  }
  await next();
};

import { betterAuth } from "better-auth";

// 必ず「1リクエストにつき1インスタンス」だけ生成すること。
// グローバルスコープで evaluate すると c.env が無いし、Cloudflare の isolate
// 再利用で waitUntil バックグラウンドタスクが衝突して 503 や 33 秒ハングが起きる。
export const createAuth = (env: Env) =>
  betterAuth({
    database: env.DB,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.APP_URL,
    // origin-check middleware が許容する origin の明示。Better Auth は baseURL を暗黙に
    // trusted に含むが、空 fallback で open redirect の足場になるのを避けるため明示する。
    trustedOrigins: [env.APP_URL],
    // dev mode (vite dev) でのみ email/password を有効化 (E2E テスト用)。
    // @cloudflare/vite-plugin の build 時に import.meta.env.DEV が定数置換されるので、
    // 本番 build (wrangler deploy) では false 固定でバンドルされる。
    emailAndPassword: { enabled: import.meta.env.DEV },
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
    // セッション cookie に Secure / HttpOnly / SameSite=Lax を明示する。
    // dev は http://localhost なので Secure を切らないと cookie がそもそもセットされない。
    advanced: {
      defaultCookieAttributes: {
        sameSite: "lax",
        secure: !import.meta.env.DEV,
        httpOnly: true,
      },
    },
    // Better Auth の default も 7 日だが、依存バージョン更新で挙動が変わらないよう明示。
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
  });

export type Auth = ReturnType<typeof createAuth>;

type RawSessionUser = NonNullable<Awaited<ReturnType<Auth["api"]["getSession"]>>>["user"];

// Better Auth が返す session.user を、Variables に詰める段階で `?? null` 正規化した形に
// 揃えた型。name / image は元々 string | null | undefined になり得るが、Hono の Variables
// に入る時点で string | null に統一されているのを型でも表現する。
export type SessionUser = {
  id: RawSessionUser["id"];
  email: RawSessionUser["email"];
  name: string | null;
  image: string | null;
};

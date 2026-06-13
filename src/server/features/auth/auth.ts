import { betterAuth } from "better-auth";
import { sendAuthEmail } from "./email";

// 実送信できる環境でのみメール確認を必須化する。
//   - 本番ビルド (!import.meta.env.DEV): Cloudflare send_email binding で送信
//   - E2E (env.MAIL_RELAY_URL あり): ローカルリレー → Mailosaur SMTP で送信
// 素のローカル dev は実送信しない (console 出力) ため確認不要にして開発摩擦を避ける。
const emailEnforced = (env: Env) => !import.meta.env.DEV || Boolean(env.MAIL_RELAY_URL);

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
    // email/password を常時有効化。確認必須は実送信できる環境 (本番 / E2E) のみ。
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: emailEnforced(env),
      sendResetPassword: async ({ user, url }) => {
        await sendAuthEmail(env, {
          to: user.email,
          subject: "パスワードの再設定",
          heading: "パスワードを再設定してください",
          actionLabel: "パスワードを再設定",
          url,
        });
      },
    },
    emailVerification: {
      // サインアップ時に確認メールを送るのは確認必須の環境のみ (素の dev は送らない)。
      sendOnSignUp: emailEnforced(env),
      // 確認リンクを踏んだら自動でログイン状態にする。
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        await sendAuthEmail(env, {
          to: user.email,
          subject: "メールアドレスの確認",
          heading: "メールアドレスを確認してください",
          actionLabel: "メールアドレスを確認",
          url,
        });
      },
    },
    // ログイン後のメールアドレス変更。確認は現在(旧)アドレスへ送られ、
    // 承認後に新アドレスへ verification (上記 sendVerificationEmail) が飛ぶ。
    user: {
      changeEmail: {
        enabled: true,
        sendChangeEmailConfirmation: async ({ user, newEmail, url }) => {
          await sendAuthEmail(env, {
            to: user.email,
            subject: "メールアドレス変更の確認",
            heading: `メールアドレスを ${newEmail} に変更しますか？`,
            actionLabel: "変更を承認",
            url,
          });
        },
      },
    },
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

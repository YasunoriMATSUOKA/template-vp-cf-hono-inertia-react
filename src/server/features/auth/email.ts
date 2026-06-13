// 認証メール (確認 / パスワードリセット / メールアドレス変更確認) の送信ユーティリティ。
//
// transport は環境で切り替わる:
//   (1) E2E      : env.MAIL_RELAY_URL があればローカル Node リレー (→ Mailosaur SMTP) に POST
//   (2) 本番      : Cloudflare Email Sending の send_email binding (env.SEND_EMAIL)
//   (3) 素のdev   : 上記いずれも無ければ URL を console 出力 (実送信しない)
//
// requireEmailVerification の有効化条件 (auth.ts の emailEnforced) と整合させること:
// 実送信できる (1)(2) の環境でのみ確認必須にする。

export type AuthEmail = {
  to: string;
  subject: string;
  heading: string;
  actionLabel: string;
  url: string;
};

// HTML メール本文に値を埋め込む際のエスケープ (メール内 HTML インジェクション防止)。
export const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const renderText = (m: AuthEmail) =>
  `${m.heading}\n\n${m.actionLabel}: ${m.url}\n\nこのメールに心当たりがない場合は破棄してください。`;

export const renderHtml = (m: AuthEmail) => {
  const url = escapeHtml(m.url);
  return `<!doctype html><html lang="ja"><body style="font-family:system-ui,sans-serif;line-height:1.6;color:#1a1a1a">
<h1 style="font-size:1.25rem">${escapeHtml(m.heading)}</h1>
<p><a href="${url}" style="display:inline-block;padding:10px 16px;background:#570df8;color:#fff;border-radius:8px;text-decoration:none">${escapeHtml(m.actionLabel)}</a></p>
<p style="color:#666;font-size:.875rem">ボタンが開けない場合は次の URL をブラウザに貼り付けてください:<br>${url}</p>
<p style="color:#666;font-size:.875rem">このメールに心当たりがない場合は破棄してください。</p>
</body></html>`;
};

export async function sendAuthEmail(env: Env, msg: AuthEmail): Promise<void> {
  // (1) ローカル dev / E2E: ローカルリレー経由で Mailosaur SMTP に実配信。
  // `import.meta.env.DEV` ガードにより、本番ビルド (wrangler deploy) ではこの分岐ごと
  // dead-code 除去される → 本番が誤ってリレー送信になることは構造的に起こり得ない。
  if (import.meta.env.DEV && env.MAIL_RELAY_URL) {
    const res = await fetch(env.MAIL_RELAY_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        from: env.EMAIL_FROM || "no-reply@e2e.test",
        to: msg.to,
        subject: msg.subject,
        text: renderText(msg),
        html: renderHtml(msg),
      }),
    });
    if (!res.ok) throw new Error(`mail relay responded ${res.status}`);
    return;
  }

  // (2) 本番: Cloudflare Email Sending (send_email binding の builder オーバーロード)
  if (!import.meta.env.DEV && env.EMAIL_FROM) {
    await env.SEND_EMAIL.send({
      from: env.EMAIL_FROM,
      to: msg.to,
      subject: msg.subject,
      text: renderText(msg),
      html: renderHtml(msg),
    });
    return;
  }

  // (3) フォールバック: 上記いずれの送信経路も使えない場合。
  // dev では確認 URL を console 出力して開発を回せるようにするが、本番でここに来るのは
  // 設定不備 (EMAIL_FROM 未設定など) なので、トークン付き URL を Logpush に残さないよう
  // redact し、error として顕在化させる。
  if (import.meta.env.DEV) {
    console.log(`[auth-email] to=${msg.to} subject=${msg.subject} url=${msg.url}`);
  } else {
    console.error(
      `[auth-email] 送信経路が未設定のためメールを送信できませんでした (to=${msg.to} subject=${msg.subject})`,
    );
  }
}

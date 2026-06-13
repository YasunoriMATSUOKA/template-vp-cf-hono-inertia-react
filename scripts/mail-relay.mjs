// E2E 専用のローカルメールリレー。
// Worker (pnpm dev) の sendAuthEmail が MAIL_RELAY_URL=http://localhost:<port>/send へ
// POST してくるメールを受け、nodemailer 経由で Mailosaur SMTP に転送する。
// Mailosaur SMTP は宛先によらず全メールを捕捉するので、送信ドメインの onboard は不要。
//
// Playwright の webServer から起動される (playwright.config.ts)。
// 必要な env (.env から playwright.config が process.env に流し込む):
//   MAILOSAUR_SERVER_ID (ユーザ名導出に使用) / MAILOSAUR_SMTP_PASS (必須)
//   任意: MAILOSAUR_SMTP_HOST / MAILOSAUR_SMTP_PORT / MAILOSAUR_SMTP_USER
import { createServer } from "node:http";
import nodemailer from "nodemailer";

const port = Number(process.env.MAIL_RELAY_PORT || 3001);

// Mailosaur SMTP の規約値はほぼ固定なので、未指定なら既定値を使う:
//   host = smtp.mailosaur.net / port = 2525 (STARTTLS) / user = <ServerID>@mailosaur.net
// ユーザ名は ServerID から導出する (誤って host 名等が入っていても無視して導出)。
const serverId = process.env.MAILOSAUR_SERVER_ID ?? "";
const smtpUser = process.env.MAILOSAUR_SMTP_USER;
const smtpPort = Number(process.env.MAILOSAUR_SMTP_PORT || 2525);

const transport = nodemailer.createTransport({
  host: process.env.MAILOSAUR_SMTP_HOST || "smtp.mailosaur.net",
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: smtpUser && smtpUser.includes("@") ? smtpUser : `${serverId}@mailosaur.net`,
    pass: process.env.MAILOSAUR_SMTP_PASS,
  },
});

const server = createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200).end("ok");
    return;
  }
  if (req.method === "POST" && req.url === "/send") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", async () => {
      try {
        const { from, to, subject, text, html } = JSON.parse(body);
        await transport.sendMail({ from, to, subject, text, html });
        console.log(`[mail-relay] forwarded to ${to} (subject: ${subject})`);
        res.writeHead(200).end("ok");
      } catch (err) {
        console.error("[mail-relay] send failed:", err);
        res.writeHead(500).end(String(err));
      }
    });
    return;
  }
  res.writeHead(404).end("not found");
});

server.listen(port, () => console.log(`[mail-relay] listening on http://localhost:${port}`));

// ローカル開発サーバ。常に「実メール送信 (Mailosaur 経由)」モードで動かす方針:
//   - メールリレー (scripts/mail-relay.mjs) と vp dev を同時起動
//   - .dev.vars の MAIL_RELAY_URL は常設なので Worker はリレー送信モードになる
//     (= requireEmailVerification も有効。本番と同じ挙動でローカル確認できる)
//
// 本番ビルド (wrangler deploy) では email.ts の `import.meta.env.DEV` ガードにより
// リレー分岐ごと dead-code 除去されるため、本番が誤ってリレー送信になることはない。
//
// 注意: マイグレーション等は pnpm の `predev` フックが先に走る (この前段)。
import { spawn } from "node:child_process";
import fs from "node:fs";

// .env を process.env に流し込む (リレーが MAILOSAUR_SMTP_* / SERVER_ID を参照するため)
if (fs.existsSync(".env")) {
  for (const line of fs.readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}

if (!process.env.MAILOSAUR_API_KEY) {
  console.warn(
    "[dev] 警告: MAILOSAUR_* (.env) が未設定です。認証メールは Mailosaur に届きません。",
  );
}

// 子は detached にしない (= 同じプロセスグループに留める)。こうすると人間の Ctrl+C で
// 端末がフォアグラウンドグループ全体 (この orchestrator + リレー + vp dev + workerd) に
// SIGINT を送るので、全部まとめて止まる。detached にすると CI 等で親ツリーから外れて
// 生き残り、stdio を握ったまま親が終了できずハングするので避ける。
const children = [];
let exiting = false;
function shutdown(code) {
  if (exiting) return;
  exiting = true;
  for (const child of children) {
    try {
      child.kill("SIGTERM");
    } catch {
      // already exited
    }
  }
  process.exit(code ?? 0);
}

function run(cmd, args) {
  const child = spawn(cmd, args, { stdio: "inherit", env: process.env });
  children.push(child);
  child.on("exit", (code) => shutdown(code ?? 0));
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

run("node", ["scripts/mail-relay.mjs"]);
run("vp", ["dev"]);

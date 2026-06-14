import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 通常は playwright.config.ts が .env/.dev.vars を process.env へ流し込み、E2E_RUN_ID も設定するが、
// 単体起動などの保険として、未設定キーだけ同ロジックで再パースする。
function loadEnvFallback(): void {
  for (const file of [".env", ".dev.vars"]) {
    const p = path.join(__dirname, "..", file);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
    }
  }
}

// serverId / runId は英数字 (+ハイフン) のみ想定。SQL リテラルへ直接埋め込むため軽く検証する。
const SAFE = /^[A-Za-z0-9-]+$/;

// 全テスト後に 1 度だけ走る。この run が、このプロジェクトの mailosaur サーバーに作った
// テストユーザーだけをローカル D1 から削除し、実行ごとの累積をゼロにする。
//   - runId 一致 → 同時並行で走る別 run の使用中ユーザーを巻き込まない
//   - serverId 一致 → 別 mailosaur サーバー / 実ユーザー (別ドメイン) を巻き込まない
export default async function globalTeardown(): Promise<void> {
  loadEnvFallback();
  const serverId = process.env.MAILOSAUR_SERVER_ID ?? "";
  const runId = process.env.E2E_RUN_ID ?? "";

  // fail-safe: どちらか欠けたら何もしない (広域削除へフォールバックしない)。
  if (!serverId || !runId) {
    console.warn(
      `[e2e teardown] skip cleanup: MAILOSAUR_SERVER_ID / E2E_RUN_ID が未設定 ` +
        `(serverId=${serverId || "∅"}, runId=${runId || "∅"})`,
    );
    return;
  }
  if (!SAFE.test(serverId) || !SAFE.test(runId)) {
    console.warn("[e2e teardown] skip cleanup: serverId/runId に想定外の文字が含まれます");
    return;
  }

  // uniqueEmail() が生成するアドレスは `{prefix}-{runId}-{ts}-{rand}@{serverId}.mailosaur.net`。
  // runId はハイフンを含まない base36 なので、この区切りで一意に絞り込める。
  const pattern = `%-${runId}-%@${serverId}.mailosaur.net`;

  // verification は user への FK が無いので個別に削除する。フローにより形式が異なる:
  //   - reset-password: identifier="reset-password:{token}", value={userId}
  //   - email 認証 / change-email: メール文字列が value / identifier 側に入り得る
  // そのため value=該当userId / value=email / identifier=email の 3 条件で取りこぼしを防ぐ。
  // value IN サブクエリが user を参照するので、user より先に削除する。
  // user を消せば session / account は schema の onDelete:cascade で連鎖削除される。
  const sql = [
    "DELETE FROM verification",
    ` WHERE value IN (SELECT id FROM user WHERE email LIKE '${pattern}')`,
    `    OR value LIKE '${pattern}'`,
    `    OR identifier LIKE '${pattern}';`,
    `DELETE FROM user WHERE email LIKE '${pattern}';`,
  ].join("\n");

  // teardown 時点では dev サーバ (pnpm dev:vite) がまだ起動中で、同一の .wrangler/state SQLite に
  // 対する書き込みがロック競合 (database is locked) する可能性があるためリトライする。
  // 削除は best-effort: 全リトライ失敗でも throw せず warning に留め、テスト結果を汚さない。
  const MAX = 5;
  for (let attempt = 1; attempt <= MAX; attempt++) {
    const res = spawnSync(
      "pnpm",
      ["exec", "wrangler", "d1", "execute", "todo-app-db", "--local", "--command", sql],
      { stdio: "inherit" },
    );
    if (res.status === 0) {
      console.log(
        `[e2e teardown] cleaned up test users for run ${runId} (@${serverId}.mailosaur.net)`,
      );
      return;
    }
    console.warn(`[e2e teardown] cleanup attempt ${attempt}/${MAX} failed (status=${res.status})`);
    if (attempt < MAX) await sleep(300 * attempt);
  }
  console.warn(
    `[e2e teardown] giving up after ${MAX} attempts (best-effort; ローカル D1 に残骸が残る可能性)`,
  );
}

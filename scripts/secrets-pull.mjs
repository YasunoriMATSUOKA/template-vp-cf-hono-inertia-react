// 1Password から secrets を pull して `.env` / `.dev.vars` を生成する。
// template ファイル (`.env.1password.tpl` / `.dev.vars.1password.tpl`) の
// `${APP_ENV}` を先に展開した中間ファイルを作り、`op inject --in-file ...` に渡す。
//
// `op inject` 自体は `op://...` URI しか解決しないので、vault 名の動的化は
// このスクリプト側で行う。Node の `spawn` で stdin パイプを使うと op CLI 側が
// "expected data on stdin but none found" で fail するため、stdin ではなく
// `--in-file` 経由で template を渡している (中間ファイルは `op://` 参照のみで
// secret 値は含まない)。
//
// 使い方:
//   node scripts/secrets-pull.mjs [<env>] [<file>...]
//
// 環境名の解決順 (先勝ち):
//   1. process.argv[2]     例: `node secrets-pull.mjs prod`
//   2. process.env.APP_ENV 例: `APP_ENV=prod node secrets-pull.mjs`
//   3. "local"             デフォルト
//
// ファイルフィルタ (省略時は全 target を pull):
//   `node secrets-pull.mjs ci .dev.vars` → `.dev.vars` のみ生成 (CI で `.env` が
//   不要な場合などに使う)

import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

const appEnv = process.argv[2] ?? process.env.APP_ENV ?? "local";
const onlyFiles = new Set(process.argv.slice(3));

const allTargets = [
  { tpl: ".env.1password.tpl", out: ".env" },
  { tpl: ".dev.vars.1password.tpl", out: ".dev.vars" },
];
const targets = onlyFiles.size === 0 ? allTargets : allTargets.filter((t) => onlyFiles.has(t.out));

if (targets.length === 0) {
  console.error(
    `No matching targets for filter: ${[...onlyFiles].join(", ")}. ` +
      `Valid: ${allTargets.map((t) => t.out).join(", ")}`,
  );
  process.exit(1);
}

const tmpDir = mkdtempSync(join(tmpdir(), "secrets-pull-"));
try {
  for (const { tpl, out } of targets) {
    const content = readFileSync(tpl, "utf8").replaceAll("${APP_ENV}", appEnv);
    const tmpFile = join(tmpDir, basename(tpl));
    writeFileSync(tmpFile, content);

    const result = spawnSync("op", ["inject", "--in-file", tmpFile, "--out-file", out, "--force"], {
      stdio: ["ignore", "inherit", "inherit"],
    });
    if (result.status !== 0) {
      console.error(`op inject failed for ${out} (exit ${result.status})`);
      process.exit(result.status ?? 1);
    }
    console.log(`✓ ${out} (vault: template-vp-cf-hono-inertia-react-${appEnv})`);
  }
} finally {
  rmSync(tmpDir, { recursive: true, force: true });
}

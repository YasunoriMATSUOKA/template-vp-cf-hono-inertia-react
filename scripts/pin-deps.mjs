// package.json の dependencies / devDependencies を
// 「pnpm-lock.yaml が指す実 install version」で exact 固定する。
//
// 単純に ^ を剥がすだけだと、range 内 patch 更新分 (例: ^1.37.1 → 実 install 1.37.2)
// がダウングレードしてしまうので、必ず実 install version を読みに行く。

import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const installed = JSON.parse(execSync("pnpm ls --depth=0 --json", { encoding: "utf8" }))[0];

let changed = 0;
for (const section of ["dependencies", "devDependencies"]) {
  for (const name of Object.keys(pkg[section] ?? {})) {
    const current = pkg[section][name];
    const v = installed[section]?.[name]?.version;
    if (v && current !== v) {
      pkg[section][name] = v;
      changed += 1;
      console.log(`  ${name}: ${current} → ${v}`);
    }
  }
}

writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
console.log(`\npinned ${changed} dep entry(ies) to installed versions.`);

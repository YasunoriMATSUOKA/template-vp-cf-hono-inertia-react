// pnpm-lock.yaml が指す全 install パッケージのうち、
// 「install されている specific version の publish が MIN_AGE_MIN 未満」のものを抽出する。
// minimumReleaseAge 政策を導入する際の grandfather list 作成用。

import { readFileSync } from "node:fs";
import { parse } from "yaml";

const MIN_AGE_MIN = 10080; // 7 days
const cutoff = Date.now() - MIN_AGE_MIN * 60_000;

const lockfile = parse(readFileSync("pnpm-lock.yaml", "utf8"));
const packages = lockfile.packages ?? {};

// key 形式: "@scope/pkg@version" または "pkg@version"
// version はそのまま分離。@ が先頭 (scoped) なら lastIndexOf('@') で切れる
const installedVersions = new Map(); // name -> Set<version>
for (const key of Object.keys(packages)) {
  const at = key.lastIndexOf("@");
  if (at <= 0) continue;
  const name = key.slice(0, at);
  const version = key.slice(at + 1);
  if (!installedVersions.has(name)) installedVersions.set(name, new Set());
  installedVersions.get(name).add(version);
}

console.log(`Inspecting ${installedVersions.size} unique packages from lockfile...`);

const young = [];
let i = 0;
for (const [name, versions] of installedVersions) {
  i += 1;
  if (i % 50 === 0) process.stderr.write(`  ${i}/${installedVersions.size}\n`);
  try {
    const res = await fetch(`https://registry.npmjs.org/${name}`);
    if (!res.ok) continue;
    const data = await res.json();
    const time = data.time ?? {};
    for (const v of versions) {
      const publishedAt = time[v];
      if (publishedAt && new Date(publishedAt).getTime() > cutoff) {
        young.push({ name, version: v, publishedAt });
      }
    }
  } catch {
    // ignore network errors
  }
}

// package 名で uniq (複数 version が刺さっていれば 1 行にまとめる)
const uniqNames = [...new Set(young.map((p) => p.name))].sort();

console.log(`\nFound ${young.length} version(s) violating, ${uniqNames.length} unique package(s):`);
for (const name of uniqNames) {
  const vs = young.filter((p) => p.name === name).map((p) => `${p.version}@${p.publishedAt}`);
  console.log(`  - ${name}  # ${vs.join(", ")}`);
}

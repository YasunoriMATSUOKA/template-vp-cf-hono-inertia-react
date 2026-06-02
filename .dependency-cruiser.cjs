// dependency-cruiser 設定 — 循環参照の防止 + client/server 境界の強制 + recommended hygiene。
// 実行: `pnpm depcruise` (= depcruise src --config .dependency-cruiser.cjs)。`pnpm check` からも走る。
// 設計判断の詳細は CLAUDE.md「静的解析 (dead-code / 循環参照)」節を参照。

/** @type {import("dependency-cruiser").IConfiguration} */
module.exports = {
  // recommended-strict: no-circular / no-orphans / not-to-unresolvable / no-deprecated-* /
  // no-duplicate-dependency-types / no-non-package-json をすべて severity:error で適用。
  extends: "dependency-cruiser/configs/recommended-strict",
  forbidden: [
    {
      name: "client-no-server",
      comment:
        "SSR/CSR 境界: src/client は src/server を runtime import 禁止。型のみの共有 (pages.gen 経由) は tsPreCompilationDeps:false により対象外。",
      severity: "error",
      from: { path: "^src/client/" },
      to: { path: "^src/server/" },
    },
    {
      name: "server-no-client",
      comment: "SSR/CSR 境界: src/server は src/client を import 禁止。",
      severity: "error",
      from: { path: "^src/server/" },
      to: { path: "^src/client/" },
    },
  ],
  options: {
    // ~ alias と Bundler resolution を tsconfig から解決する。
    tsConfig: { fileName: "tsconfig.json" },
    // hono/csrf・better-auth/react 等の package "exports" subpath を解決するため condition と
    // exports field を明示する (既定では exports を読まず not-to-unresolvable が誤発火する)。
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
      mainFields: ["module", "main", "types", "typings"],
      extensions: [".js", ".jsx", ".ts", ".tsx", ".d.ts"],
    },
    // 型のみ import は辿らない (depcruise の既定)。これにより (1) 境界ルールは「実行時の
    // 越境 import」だけを禁止する正しい意味論になり、(2) 自動生成で CI では不在の
    // pages.gen.ts への型 import を辿らないため not-to-unresolvable が誤発火しない。
    tsPreCompilationDeps: false,
    doNotFollow: {
      path: "node_modules",
      dependencyTypes: ["npm", "npm-dev", "npm-optional", "npm-peer", "npm-bundled", "npm-no-pkg"],
    },
    exclude: {
      path: [
        // test / story は runtime graph 対象外 (orphan / 依存種別の誤検知を防ぐ)。
        "\\.(test|spec)\\.(ts|tsx)$",
        "\\.stories\\.tsx$",
        // 自動生成物 (gitignore)。pages.gen.ts は fresh CI では不在。
        "src/client/pages\\.gen\\.ts$",
        "worker-configuration\\.d\\.ts$",
        // 型専用モジュール: PageProps から型を抽出するだけで runtime 辺を持たないため
        // tsPreCompilationDeps:false では orphan に見える。knip で使用は確認済みの意図的構成。
        "src/client/features/todos/types\\.ts$",
      ],
    },
  },
};

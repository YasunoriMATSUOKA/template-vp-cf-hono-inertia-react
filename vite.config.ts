import { defineConfig } from "vite-plus";
import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { inertiaPages } from "@hono/inertia/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ESM 厳格モードでは __dirname が定義されない。vp の oxfmt は素の Node ESM
// で config を評価するため、polyfill する vite の loader と挙動が違う。
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    inertiaPages({
      pagesDir: "src/client/pages",
      outFile: "src/client/pages.gen.ts",
      serverModule: "../server",
    }),
    react(),
    tailwindcss(),
    cloudflare(),
  ],
  build: {
    manifest: true,
    rollupOptions: {
      input: {
        client: path.resolve(__dirname, "src/client/main.tsx"),
      },
    },
    outDir: "dist/client",
  },
  staged: {
    "*.{js,jsx,ts,tsx,mjs,cjs}": "vp check --fix",
  },
});

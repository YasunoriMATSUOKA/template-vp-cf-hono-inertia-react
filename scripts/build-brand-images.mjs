// public/*.svg → ラスタ系ブランド資産変換スクリプト。
//
// 用途と対応フォーマット:
// - og:image / twitter:image: X/Facebook/LinkedIn は SVG を受理しない → PNG
// - apple-touch-icon: iOS は SVG を render しない → PNG (180x180)
// - favicon.ico: ブラウザは `<link rel="icon">` の有無に関わらず `/favicon.ico` を自動 fetch
//   する。Safari <15 や古い Firefox は SVG favicon を render しないので ICO が fallback。
//   16/32/48 を 1 ファイルに pack した multi-size ICO (Vista 以降の PNG-in-ICO 形式)。
// - favicon-{16,32}x{}.png: 一部ブラウザは PNG favicon を SVG より優先する。`<link>` で
//   サイズ明示すると最適 size を引いてくれる。
//
// SVG favicon (image/svg+xml) はモダンブラウザ向けの第一候補として `root-view.ts` から
// そのまま参照する。本スクリプトは raster fallback の生成のみ担当。
//
// 使い方: `node scripts/build-brand-images.mjs`
// 新規 npm 依存ゼロ (Playwright は @playwright/test 経由で devDep 済)。
// ICO バイナリも Node Buffer で組み立てるため外部ライブラリ不要。
//
// CI には組み込まない (chromium 起動コスト & バイナリ再現性) — SVG を更新した時に
// 手動で再実行し、生成物を commit する運用。

import { chromium } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "../public");

// SVG → PNG 変換ターゲット。`source` 省略時は同名 SVG を読む。
const targets = [
  { source: "og-image.svg", out: "og-image.png", width: 1200, height: 630 },
  { source: "apple-touch-icon.svg", out: "apple-touch-icon.png", width: 180, height: 180 },
  { source: "favicon.svg", out: "favicon-16x16.png", width: 16, height: 16 },
  { source: "favicon.svg", out: "favicon-32x32.png", width: 32, height: 32 },
];

// `favicon.ico` に詰める内部 PNG サイズ。48x48 は ICO 内部のみで `public/` には残さない。
const icoSizes = [16, 32, 48];

const wrapSvg = (svgMarkup, width, height) => `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      html, body { margin: 0; padding: 0; }
      body { width: ${width}px; height: ${height}px; }
      svg { display: block; width: 100%; height: 100%; }
    </style>
  </head>
  <body>${svgMarkup}</body>
</html>`;

/**
 * 1 サイズの PNG をレンダリングして Buffer を返す。
 */
async function renderPng(browser, svgMarkup, width, height) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });
  try {
    const page = await context.newPage();
    await page.setContent(wrapSvg(svgMarkup, width, height), { waitUntil: "load" });
    return await page.screenshot({ type: "png", omitBackground: false });
  } finally {
    await context.close();
  }
}

/**
 * Vista 以降の PNG-in-ICO format で multi-size .ico を組み立てる。
 *
 * file layout:
 *   ICONDIR (6 bytes): reserved=0, type=1(icon), count=N
 *   ICONDIRENTRY × N (16 bytes each): width, height, ...PNG offset/size
 *   PNG payload × N
 *
 * 各 ICONDIRENTRY の width/height は 1 byte で表現するため 256 は 0 を入れる慣習だが、
 * 本スクリプトは ≤48 のみ扱うのでそのまま入れる。
 */
function buildIco(pngs) {
  const dirHeader = Buffer.alloc(6);
  dirHeader.writeUInt16LE(0, 0); // reserved
  dirHeader.writeUInt16LE(1, 2); // type = icon
  dirHeader.writeUInt16LE(pngs.length, 4); // image count

  const entrySize = 16;
  const dirEntries = Buffer.alloc(entrySize * pngs.length);
  let offset = dirHeader.length + dirEntries.length;
  pngs.forEach(({ size, png }, i) => {
    const dim = size >= 256 ? 0 : size;
    const base = i * entrySize;
    dirEntries.writeUInt8(dim, base + 0); // width
    dirEntries.writeUInt8(dim, base + 1); // height
    dirEntries.writeUInt8(0, base + 2); // color count
    dirEntries.writeUInt8(0, base + 3); // reserved
    dirEntries.writeUInt16LE(1, base + 4); // planes
    dirEntries.writeUInt16LE(32, base + 6); // bit count
    dirEntries.writeUInt32LE(png.length, base + 8); // bytes in res
    dirEntries.writeUInt32LE(offset, base + 12); // offset from file start
    offset += png.length;
  });

  return Buffer.concat([dirHeader, dirEntries, ...pngs.map((p) => p.png)]);
}

const browser = await chromium.launch();
try {
  // SVG → PNG (og-image, apple-touch-icon, favicon-16, favicon-32)
  const sourceCache = new Map();
  const loadSvg = async (name) => {
    if (!sourceCache.has(name)) {
      sourceCache.set(name, await readFile(path.join(publicDir, name), "utf8"));
    }
    return sourceCache.get(name);
  };

  for (const { source, out, width, height } of targets) {
    const svg = await loadSvg(source);
    const png = await renderPng(browser, svg, width, height);
    await writeFile(path.join(publicDir, out), png);
    console.log(`generated public/${out} (${width}x${height}, ${png.length} bytes)`);
  }

  // ICO (16 + 32 + 48 を pack)
  const icoSvg = await loadSvg("favicon.svg");
  const icoPngs = [];
  for (const size of icoSizes) {
    icoPngs.push({ size, png: await renderPng(browser, icoSvg, size, size) });
  }
  const icoBuffer = buildIco(icoPngs);
  await writeFile(path.join(publicDir, "favicon.ico"), icoBuffer);
  console.log(`generated public/favicon.ico (${icoSizes.join("+")}, ${icoBuffer.length} bytes)`);
} finally {
  await browser.close();
}

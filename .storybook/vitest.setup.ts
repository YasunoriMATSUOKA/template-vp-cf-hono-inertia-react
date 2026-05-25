// Tailwind + DaisyUI を test 環境に読み込む。preview.ts でも同じ import を持つが、
// addon-vitest が project annotations 経由で評価する preview.ts はモジュール副作用が
// browser 上で確実に走るとは限らないため、setup 側で明示的に load する。
import "../src/client/styles/main.css";

// `storybook-addon-vis` (preview.ts で `addonVis({ auto: true })` を register) が
// 全 story の afterEach で自動的に screenshot 比較を行う (matcher は addon-vis 内蔵の
// `toMatchImageSnapshot`; これは vitest-plugin-vis の実装で jest-image-snapshot とは別物)。
// snapshot は `__vis__/<platform>/__baselines__/` 配下に保存される (vitest.config.ts の
// `snapshotRootDir` override で local/CI ともに `__vis__/linux/__baselines__/` に固定)。
// ここでは custom hook は要らず、CSS の load だけ確保すれば十分。

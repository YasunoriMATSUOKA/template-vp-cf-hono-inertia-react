// Tailwind + DaisyUI を test 環境に読み込む。preview.ts でも同じ import を持つが、
// addon-vitest が project annotations 経由で評価する preview.ts はモジュール副作用が
// browser 上で確実に走るとは限らないため、setup 側で明示的に load する。
import "../src/client/styles/main.css";

// `storybook-addon-vis` (preview.ts で `addonVis({ auto: true })` を register) が
// 全 story の afterEach で自動的に `toMatchImageSnapshot` を呼ぶ。snapshot は
// `__vis__/__baselines__/` 配下に保存される (vitest-plugin-vis 標準)。
// ここでは custom hook は要らず、CSS の load だけ確保すれば十分。

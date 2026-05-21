import { secureHeaders } from "hono/secure-headers";

// Hono `secureHeaders` で defense-in-depth ヘッダを emit する。
//
// CSP の方針:
// - prod: `script-src 'self'` のみ。Inertia は hashed entry chunk を `/{file}` で読み込み、
//   ページ初期データは `<script id="page" type="application/json">` (text/json なので CSP の
//   script-src からは外れる) なので 'self' のみで足りる。
// - dev: Vite の HMR client (`/@vite/client`) と React Refresh の inline preamble
//   (`root-view.ts` で挿入する `<script type="module">` 直書きブロック) を許容する必要があり、
//   `'unsafe-inline'` と `'unsafe-eval'` を一時的に開ける。dev 限定なので production
//   bundle にこの分岐は残らない (`@cloudflare/vite-plugin` が `import.meta.env.DEV` を
//   定数置換するため tree-shake される)。
//
// HSTS は HTTPS でしか意味が無いため dev では off。
export const securityHeadersMiddleware = secureHeaders({
  contentSecurityPolicy: import.meta.env.DEV
    ? {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'", "ws:", "wss:"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
      }
    : {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        upgradeInsecureRequests: [],
      },
  strictTransportSecurity: import.meta.env.DEV ? false : "max-age=31536000; includeSubDomains",
  xFrameOptions: "DENY",
  xContentTypeOptions: true,
  referrerPolicy: "strict-origin-when-cross-origin",
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: [],
  },
});

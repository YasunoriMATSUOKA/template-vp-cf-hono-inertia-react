import { Hono } from "hono";
import { csrf } from "hono/csrf";
import { inertia } from "@hono/inertia";
import { dbMiddleware } from "./middleware/db";
import { sessionMiddleware } from "./middleware/session";
import { securityHeadersMiddleware } from "./middleware/security-headers";
import { rootView } from "./root-view";
import authRoutes from "./features/auth/routes";
import todosRoutes from "./features/todos/routes";
import { listTodos } from "./features/todos/queries";
import type { Db } from "./db";
import type { Auth, SessionUser } from "./features/auth/auth";

type Variables = { db: Db; auth: Auth; user: SessionUser | null };

const authProp = (c: { var: { user: SessionUser | null } }) => ({ auth: { user: c.var.user } });

// Hono の chain で各 route の出力型を蓄積し、@hono/inertia の AppRegistry → PageProps へ流す。
// .route('/todos', todosRoutes) と .get('/todos', ...) は path 同一だが method が違う
// (POST vs GET) ので別ルートとして共存する。
//
// middleware の順序:
// 1. securityHeadersMiddleware — error / 404 を含む全レスポンスにヘッダを乗せたいので最上段
// 2. csrf — form-encoded な cross-origin POST を 403。Inertia は application/json で
//    送るので hono/csrf の content-type ガードに引っかからず影響なし。/api/auth は Better
//    Auth の origin-check middleware が独自に検証するため除外する。
// 3. dbMiddleware / sessionMiddleware / inertia — 既存通り
const app = new Hono<{ Bindings: Env; Variables: Variables }>()
  .use("*", securityHeadersMiddleware)
  .use("*", async (c, next) => {
    if (c.req.path.startsWith("/api/auth/")) return next();
    return csrf({ origin: c.env.APP_URL })(c, next);
  })
  .use("*", dbMiddleware)
  .use("*", sessionMiddleware)
  .use("*", inertia({ rootView }))
  .route("/api/auth", authRoutes)
  .route("/todos", todosRoutes)
  .get("/", (c) => c.render("Home", authProp(c)))
  .get("/login", (c) => {
    if (c.var.user) return c.redirect("/todos");
    return c.render("Login", authProp(c));
  })
  .get("/todos", async (c) => {
    if (!c.var.user) return c.redirect("/login");
    const todos = await listTodos(c.var.db, c.var.user.id);
    return c.render("Todos/Index", { ...authProp(c), todos });
  })
  .onError((err, c) => {
    // スタックや DB エラー文言をクライアントに返さない。Cloudflare の `observability.enabled`
    // で Logpush に送られる console.error 経由でだけ詳細を見る。
    console.error("Unhandled error:", err);
    return c.json({ error: "Internal Server Error" }, 500);
  });

export default app;

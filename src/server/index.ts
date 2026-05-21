import { Hono } from "hono";
import { inertia } from "@hono/inertia";
import { dbMiddleware } from "./middleware/db";
import { sessionMiddleware } from "./middleware/session";
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
const app = new Hono<{ Bindings: Env; Variables: Variables }>()
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
  });

export default app;

import { Hono } from "hono";
import type { Auth } from "./auth";

const app = new Hono<{ Bindings: Env; Variables: { auth: Auth } }>().all("*", (c) =>
  c.var.auth.handler(c.req.raw),
);

export default app;

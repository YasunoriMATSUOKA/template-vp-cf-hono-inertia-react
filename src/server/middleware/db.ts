import type { MiddlewareHandler } from "hono";
import { createDb, type Db } from "~/server/db";

export const dbMiddleware: MiddlewareHandler<{
  Bindings: Env;
  Variables: { db: Db };
}> = async (c, next) => {
  c.set("db", createDb(c.env.DB));
  await next();
};

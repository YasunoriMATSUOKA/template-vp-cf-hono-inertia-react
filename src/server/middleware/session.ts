import type { MiddlewareHandler } from "hono";
import { createAuth, type Auth, type SessionUser } from "~/server/features/auth/auth";

export const sessionMiddleware: MiddlewareHandler<{
  Bindings: Env;
  Variables: { auth: Auth; user: SessionUser | null };
}> = async (c, next) => {
  c.set("auth", createAuth(c.env));
  const session = await c.var.auth.api.getSession({ headers: c.req.raw.headers });
  const u = session?.user;
  c.set(
    "user",
    u
      ? {
          id: u.id,
          email: u.email,
          name: u.name ?? null,
          image: u.image ?? null,
        }
      : null,
  );
  await next();
};

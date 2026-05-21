import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { Db } from "~/server/db";
import type { SessionUser } from "../auth/auth";
import { createTodo, findTodo, setTodoDone, deleteTodo } from "./queries";
import { createTodoInput } from "./validators";

const app = new Hono<{ Bindings: Env; Variables: { db: Db; user: SessionUser | null } }>()
  .use("*", async (c, next) => {
    if (!c.var.user) return c.redirect("/login", 303);
    await next();
  })
  .post("/", zValidator("json", createTodoInput), async (c) => {
    const { title } = c.req.valid("json");
    await createTodo(c.var.db, c.var.user!.id, title);
    return c.redirect("/todos", 303);
  })
  .post("/:id/toggle", async (c) => {
    const user = c.var.user!;
    const id = c.req.param("id");
    const row = await findTodo(c.var.db, user.id, id);
    if (!row) return c.redirect("/todos", 303);
    await setTodoDone(c.var.db, user.id, id, !row.done);
    return c.redirect("/todos", 303);
  })
  .post("/:id/delete", async (c) => {
    await deleteTodo(c.var.db, c.var.user!.id, c.req.param("id"));
    return c.redirect("/todos", 303);
  });

export default app;

import { and, desc, eq } from "drizzle-orm";
import type { Db } from "~/server/db";
import { todo } from "~/server/db/schema";

export const listTodos = (db: Db, userId: string) =>
  db.query.todo.findMany({
    where: eq(todo.userId, userId),
    orderBy: [desc(todo.createdAt)],
    limit: 200,
  });

export const createTodo = (db: Db, userId: string, title: string) =>
  db.insert(todo).values({
    id: crypto.randomUUID(),
    userId,
    title,
    done: false,
  });

export const findTodo = (db: Db, userId: string, id: string) =>
  db.query.todo.findFirst({
    where: and(eq(todo.id, id), eq(todo.userId, userId)),
  });

export const setTodoDone = (db: Db, userId: string, id: string, done: boolean) =>
  db
    .update(todo)
    .set({ done })
    .where(and(eq(todo.id, id), eq(todo.userId, userId)));

export const deleteTodo = (db: Db, userId: string, id: string) =>
  db.delete(todo).where(and(eq(todo.id, id), eq(todo.userId, userId)));

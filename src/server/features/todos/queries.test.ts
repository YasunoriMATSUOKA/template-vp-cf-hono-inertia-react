import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "~/server/db/schema";
import type { Db } from "~/server/db";
import { listTodos, createTodo, findTodo, setTodoDone, deleteTodo } from "./queries";

let db: Db;

beforeEach(async () => {
  const sqlite = new Database(":memory:");
  const drizzleDb = drizzle(sqlite, { schema });
  migrate(drizzleDb, { migrationsFolder: "./migrations" });
  // D1 dialect と better-sqlite3 dialect は同じ Drizzle クエリ API を持つので
  // 構造的互換を信頼してキャストする (テスト専用)。
  db = drizzleDb as unknown as Db;
  await db.insert(schema.user).values({
    id: "u1",
    email: "t@example.com",
    emailVerified: false,
  });
});

describe("todos queries", () => {
  it("createTodo + listTodos で挿入が見える", async () => {
    await createTodo(db, "u1", "foo");
    const rows = await listTodos(db, "u1");
    expect(rows).toHaveLength(1);
    expect(rows[0]!.title).toBe("foo");
    expect(rows[0]!.done).toBe(false);
  });

  it("findTodo で他人の todo は引けない", async () => {
    await createTodo(db, "u1", "foo");
    const [row] = await listTodos(db, "u1");
    const found = await findTodo(db, "u2", row!.id);
    expect(found).toBeUndefined();
  });

  it("setTodoDone で done が反転", async () => {
    await createTodo(db, "u1", "foo");
    const [row] = await listTodos(db, "u1");
    await setTodoDone(db, "u1", row!.id, true);
    const updated = await findTodo(db, "u1", row!.id);
    expect(updated!.done).toBe(true);
  });

  it("deleteTodo で消える", async () => {
    await createTodo(db, "u1", "foo");
    const [row] = await listTodos(db, "u1");
    await deleteTodo(db, "u1", row!.id);
    expect(await listTodos(db, "u1")).toHaveLength(0);
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "~/server/db/schema";
import type { Db } from "~/server/db";
import { hasCredentialAccount } from "./queries";

let db: Db;

beforeEach(async () => {
  const sqlite = new Database(":memory:");
  const drizzleDb = drizzle(sqlite, { schema });
  migrate(drizzleDb, { migrationsFolder: "./migrations" });
  db = drizzleDb as unknown as Db;
  await db.insert(schema.user).values([
    { id: "u-cred", email: "cred@example.com", emailVerified: true },
    { id: "u-google", email: "google@example.com", emailVerified: true },
  ]);
});

describe("hasCredentialAccount", () => {
  it("credential アカウントがあれば true", async () => {
    await db.insert(schema.account).values({
      id: "a1",
      userId: "u-cred",
      providerId: "credential",
      accountId: "cred@example.com",
      password: "hashed",
    });
    expect(await hasCredentialAccount(db, "u-cred")).toBe(true);
  });

  it("social (google) のみなら false", async () => {
    await db.insert(schema.account).values({
      id: "a2",
      userId: "u-google",
      providerId: "google",
      accountId: "google-sub-123",
    });
    expect(await hasCredentialAccount(db, "u-google")).toBe(false);
  });

  it("アカウントが無ければ false", async () => {
    expect(await hasCredentialAccount(db, "u-cred")).toBe(false);
  });
});

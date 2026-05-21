import { describe, it, expect } from "vitest";
import { createTodoInput, todoIdParam } from "./validators";

describe("createTodoInput", () => {
  it("正常タイトルを受け入れる", () => {
    const r = createTodoInput.safeParse({ title: "買い物" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.title).toBe("買い物");
  });

  it("前後空白を trim する", () => {
    const r = createTodoInput.safeParse({ title: "  買い物  " });
    expect(r.success && r.data.title).toBe("買い物");
  });

  it("空文字を拒否", () => {
    expect(createTodoInput.safeParse({ title: "" }).success).toBe(false);
  });

  it("201 文字を拒否", () => {
    expect(createTodoInput.safeParse({ title: "a".repeat(201) }).success).toBe(false);
  });

  it("title 欠落を拒否", () => {
    expect(createTodoInput.safeParse({}).success).toBe(false);
  });
});

describe("todoIdParam", () => {
  it("UUID v4 を受け入れる", () => {
    // crypto.randomUUID() が発行する形式 (variant bit "8|9|a|b", version "4")
    expect(todoIdParam.safeParse({ id: "550e8400-e29b-41d4-a716-446655440000" }).success).toBe(
      true,
    );
  });

  it("UUID v1 (時刻ベース) を拒否", () => {
    // version bit "1" の UUID。書き込み側が v4 のみなのに合わせて読み取り側も v4 限定。
    expect(todoIdParam.safeParse({ id: "c232ab00-9414-11ec-b909-0242ac120002" }).success).toBe(
      false,
    );
  });

  it("非 UUID 文字列を拒否", () => {
    expect(todoIdParam.safeParse({ id: "not-a-uuid" }).success).toBe(false);
  });

  it("空文字を拒否", () => {
    expect(todoIdParam.safeParse({ id: "" }).success).toBe(false);
  });

  it("id 欠落を拒否", () => {
    expect(todoIdParam.safeParse({}).success).toBe(false);
  });
});

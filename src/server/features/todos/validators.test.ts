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
    expect(todoIdParam.safeParse({ id: "550e8400-e29b-41d4-a716-446655440000" }).success).toBe(
      true,
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

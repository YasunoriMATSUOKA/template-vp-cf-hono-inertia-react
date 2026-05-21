import { describe, it, expect } from "vitest";
import { createTodoInput } from "./validators";

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

import { z } from "zod";

export const createTodoInput = z.object({
  title: z.string().trim().min(1).max(200),
});

// route param `:id` のフォーマット検証。queries.ts は crypto.randomUUID() で
// 発行した UUID v4 のみを書き込むため、読み取り側も v4 に絞って defense-in-depth
// する (z.uuid() だと v1-v8 全部許容になり、書き込み側との非対称が広がる)。
export const todoIdParam = z.object({
  id: z.uuidv4(),
});

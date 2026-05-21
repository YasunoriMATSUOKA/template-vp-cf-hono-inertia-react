import { z } from "zod";

export const createTodoInput = z.object({
  title: z.string().trim().min(1).max(200),
});

import type { PageProps } from "~/client/pages.gen";

// Drizzle の todo 行型 → Hono の c.render → @hono/inertia の PageProps から
// 1 度だけ抽出する。features/todos 配下のコンポーネントはこれを使う。
export type TodoItem = PageProps<"Todos/Index">["todos"][number];

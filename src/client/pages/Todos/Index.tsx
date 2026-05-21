import { router } from "@inertiajs/react";
import type { PageProps } from "~/client/pages.gen";
import { MainLayout } from "~/client/features/layout/MainLayout";
import { PageHeader } from "~/client/features/layout/PageHeader";
import { UserBadge } from "~/client/features/auth/UserBadge";
import { TodoForm } from "~/client/features/todos/TodoForm";
import { TodoList } from "~/client/features/todos/TodoList";

export default function TodosIndex({ auth, todos }: PageProps<"Todos/Index">) {
  const onCreate = (title: string, reset: () => void) => {
    router.post("/todos", { title }, { onSuccess: reset });
  };
  const onToggle = (id: string) => router.post(`/todos/${id}/toggle`);
  const onDelete = (id: string) => router.post(`/todos/${id}/delete`);

  return (
    <MainLayout className="max-w-2xl">
      <PageHeader title="Todo" actions={auth.user && <UserBadge user={auth.user} />} />
      <TodoForm onSubmit={onCreate} />
      <TodoList items={todos} onToggle={onToggle} onDelete={onDelete} />
    </MainLayout>
  );
}

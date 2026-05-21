import type { TodoItem } from "./types";

type Props = {
  items: TodoItem[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

export function TodoList({ items, onToggle, onDelete }: Props) {
  if (items.length === 0) {
    return (
      <p className="text-base-content/60">まだ Todo はありません。最初の一件を追加しましょう。</p>
    );
  }
  return (
    <ul className="divide-y divide-base-200">
      {items.map((t) => (
        <li key={t.id} className="flex items-center gap-3 py-2">
          <input
            type="checkbox"
            checked={t.done}
            onChange={() => onToggle(t.id)}
            className="checkbox checkbox-sm"
          />
          <span className={`flex-1 ${t.done ? "line-through text-base-content/50" : ""}`}>
            {t.title}
          </span>
          <button
            type="button"
            onClick={() => onDelete(t.id)}
            className="btn btn-sm btn-outline btn-error"
          >
            削除
          </button>
        </li>
      ))}
    </ul>
  );
}

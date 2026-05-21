import { useState } from "react";

type Props = {
  onSubmit: (title: string, reset: () => void) => void;
};

export function TodoForm({ onSubmit }: Props) {
  const [title, setTitle] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = title.trim();
    if (!value) return;
    onSubmit(value, () => setTitle(""));
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 my-4">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="やること"
        className="input input-bordered flex-1"
      />
      <button type="submit" className="btn btn-primary">
        追加
      </button>
    </form>
  );
}

import { useState } from "react";
import { authClient } from "./client";

type Props = {
  currentEmail: string;
};

// ログイン後のメールアドレス変更フォーム。
// 確認メールはまず現在(旧)アドレスへ送られ、承認後に新アドレスへ確認リンクが届く。
export function ChangeEmailForm({ currentEmail }: Props) {
  const [newEmail, setNewEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    const { error } = await authClient.changeEmail({ newEmail, callbackURL: "/verify-email" });
    setPending(false);
    if (error) {
      setError(error.message ?? "メールアドレスの変更に失敗しました。");
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <div className="alert alert-success text-sm">
        確認メールを送信しました。メール内のリンクから変更を承認してください。
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      {error && <div className="alert alert-error text-sm">{error}</div>}
      <p className="text-sm text-base-content/70">
        現在のメールアドレス: <strong>{currentEmail}</strong>
      </p>
      <input
        type="email"
        required
        value={newEmail}
        onChange={(e) => setNewEmail(e.target.value)}
        placeholder="新しいメールアドレス"
        autoComplete="email"
        className="input input-bordered w-full"
      />
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "送信中…" : "メールアドレスを変更"}
      </button>
    </form>
  );
}

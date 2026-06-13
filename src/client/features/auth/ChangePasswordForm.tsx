import { useState } from "react";
import { authClient } from "./client";

// ログイン中のユーザーが現在のパスワードを入力して新しいパスワードに変更するフォーム。
// メール送信は不要 (現在のパスワード認証のみ)。他のセッションは失効させる。
export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setDone(false);
    setPending(true);
    const { error } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });
    setPending(false);
    if (error) {
      setError(
        error.message ?? "パスワードの変更に失敗しました。現在のパスワードをご確認ください。",
      );
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setDone(true);
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      {error && <div className="alert alert-error text-sm">{error}</div>}
      {done && <div className="alert alert-success text-sm">パスワードを変更しました。</div>}
      <input
        type="password"
        required
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        placeholder="現在のパスワード"
        autoComplete="current-password"
        className="input input-bordered w-full"
      />
      <input
        type="password"
        required
        minLength={8}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="新しいパスワード (8 文字以上)"
        autoComplete="new-password"
        className="input input-bordered w-full"
      />
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "変更中…" : "パスワードを変更"}
      </button>
    </form>
  );
}

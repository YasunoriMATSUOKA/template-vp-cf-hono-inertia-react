import { useState } from "react";
import { router } from "@inertiajs/react";
import { authClient } from "./client";

// email + password でのサインアップフォーム。
// 確認必須の環境 (本番 / E2E) では session が張られないので「確認メール送信」を表示。
// 素のローカル dev (確認不要) では session が張られるので /todos へ遷移する。
export function EmailSignUpForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    const { data, error } = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: "/verify-email",
    });
    setPending(false);
    if (error) {
      setError(error.message ?? "登録に失敗しました。");
      return;
    }
    // 確認必須環境では token (session) が無い → 確認メール案内。dev は session あり → 遷移。
    if (data && "token" in data && data.token) {
      router.visit("/todos");
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <div className="alert alert-success text-sm">
        確認メールを送信しました。メール内のリンクからメールアドレスを確認してください。
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      {error && <div className="alert alert-error text-sm">{error}</div>}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="表示名"
        autoComplete="name"
        className="input input-bordered w-full"
      />
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="メールアドレス"
        autoComplete="email"
        className="input input-bordered w-full"
      />
      <input
        type="password"
        required
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="パスワード (8 文字以上)"
        autoComplete="new-password"
        className="input input-bordered w-full"
      />
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "登録中…" : "アカウント作成"}
      </button>
    </form>
  );
}

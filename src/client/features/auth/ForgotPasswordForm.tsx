import { useState } from "react";
import { authClient } from "./client";

// パスワードリセット要求フォーム。アカウント有無を漏らさないよう、
// 成否に関わらず汎用メッセージを表示する (Better Auth も enumeration-safe)。
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
    setPending(false);
    setDone(true);
  };

  if (done) {
    return (
      <div className="alert alert-success text-sm">
        入力されたアドレスが登録済みであれば、パスワード再設定用のメールを送信しました。
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="登録済みのメールアドレス"
        autoComplete="email"
        className="input input-bordered w-full"
      />
      <button type="submit" className="btn btn-outline" disabled={pending}>
        {pending ? "送信中…" : "再設定メールを送信"}
      </button>
    </form>
  );
}

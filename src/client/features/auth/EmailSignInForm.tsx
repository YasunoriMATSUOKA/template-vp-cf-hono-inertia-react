import { useState } from "react";
import { router } from "@inertiajs/react";
import { authClient } from "./client";

type Props = {
  callbackURL?: string;
};

// email + password でのログインフォーム。
// メール未確認 (EMAIL_NOT_VERIFIED) の場合は確認メールの再送導線を出す。
export function EmailSignInForm({ callbackURL = "/todos" }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [unverified, setUnverified] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setUnverified(false);
    setPending(true);
    const { error } = await authClient.signIn.email({ email, password, callbackURL });
    setPending(false);
    if (error) {
      if (error.code === "EMAIL_NOT_VERIFIED") {
        setUnverified(true);
        return;
      }
      setError(error.message ?? "ログインに失敗しました。");
      return;
    }
    router.visit(callbackURL);
  };

  const resend = async () => {
    setError(null);
    await authClient.sendVerificationEmail({ email, callbackURL: "/verify-email" });
    setUnverified(false);
    setNotice("確認メールを再送しました。メールのリンクから確認してください。");
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      {error && <div className="alert alert-error text-sm">{error}</div>}
      {notice && <div className="alert alert-success text-sm">{notice}</div>}
      {unverified && (
        <div className="alert alert-warning flex-col items-start gap-2 text-sm">
          <span>メールアドレスが未確認です。</span>
          <button type="button" className="btn btn-xs" onClick={resend}>
            確認メールを再送
          </button>
        </div>
      )}
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
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="パスワード"
        autoComplete="current-password"
        className="input input-bordered w-full"
      />
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "ログイン中…" : "メールアドレスでログイン"}
      </button>
    </form>
  );
}

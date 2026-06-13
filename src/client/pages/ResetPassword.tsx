import { useEffect, useState } from "react";
import { Link, router } from "@inertiajs/react";
import type { PageProps } from "~/client/pages.gen";
import { MainLayout } from "~/client/features/layout/MainLayout";
import { authClient } from "~/client/features/auth/client";

// パスワード再設定リンク (/api/auth/reset-password/<token>) からの着地ページ。
// Better Auth が ?token=... を付けてここへ 302 する。token を読んで新パスワードを送信する。
export default function ResetPassword(_props: PageProps<"ResetPassword">) {
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setError(params.get("error"));
    setToken(params.get("token"));
  }, []);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setPending(true);
    const { error } = await authClient.resetPassword({ newPassword: password, token });
    setPending(false);
    if (error) {
      setError(error.message ?? "再設定に失敗しました。リンクの有効期限切れの可能性があります。");
      return;
    }
    setDone(true);
  };

  return (
    <MainLayout className="max-w-md">
      <h1 className="text-3xl font-bold mb-4">パスワードの再設定</h1>
      {done ? (
        <>
          <div className="alert alert-success text-sm mb-4">パスワードを再設定しました。</div>
          <button type="button" className="btn btn-primary" onClick={() => router.visit("/login")}>
            ログインへ
          </button>
        </>
      ) : !token && !error ? (
        <p className="text-base-content/70">トークンを読み込んでいます…</p>
      ) : !token ? (
        <div className="alert alert-error text-sm">
          無効なリンクです。
          <Link href="/login" className="link ml-1">
            ログイン画面
          </Link>
          から再度お試しください。
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          {error && <div className="alert alert-error text-sm">{error}</div>}
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="新しいパスワード (8 文字以上)"
            autoComplete="new-password"
            className="input input-bordered w-full"
          />
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "送信中…" : "パスワードを再設定"}
          </button>
        </form>
      )}
    </MainLayout>
  );
}

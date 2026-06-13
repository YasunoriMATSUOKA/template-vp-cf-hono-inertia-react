import { useEffect, useState } from "react";
import { Link } from "@inertiajs/react";
import type { PageProps } from "~/client/pages.gen";
import { MainLayout } from "~/client/features/layout/MainLayout";

// メール確認リンク (/api/auth/verify-email) の callbackURL 着地ページ。
// 成功時はクエリ無し、失敗時は ?error=... が付く (Better Auth の挙動)。
export default function VerifyEmail({ auth }: PageProps<"VerifyEmail">) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setError(params.get("error"));
  }, []);

  return (
    <MainLayout className="max-w-md">
      <h1 className="text-3xl font-bold mb-4">メールアドレスの確認</h1>
      {error ? (
        <div className="alert alert-error text-sm mb-4">
          確認に失敗しました ({error})。リンクの有効期限が切れている可能性があります。
        </div>
      ) : (
        <div className="alert alert-success text-sm mb-4">メールアドレスの確認が完了しました。</div>
      )}
      <Link href={auth.user ? "/todos" : "/login"} className="link link-primary">
        {auth.user ? "→ 自分の Todo へ" : "→ ログインへ"}
      </Link>
    </MainLayout>
  );
}

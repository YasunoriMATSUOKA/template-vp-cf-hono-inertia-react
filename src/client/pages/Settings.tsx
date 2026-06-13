import type { PageProps } from "~/client/pages.gen";
import { MainLayout } from "~/client/features/layout/MainLayout";
import { PageHeader } from "~/client/features/layout/PageHeader";
import { UserBadge } from "~/client/features/auth/UserBadge";
import { ChangeEmailForm } from "~/client/features/auth/ChangeEmailForm";
import { ChangePasswordForm } from "~/client/features/auth/ChangePasswordForm";

// アカウント設定ページ (要ログイン)。
// 資格情報 (email/password) アカウントのときだけメール変更・パスワード変更を出す。
// Google など social のみのアカウントは provider 側で管理されるため変更不可。
export default function Settings({ auth, canManageCredentials }: PageProps<"Settings">) {
  return (
    <MainLayout className="max-w-2xl">
      <PageHeader title="設定" actions={auth.user && <UserBadge user={auth.user} />} />
      {canManageCredentials ? (
        <>
          <section className="mt-4">
            <h2 className="text-xl font-semibold mb-3">メールアドレスの変更</h2>
            {auth.user && <ChangeEmailForm currentEmail={auth.user.email} />}
          </section>
          <div className="divider my-8" />
          <section>
            <h2 className="text-xl font-semibold mb-3">パスワードの変更</h2>
            <ChangePasswordForm />
          </section>
        </>
      ) : (
        <div className="alert mt-4">
          <span>
            このアカウントは外部プロバイダ (Google など) でサインインしています。
            メールアドレスとパスワードはプロバイダ側で管理されます。
          </span>
        </div>
      )}
    </MainLayout>
  );
}

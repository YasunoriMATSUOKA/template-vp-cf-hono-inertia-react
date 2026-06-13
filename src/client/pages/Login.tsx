import { useState } from "react";
import { MainLayout } from "~/client/features/layout/MainLayout";
import { SignInButton } from "~/client/features/auth/SignInButton";
import { EmailSignInForm } from "~/client/features/auth/EmailSignInForm";
import { EmailSignUpForm } from "~/client/features/auth/EmailSignUpForm";
import { ForgotPasswordForm } from "~/client/features/auth/ForgotPasswordForm";

type Mode = "signin" | "signup";

export default function Login() {
  const [mode, setMode] = useState<Mode>("signin");
  const [forgot, setForgot] = useState(false);

  return (
    <MainLayout className="max-w-md">
      <h1 className="text-3xl font-bold mb-2">ログイン</h1>
      <p className="mb-6 text-base-content/70">
        Google アカウント、またはメールアドレスとパスワードでログインできます。
      </p>

      <SignInButton callbackURL="/todos" />

      <div className="divider my-6">または</div>

      <div role="tablist" className="tabs tabs-bordered mb-4">
        <button
          type="button"
          role="tab"
          className={`tab ${mode === "signin" ? "tab-active" : ""}`}
          onClick={() => setMode("signin")}
        >
          ログイン
        </button>
        <button
          type="button"
          role="tab"
          className={`tab ${mode === "signup" ? "tab-active" : ""}`}
          onClick={() => setMode("signup")}
        >
          新規登録
        </button>
      </div>

      {mode === "signin" ? <EmailSignInForm callbackURL="/todos" /> : <EmailSignUpForm />}

      <div className="mt-4">
        <button
          type="button"
          className="link link-hover text-sm text-base-content/70"
          onClick={() => setForgot((v) => !v)}
        >
          パスワードをお忘れですか？
        </button>
        {forgot && (
          <div className="mt-3">
            <ForgotPasswordForm />
          </div>
        )}
      </div>
    </MainLayout>
  );
}

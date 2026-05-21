import { MainLayout } from "~/client/features/layout/MainLayout";
import { SignInButton } from "~/client/features/auth/SignInButton";

export default function Login() {
  return (
    <MainLayout className="max-w-md">
      <h1 className="text-3xl font-bold mb-2">ログイン</h1>
      <p className="mb-6 text-base-content/70">Google アカウントでログインしてください。</p>
      <SignInButton callbackURL="/todos" />
    </MainLayout>
  );
}

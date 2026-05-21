import { router } from "@inertiajs/react";
import { authClient } from "./client";

type Props = {
  redirectTo?: string;
};

export function SignOutButton({ redirectTo = "/" }: Props) {
  const onClick = async () => {
    await authClient.signOut();
    router.visit(redirectTo);
  };
  return (
    <button type="button" onClick={onClick} className="btn btn-sm btn-outline">
      ログアウト
    </button>
  );
}

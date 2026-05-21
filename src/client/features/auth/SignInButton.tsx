import { authClient } from "./client";

type Props = {
  callbackURL?: string;
  children?: React.ReactNode;
};

export function SignInButton({ callbackURL = "/todos", children = "Google でログイン" }: Props) {
  const onClick = async () => {
    await authClient.signIn.social({ provider: "google", callbackURL });
  };
  return (
    <button type="button" onClick={onClick} className="btn btn-primary">
      {children}
    </button>
  );
}

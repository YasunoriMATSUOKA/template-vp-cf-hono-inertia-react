import { SignOutButton } from "./SignOutButton";

type Props = {
  user: { name: string | null; email: string };
};

export function UserBadge({ user }: Props) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm">{user.name ?? user.email}</span>
      <SignOutButton />
    </div>
  );
}

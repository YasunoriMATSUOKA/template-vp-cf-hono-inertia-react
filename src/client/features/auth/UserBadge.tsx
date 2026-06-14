import { useEffect, useRef, useState } from "react";
import { Link, router } from "@inertiajs/react";
import { authClient } from "./client";

type Props = {
  user: { name: string | null; email: string; image?: string | null };
};

// ヘッダ右上のアカウントメニュー。アバターをクリックすると
// ホーム / Todo一覧 / 設定 / ログアウト などのメニューが開く (将来のページ追加もここに足す)。
// 開閉は state で明示制御する (CSS focus 依存だと headless テストで不安定なため)。
export function UserBadge({ user }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const label = user.name ?? user.email;
  const initial = label.trim().charAt(0).toUpperCase() || "?";

  // メニュー外をクリックしたら閉じる
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const signOut = async () => {
    await authClient.signOut();
    router.visit("/");
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="アカウントメニュー"
        aria-expanded={open}
        className={`btn btn-ghost btn-circle avatar ${user.image ? "" : "avatar-placeholder"}`}
        onClick={() => setOpen((v) => !v)}
      >
        {user.image ? (
          <div className="w-9 rounded-full">
            <img src={user.image} alt={label} />
          </div>
        ) : (
          <div className="bg-neutral text-neutral-content w-9 rounded-full">
            <span className="text-sm">{initial}</span>
          </div>
        )}
      </button>
      {open && (
        <ul className="menu bg-base-100 rounded-box absolute right-0 z-10 mt-2 w-52 p-2 shadow">
          <li className="menu-title border-base-300 mb-1 truncate border-b pb-2">{label}</li>
          <li>
            <Link href="/" onClick={() => setOpen(false)}>
              ホーム
            </Link>
          </li>
          <li>
            <Link href="/todos" onClick={() => setOpen(false)}>
              Todo一覧
            </Link>
          </li>
          <li>
            <Link href="/settings" onClick={() => setOpen(false)}>
              設定
            </Link>
          </li>
          <li>
            <button type="button" onClick={signOut}>
              ログアウト
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}

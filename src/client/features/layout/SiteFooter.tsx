import { Link } from "@inertiajs/react";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-base-300 bg-base-100 mt-auto">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-6 py-4 text-sm text-base-content/70 sm:flex-row sm:justify-between">
        <p>© {year} Private Todo</p>
        <nav className="flex gap-4">
          <Link href="/privacy-policy" className="link link-hover">
            プライバシーポリシー
          </Link>
          <Link href="/terms-of-service" className="link link-hover">
            利用規約
          </Link>
        </nav>
      </div>
    </footer>
  );
}

import { Link } from "@inertiajs/react";
import { BrandMark } from "./BrandMark";

export function SiteHeader() {
  return (
    <header className="border-b border-base-300 bg-base-100">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80">
          <BrandMark className="h-7 w-7" />
          <span className="text-lg font-semibold">Private Todo</span>
        </Link>
      </div>
    </header>
  );
}

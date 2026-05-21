import { Link } from "@inertiajs/react";
import type { PageProps } from "~/client/pages.gen";
import { MainLayout } from "~/client/features/layout/MainLayout";

export default function Home({ auth }: PageProps<"Home">) {
  return (
    <MainLayout className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-2">Private Todo</h1>
      <p className="mb-6 text-base-content/70">
        Cloudflare Workers + Hono + Inertia + React + Better Auth + Drizzle (D1) のデモ。
      </p>
      {auth.user ? (
        <>
          <p className="mb-2">
            こんにちは、<strong>{auth.user.name ?? auth.user.email}</strong> さん。
          </p>
          <p>
            <Link href="/todos" className="link link-primary">
              → 自分の Todo へ
            </Link>
          </p>
        </>
      ) : (
        <p>
          <Link href="/login" className="link link-primary">
            Google でログインして始める
          </Link>
        </p>
      )}
    </MainLayout>
  );
}

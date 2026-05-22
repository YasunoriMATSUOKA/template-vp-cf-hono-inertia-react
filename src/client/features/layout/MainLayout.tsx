import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

type Props = {
  className?: string;
  children: React.ReactNode;
};

export function MainLayout({ className = "", children }: Props) {
  return (
    <div className="flex min-h-dvh flex-col bg-base-200">
      <SiteHeader />
      <main className={`mx-auto w-full p-6 ${className}`}>{children}</main>
      <SiteFooter />
    </div>
  );
}

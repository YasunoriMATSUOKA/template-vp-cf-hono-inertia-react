type Props = {
  className?: string;
  children: React.ReactNode;
};

export function MainLayout({ className = "", children }: Props) {
  return <main className={`mx-auto p-6 ${className}`}>{children}</main>;
}

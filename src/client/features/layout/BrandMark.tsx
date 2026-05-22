type Props = {
  className?: string;
  // 指定時のみ `role="img"` + `aria-label` を付ける。未指定 (default) では装飾扱い
  // (`aria-hidden`) になり、SiteHeader のように直後に同じ文字列のテキストノードがある
  // 場合の screen reader 二重読み上げを避ける。standalone で使う際に明示する。
  title?: string;
};

export function BrandMark({ className = "h-6 w-6", title }: Props) {
  const labeled = Boolean(title);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      className={className}
      role={labeled ? "img" : undefined}
      aria-label={labeled ? title : undefined}
      aria-hidden={labeled ? undefined : true}
    >
      <rect width="32" height="32" rx="7" fill="#10b981" />
      <path
        d="M8.5 16.5 L13.5 21.5 L23.5 10.5"
        fill="none"
        stroke="#ffffff"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

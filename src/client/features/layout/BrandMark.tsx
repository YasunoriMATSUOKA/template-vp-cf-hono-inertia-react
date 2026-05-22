type Props = {
  className?: string;
  title?: string;
};

export function BrandMark({ className = "h-6 w-6", title = "Private Todo" }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      className={className}
      role="img"
      aria-label={title}
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

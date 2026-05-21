type Props = {
  title: string;
  actions?: React.ReactNode;
};

export function PageHeader({ title, actions }: Props) {
  return (
    <header className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold">{title}</h1>
      {actions}
    </header>
  );
}

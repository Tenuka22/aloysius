export function EmptyState({
  title = "Nothing here yet",
  description = "Content will appear here once it's been added.",
  icon,
}: {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && <div className="mb-4 text-green-dark/30">{icon}</div>}
      <h3 className="font-heading text-lg font-semibold text-green-dark/60 mb-2">{title}</h3>
      <p className="text-sm text-green-dark/40 max-w-[40ch]">{description}</p>
    </div>
  );
}

export function PageEmpty({
  title = "Nothing here yet",
  description = "Content will appear here once it's been added by an administrator.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-green-dark/5 flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="w-7 h-7 text-green-dark/30"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
        </div>
        <h2 className="font-heading text-xl font-semibold text-green-dark/70">{title}</h2>
        <p className="text-sm text-green-dark/40 max-w-[45ch]">{description}</p>
      </div>
    </div>
  );
}

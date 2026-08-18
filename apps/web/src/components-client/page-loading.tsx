export function PageLoading() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-green-dark/20 border-t-green-dark rounded-full animate-spin" />
        <p className="text-sm text-green-dark/50 tracking-wide">Loading...</p>
      </div>
    </div>
  );
}

export function SectionLoading({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-green-dark/20 border-t-green-dark rounded-full animate-spin" />
        {label && <p className="text-xs text-green-dark/40 tracking-wide">{label}</p>}
      </div>
    </div>
  );
}

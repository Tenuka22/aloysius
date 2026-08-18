import { useNavigate } from "@tanstack/react-router";

export function PageError({ error, reset }: { error: Error; reset: () => void }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-red-brand/10 flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="w-7 h-7 text-red-brand/60"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>
        <h2 className="font-heading text-xl font-semibold text-green-dark/70">
          Something went wrong
        </h2>
        <p className="text-sm text-green-dark/40 max-w-[45ch]">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <div className="flex gap-3 mt-2">
          <button
            onClick={reset}
            className="px-5 py-2 text-sm font-bold bg-green-dark text-gold hover:bg-green-darker transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate({ to: "/" })}
            className="px-5 py-2 text-sm font-bold border border-green-dark/20 text-green-dark hover:border-green-dark transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}

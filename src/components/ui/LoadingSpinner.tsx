// LoadingSpinner.tsx — Animated gold spinner for loading states.
// Use this inside any component while data is being fetched.

type LoadingSpinnerProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZE_CLASSES = {
  sm: "w-4 h-4 border-2",
  md: "w-8 h-8 border-2",
  lg: "w-12 h-12 border-3",
};

export function LoadingSpinner({
  size = "md",
  className = "",
}: LoadingSpinnerProps) {
  return (
    <div
      className={`${SIZE_CLASSES[size]} rounded-full border-neutral-200 border-t-gold animate-spin ${className}`}
      aria-label="Loading"
      role="status"
    />
  );
}

/** Full-page centered loading overlay — used while checking auth on layout mount. */
export function PageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-text-med text-sm font-serif">Memuat...</p>
      </div>
    </div>
  );
}

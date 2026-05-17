export default function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-textMed">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-gold/40 border-t-gold" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}

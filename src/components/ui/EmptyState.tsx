export default function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="lux-card p-6 text-center">
      <div className="text-lg text-textHigh">{title}</div>
      <p className="mt-2 text-sm text-textMed">{body}</p>
    </div>
  );
}

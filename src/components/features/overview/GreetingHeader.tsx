export default function GreetingHeader({
  name,
  status,
}: {
  name: string;
  status: string;
}) {
  return (
    <div className="lux-card p-6">
      <div className="text-xl text-textHigh">{name}</div>
      <p className="mt-2 text-sm text-textMed">{status}</p>
    </div>
  );
}

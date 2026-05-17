export default function Sparkline({ data = [] }: { data?: number[] }) {
  if (!data.length) {
    return <div className="h-6 w-16 rounded bg-surface2" />;
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 64;
      const y = max === min ? 12 : 24 - ((value - min) / (max - min)) * 24;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width="64" height="24" viewBox="0 0 64 24">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        points={points}
        className="text-gold"
      />
    </svg>
  );
}

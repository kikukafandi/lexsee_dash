export default function ActivityFeed({
  items,
  title,
  subtitle,
}: {
  items: Array<{ label: string; time: string }>;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="lux-card h-80 p-4">
      <div className="text-xs uppercase tracking-widest text-textLow">{title}</div>
      <div className="text-lg text-textHigh">{subtitle}</div>
      <ul className="mt-4 space-y-3 text-sm">
        {items.map((item, index) => (
          <li
            key={`${item.label}-${index}`}
            className="flex items-start justify-between text-textHigh"
          >
            <span>{item.label}</span>
            <span className="text-xs text-textLow">{item.time}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

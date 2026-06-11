import { Sparkline } from "./Sparkline";

export default function KpiCard({
  label,
  value,
  trend,
  data = [],
}: {
  label: string;
  value: string | number;
  trend?: string;
  data?: number[];
}) {
  return (
    <div className="lux-card p-4">
      <div className="text-xs uppercase tracking-widest text-textLow">
        {label}
      </div>
      <div className="mt-2 flex items-end justify-between">
        <div
          className="text-2xl text-textHigh font-semibold"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {value}
        </div>
        <Sparkline data={data} />
      </div>
      {trend && (
        <div className="mt-2 text-xs text-success inline-flex items-center gap-2 rounded-full bg-surface2 px-2 py-1">
          {trend}
        </div>
      )}
    </div>
  );
}

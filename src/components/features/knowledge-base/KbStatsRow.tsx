import KpiCard from "@/components/ui/KpiCard";

export default function KbStatsRow({
  stats,
}: {
  stats: {
    documents: number;
    chunks: number;
    sessions: number;
    helpfulRate: number;
    negative: number;
  };
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <KpiCard label="Active Documents" value={stats.documents} />
      <KpiCard label="Vector Chunks" value={stats.chunks} />
      <KpiCard label="Chat Sessions" value={stats.sessions} />
      <KpiCard label="Helpful %" value={`${stats.helpfulRate}%`} />
      <KpiCard label="Negative" value={stats.negative} />
    </div>
  );
}

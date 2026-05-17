import KpiCard from "@/components/ui/KpiCard";

export default function KpiGrid({
  stats,
}: {
  stats: {
    documents: number;
    sessions: number;
    chunks: number;
    helpfulRate: number;
  };
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <KpiCard label="Active AI Documents" value={stats.documents} data={[2, 4, 3, 5, 6]} />
      <KpiCard label="Active Chat Sessions" value={stats.sessions} data={[1, 2, 4, 3, 6]} />
      <KpiCard label="Vector Embeddings" value={stats.chunks} data={[5, 4, 6, 4, 7]} />
      <KpiCard
        label="AI Helpful Rate"
        value={`${stats.helpfulRate}%`}
        data={[70, 72, 75, 78, stats.helpfulRate]}
      />
    </div>
  );
}

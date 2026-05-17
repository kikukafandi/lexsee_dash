import AreaChart from "@/components/ui/AreaChart";

export default function RevenueChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  return <AreaChart data={data} />;
}

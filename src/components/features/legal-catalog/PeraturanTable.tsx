import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import type { PeraturanItem } from "@/types";

export default function PeraturanTable({
  data,
  onPreview,
}: {
  data: PeraturanItem[];
  onPreview: (item: PeraturanItem) => void;
}) {
  return (
    <DataTable
      data={data}
      columns={[
        { key: "judul", label: "Judul" },
        {
          key: "jenis",
          label: "Jenis",
          render: (row) => <Badge label={row.jenis || "-"} />,
        },
        { key: "nomor", label: "Nomor" },
        { key: "tahun", label: "Tahun" },
        {
          key: "id",
          label: "PDF",
          render: (row) => (
            <button
              className="text-gold text-xs"
              onClick={() => onPreview(row)}
            >
              Preview
            </button>
          ),
        },
      ]}
      emptyText="Data peraturan belum tersedia."
    />
  );
}

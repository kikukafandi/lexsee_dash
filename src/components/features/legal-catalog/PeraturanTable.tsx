import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import type { Peraturan } from "@/types";

export default function PeraturanTable({
  data,
  onPreview,
}: {
  data: Peraturan[];
  onPreview: (item: Peraturan) => void;
}) {
  return (
    <DataTable
      data={data}
      columns={[
        { accessor: "judul", header: "Judul" },
        {
          accessor: "jenis",
          header: "Jenis",
          render: (row: Peraturan) => <Badge>{(row as unknown as { jenis?: string }).jenis || "-"}</Badge>,
        },
        { accessor: "nomor", header: "Nomor" },
        { accessor: "tahun", header: "Tahun" },
        {
          accessor: "id",
          header: "PDF",
          render: (row: Peraturan) => (
            <button
              className="text-gold text-xs"
              onClick={() => onPreview(row)}
            >
              Preview
            </button>
          ),
        },
      ]}
      emptyMessage="Data peraturan belum tersedia."
    />
  );
}

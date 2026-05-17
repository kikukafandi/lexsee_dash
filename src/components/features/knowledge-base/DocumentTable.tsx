import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import type { DocumentItem } from "@/types";

export default function DocumentTable({
  data,
  onDelete,
}: {
  data: DocumentItem[];
  onDelete: (id: string) => void;
}) {
  return (
    <DataTable
      data={data}
      columns={[
        { key: "title", label: "Title" },
        { key: "type", label: "Type" },
        { key: "chunks", label: "Chunks" },
        {
          key: "status",
          label: "Status",
          render: (row) => <Badge label={row.status || "-"} />,
        },
        { key: "createdAt", label: "Date" },
        {
          key: "id",
          label: "Actions",
          render: (row) => (
            <button
              className="text-error text-xs"
              onClick={() => row.id && onDelete(row.id)}
            >
              Delete
            </button>
          ),
        },
      ]}
      emptyText="Belum ada dokumen di knowledge base."
    />
  );
}

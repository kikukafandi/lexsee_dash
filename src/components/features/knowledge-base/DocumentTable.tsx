import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import type { LegalDocument } from "@/types";

export default function DocumentTable({
  data,
  onDelete,
}: {
  data: LegalDocument[];
  onDelete: (id: string) => void;
}) {
  return (
    <DataTable
      data={data}
      columns={[
        { accessor: "title", header: "Title" },
        { accessor: "type", header: "Type" },
        {
          accessor: "_count",
          header: "Chunks",
          render: (row: LegalDocument) => <span>{(row as unknown as { _count?: { chunks?: number } })._count?.chunks ?? 0}</span>,
        },
        {
          accessor: "isActive",
          header: "Status",
          render: (row: LegalDocument) => <Badge>{(row as unknown as { isActive?: boolean }).isActive ? "Active" : "Inactive"}</Badge>,
        },
        { accessor: "createdAt", header: "Date" },
        {
          accessor: "id",
          header: "Actions",
          render: (row: LegalDocument) => (
            <button
              className="text-danger text-xs"
              onClick={() => row.id && onDelete(row.id)}
            >
              Delete
            </button>
          ),
        },
      ]}
      emptyMessage="Belum ada dokumen di knowledge base."
    />
  );
}

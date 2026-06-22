// DataTable.tsx — Reusable, paginated data table.
// Used by Legal Catalog, Knowledge Base, Payments, Orders, and Users pages.
// Accepts a generic column definition so it works with any data type.

"use client";

import { EmptyState } from "./EmptyState";
import { LoadingSpinner } from "./LoadingSpinner";

// Column definition — describes one column in the table
export type Column<T> = {
  header: string;                          // Column header text
  accessor: keyof T | string;              // Property name in data row
  render?: (row: T) => React.ReactNode;    // Custom cell renderer (optional)
  width?: string;                          // Optional fixed width class e.g. "w-48"
};

type DataTableProps<T extends { id?: string }> = {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  emptyDescription?: string;
};

export function DataTable<T extends { id?: string }>({
  columns,
  data,
  loading = false,
  page = 1,
  totalPages = 1,
  onPageChange,
  onRowClick,
  emptyMessage,
  emptyDescription,
}: DataTableProps<T>) {
  // Get the value for a cell, supporting dot notation like "user.name" in future
  const getCellValue = (row: T, accessor: string): React.ReactNode => {
    return (row as Record<string, unknown>)[accessor] as React.ReactNode ?? "—";
  };

  return (
    <div>
      {/* Table wrapper with horizontal scroll for small screens */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200">
              {columns.map((col) => (
                <th
                  key={String(col.accessor)}
                  className={`text-left px-4 py-3 text-text-low text-xs font-semibold uppercase tracking-wider ${col.width ?? ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <div className="flex justify-center">
                    <LoadingSpinner />
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState title={emptyMessage} description={emptyDescription} />
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={row.id ?? rowIndex}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`border-b border-neutral-100 hover:bg-neutral-50 transition-colors ${
                    onRowClick ? "cursor-pointer" : ""
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.accessor)}
                      className="px-4 py-3 text-text-high"
                    >
                      {col.render
                        ? col.render(row)
                        : getCellValue(row, String(col.accessor))}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls — only shown if there are multiple pages */}
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-neutral-200 mt-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1 rounded border border-neutral-200 text-text-med text-xs hover:text-gold hover:border-neutral-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← Prev
          </button>
          <span className="text-text-low text-xs">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1 rounded border border-neutral-200 text-text-med text-xs hover:text-gold hover:border-neutral-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

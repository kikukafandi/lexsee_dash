type Column<T> = {
  key: keyof T;
  label: string;
  render?: (row: T) => React.ReactNode;
};

export default function DataTable<T extends { id?: string }>({
  columns,
  data,
  emptyText = "No data",
}: {
  columns: Column<T>[];
  data: T[];
  emptyText?: string;
}) {
  if (!data.length) {
    return (
      <div className="lux-card p-4 text-sm text-textMed">{emptyText}</div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-borderGold bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface2 text-textLow">
          <tr>
            {columns.map((column) => (
              <th key={String(column.key)} className="px-4 py-3 font-medium">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={row.id || index}
              className="border-t border-dividerGold text-textHigh"
            >
              {columns.map((column) => (
                <td key={String(column.key)} className="px-4 py-3">
                  {column.render ? column.render(row) : (row[column.key] as any)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

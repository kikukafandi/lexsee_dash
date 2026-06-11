// EmptyState.tsx — Shown when a table or list has no data.
// Provides a consistent "no data" experience across all pages.

import { Inbox } from "lucide-react";

type EmptyStateProps = {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
};

export function EmptyState({
  title = "Tidak ada data",
  description = "Belum ada data yang tersedia.",
  icon = <Inbox className="text-text-med w-10 h-10" />,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex items-center justify-center" aria-hidden="true">
        {icon}
      </div>
      <p className="text-text-high font-semibold mb-1">{title}</p>
      <p className="text-text-low text-sm max-w-xs">{description}</p>
    </div>
  );
}

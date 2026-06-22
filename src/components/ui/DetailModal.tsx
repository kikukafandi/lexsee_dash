"use client";

// DetailModal — modal kartu di tengah layar untuk menampilkan detail satu record.
// Menerima daftar baris label/value (value boleh ReactNode, mis. Badge).

import { useEffect } from "react";
import { X } from "lucide-react";

export type DetailRow = { label: string; value: React.ReactNode };

type DetailModalProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  rows: DetailRow[];
  onClose: () => void;
  footer?: React.ReactNode;
};

export function DetailModal({ open, title, subtitle, rows, onClose, footer }: DetailModalProps) {
  // Tutup dengan tombol Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-surface-1 rounded-2xl border border-neutral-200 shadow-xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-neutral-200">
          <div>
            <h3 className="text-text-high font-semibold text-lg">{title}</h3>
            {subtitle && <p className="text-text-low text-xs mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-med hover:bg-surface-2 hover:text-text-high transition-colors"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-4">
          <dl className="divide-y divide-neutral-100">
            {rows.map((r, i) => (
              <div key={i} className="flex justify-between gap-4 py-2.5">
                <dt className="text-text-med text-sm shrink-0">{r.label}</dt>
                <dd className="text-text-high text-sm text-right break-words min-w-0">
                  {r.value ?? "—"}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {footer && (
          <div className="px-6 py-3 border-t border-neutral-200 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

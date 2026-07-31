// Modal.tsx — Full-screen overlay modal.
// Used primarily for PDF preview in the Legal Catalog page.
// Clicking the backdrop or pressing Escape closes the modal.

"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const pemicuRef = useRef<HTMLElement | null>(null);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // [WEB-06] Fokus dipindahkan ke dalam modal saat dibuka, dan dikembalikan ke
  // elemen pemicunya saat ditutup. Tanpa ini, pengguna keyboard dan pembaca layar
  // tetap tertinggal di halaman belakang: Tab berjalan di konten yang tertutup
  // overlay, dan modalnya sendiri tidak pernah diumumkan.
  useEffect(() => {
    if (!isOpen) return;

    pemicuRef.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    return () => pemicuRef.current?.focus();
  }, [isOpen]);

  // [WEB-06] Jebak Tab di dalam modal selama terbuka.
  useEffect(() => {
    if (!isOpen) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;

      const fokusabel = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (fokusabel.length === 0) return;

      const pertama = fokusabel[0];
      const terakhir = fokusabel[fokusabel.length - 1];

      if (e.shiftKey && document.activeElement === pertama) {
        e.preventDefault();
        terakhir.focus();
      } else if (!e.shiftKey && document.activeElement === terakhir) {
        e.preventDefault();
        pertama.focus();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    // Semi-transparent backdrop
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/40"
      onClick={onClose}
    >
      {/* [WEB-06] Header DAN konten berada di dalam satu panel dialog. Kalau
          panelnya cuma membungkus konten, tombol Tutup jatuh di luar focus trap
          dan justru menjadi satu-satunya kontrol yang tidak bisa dicapai Tab. */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? "Dialog"}
        tabIndex={-1}
        className="flex flex-1 min-h-0 flex-col outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar — click here does NOT close (stopPropagation) */}
        <div className="flex items-center justify-between px-6 py-3 bg-surface-2 border-b border-neutral-200 shrink-0">
          {title && (
            <span className="text-text-high text-sm font-semibold truncate max-w-[70%]">
              {title}
            </span>
          )}
          <button
            onClick={onClose}
            className="ml-auto flex items-center gap-1.5 text-text-med hover:text-gold transition-colors text-sm px-3 py-1 rounded border border-neutral-200 hover:border-neutral-400"
          >
            <X size={14} /> Tutup
          </button>
        </div>

        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

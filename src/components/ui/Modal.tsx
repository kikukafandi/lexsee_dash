// Modal.tsx — Dialog di tengah layar untuk form dan konfirmasi.
// `fullScreen` untuk konten yang butuh seluruh layar, mis. pratinjau PDF.
// Klik latar atau Escape menutup dialog.

"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Layar penuh (pratinjau PDF). Bawaannya dialog di tengah. */
  fullScreen?: boolean;
};

export function Modal({ isOpen, onClose, title, children, fullScreen = false }: ModalProps) {
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
      className={`fixed inset-0 z-50 bg-black/40 animate-latar ${
        fullScreen ? "flex flex-col" : "flex items-center justify-center p-4"
      }`}
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
        className={
          fullScreen
            ? "flex flex-1 min-h-0 flex-col outline-none bg-surface-1"
            : "w-full max-w-2xl max-h-[90vh] flex flex-col outline-none bg-surface-1 rounded-2xl border border-neutral-200 shadow-2xl overflow-hidden animate-dialog"
        }
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar — click here does NOT close (stopPropagation) */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-neutral-200 shrink-0">
          {title && (
            <h2 className="text-text-high text-base font-semibold truncate">{title}</h2>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="ml-auto -mr-2 p-2 text-text-low hover:text-text-high transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className={fullScreen ? "flex-1 overflow-hidden" : "min-h-0 overflow-y-auto"}>{children}</div>
      </div>
    </div>
  );
}

// Modal.tsx — Full-screen overlay modal.
// Used primarily for PDF preview in the Legal Catalog page.
// Clicking the backdrop or pressing Escape closes the modal.

"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    // Semi-transparent backdrop
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/40"
      onClick={onClose}
    >
      {/* Header bar — click here does NOT close (stopPropagation) */}
      <div
        className="flex items-center justify-between px-6 py-3 bg-surface-2 border-b border-neutral-200 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
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

      {/* Modal content — click here does NOT close */}
      <div
        className="flex-1 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

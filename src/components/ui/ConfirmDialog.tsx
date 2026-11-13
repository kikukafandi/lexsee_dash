"use client";

// ConfirmDialog.tsx — Konfirmasi untuk aksi berisiko (uang, hapus, tak bisa dibatalkan).
// Pengganti confirm() bawaan browser. Pakai lewat hook:
//
//   const { confirm, dialog } = useConfirm();
//   confirm({ title, message, confirmLabel, tone: "danger", onConfirm: async () => {...} });
//   return <>{...}{dialog}</>;
//
// Selama onConfirm berjalan kedua tombol nonaktif, jadi klik dua kali tidak
// mengirim permintaan dua kali. Kalau onConfirm gagal, dialog tetap terbuka
// dan pesan galatnya tampil di dalam dialog.

import { useCallback, useEffect, useRef, useState } from "react";
import { pesanGalat } from "@/lib/labels";

export type ConfirmOptions = {
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  tone?: "danger" | "default";
  /** Kata kerja untuk pesan galat, mis. "menandai transfer". */
  aksi?: string;
  onConfirm: () => Promise<void> | void;
};

export function useConfirm() {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const confirm = useCallback((o: ConfirmOptions) => setOpts(o), []);
  const dialog = opts ? <ConfirmDialog opts={opts} onClose={() => setOpts(null)} /> : null;
  return { confirm, dialog };
}

function ConfirmDialog({ opts, onClose }: { opts: ConfirmOptions; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const batalRef = useRef<HTMLButtonElement>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    const pemicu = document.activeElement as HTMLElement | null;
    batalRef.current?.focus();
    return () => pemicu?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busyRef.current) {
        e.stopImmediatePropagation();
        onClose();
      }
    };
    // capture: dialog ini di atas modal lain, jadi Esc-nya tidak boleh menutup modal di belakang.
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  const jalankan = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      await opts.onConfirm();
      onClose();
    } catch (err) {
      setError(pesanGalat(err, opts.aksi ?? "menjalankan aksi"));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const danger = opts.tone === "danger";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40"
      onClick={() => !busy && onClose()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-msg"
        className="w-full max-w-md rounded-xl bg-surface-1 border border-neutral-200 shadow-xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="text-base font-semibold text-text-high">
          {opts.title}
        </h2>
        <div id="confirm-msg" className="mt-2 text-sm text-text-med leading-relaxed">
          {opts.message}
        </div>
        {error && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {error}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            ref={batalRef}
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 rounded-lg text-sm text-text-med hover:text-text-high hover:bg-surface-2 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={jalankan}
            disabled={busy}
            className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-60 ${
              danger ? "bg-danger hover:opacity-90" : "bg-maroon hover:bg-maroon-dark"
            }`}
          >
            {busy ? "Memproses…" : opts.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

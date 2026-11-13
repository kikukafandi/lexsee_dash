"use client";

// AksiPenarikan — tombol Setujui / Tolak / Tandai sudah ditransfer untuk satu
// penarikan saldo ahli. Setiap aksi dikonfirmasi dengan menyebut nominal dan
// rekening tujuan. Dipakai di halaman Penarikan Saldo dan Perlu Ditindak.

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { formatRupiah } from "@/lib/notifications";
import { useConfirm } from "@/components/ui/ConfirmDialog";

export type Withdrawal = {
  id: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: string;
  adminNote?: string | null;
  createdAt: string;
  expert?: { id: string; name: string; email: string } | null;
};

const AKSI = {
  APPROVED: {
    title: "Setujui penarikan",
    confirmLabel: "Setujui",
    akibat: "Setelah disetujui, lakukan transfer lalu tandai sudah ditransfer.",
    sukses: "Penarikan disetujui.",
  },
  TRANSFERRED: {
    title: "Tandai sudah ditransfer",
    confirmLabel: "Ya, sudah ditransfer",
    akibat: "Saldo ahli akan berkurang dan ini tidak bisa dibatalkan. Pastikan uangnya sudah benar-benar terkirim.",
    sukses: "Penarikan ditandai sudah ditransfer.",
  },
  REJECTED: {
    title: "Tolak penarikan",
    confirmLabel: "Tolak",
    akibat: "Saldo dikembalikan ke ahli dan permintaan ini ditutup.",
    sukses: "Penarikan ditolak.",
  },
} as const;

type Props = {
  w: Withdrawal;
  /** Dipanggil setelah aksi sukses, dengan status baru dan pesan untuk toast. */
  onDone: (w: Withdrawal, pesan: string) => void;
};

export function AksiPenarikan({ w, onDone }: Props) {
  const { confirm, dialog } = useConfirm();
  const [busy, setBusy] = useState(false);

  function jalankan(status: keyof typeof AKSI) {
    const a = AKSI[status];
    confirm({
      title: a.title,
      tone: status === "APPROVED" ? "default" : "danger",
      confirmLabel: a.confirmLabel,
      aksi: "memproses penarikan",
      message: (
        <>
          <p>
            <b className="text-text-high">{formatRupiah(Number(w.amount))}</b> untuk{" "}
            <b className="text-text-high">{w.expert?.name ?? "ahli"}</b> ke {w.bankName} {w.accountNumber} a.n.{" "}
            {w.accountName}.
          </p>
          <p className="mt-2">{a.akibat}</p>
        </>
      ),
      onConfirm: async () => {
        setBusy(true);
        try {
          await apiFetch(`/api/webinar/admin/withdrawals/${w.id}`, {
            method: "PATCH",
            body: JSON.stringify({ status }),
          });
          onDone({ ...w, status }, a.sukses);
        } finally {
          setBusy(false);
        }
      },
    });
  }

  const utama =
    "px-2.5 py-1 rounded-md text-white text-xs font-semibold transition-colors disabled:opacity-50";
  return (
    <>
      {w.status === "PENDING" ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => jalankan("APPROVED")} disabled={busy} className={`${utama} bg-maroon hover:bg-maroon-dark`}>
            Setujui
          </button>
          <button
            type="button"
            onClick={() => jalankan("REJECTED")}
            disabled={busy}
            className="px-2 py-1 text-xs font-semibold text-text-med hover:text-danger transition-colors disabled:opacity-50"
          >
            Tolak
          </button>
        </div>
      ) : w.status === "APPROVED" ? (
        <button type="button" onClick={() => jalankan("TRANSFERRED")} disabled={busy} className={`${utama} bg-success hover:opacity-90`}>
          Tandai sudah ditransfer
        </button>
      ) : (
        <span className="text-text-low text-xs">—</span>
      )}
      {dialog}
    </>
  );
}

"use client";

// AksiPesanan — tombol aksi admin untuk satu pesanan buku (Proses, Kirim,
// Tandai diterima, Batalkan). Dipakai di halaman Pesanan Buku dan Perlu Ditindak.
// "Kirim" meminta nomor resi; "Batalkan" meminta konfirmasi.

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { aksiPesanan, pesanGalat } from "@/lib/labels";
import { useConfirm } from "@/components/ui/ConfirmDialog";

export type PesananRingkas = {
  id: string;
  status: string;
  recipientName?: string;
  user?: { name?: string } | null;
};

type Props<T extends PesananRingkas> = {
  order: T;
  onDone: (updated: T, pesan: string) => void;
  onError?: (pesan: string) => void;
};

export function AksiPesanan<T extends PesananRingkas>({ order, onDone, onError }: Props<T>) {
  const { confirm, dialog } = useConfirm();
  const [busy, setBusy] = useState(false);
  const [kirimTerbuka, setKirimTerbuka] = useState(false);

  const nama = order.recipientName ?? order.user?.name ?? "pemesan";

  async function ubah(ke: string, trackingNumber?: string) {
    const res = await apiFetch<T>(`/api/admin/orders/${order.id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: ke, trackingNumber }),
    });
    const pesan =
      ke === "SHIPPED" ? "Pesanan ditandai dikirim. Pemesan mendapat nomor resi."
      : ke === "CANCELLED" ? "Pesanan dibatalkan."
      : ke === "DELIVERED" ? "Pesanan ditandai diterima."
      : "Pesanan sedang diproses.";
    onDone({ ...order, ...res }, pesan);
  }

  async function langsung(ke: string) {
    setBusy(true);
    try {
      await ubah(ke);
    } catch (err) {
      onError?.(pesanGalat(err, "mengubah status pesanan"));
    } finally {
      setBusy(false);
    }
  }

  const klik = (ke: string) => (e: React.MouseEvent) => {
    e.stopPropagation(); // jangan ikut membuka detail baris
    if (ke === "SHIPPED") return setKirimTerbuka(true);
    if (ke === "CANCELLED") {
      return confirm({
        title: "Batalkan pesanan",
        tone: "danger",
        confirmLabel: "Batalkan pesanan",
        aksi: "membatalkan pesanan",
        message: `Pesanan untuk ${nama} akan dibatalkan dan pemesan mendapat pemberitahuan. Pengembalian dana dilakukan terpisah. Pembatalan tidak bisa diurungkan.`,
        onConfirm: () => ubah("CANCELLED"),
      });
    }
    void langsung(ke);
  };

  const aksi = aksiPesanan(order.status);
  if (aksi.length === 0) return <span className="text-text-low text-xs">—</span>;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {aksi.map((a) => (
          <button
            key={a.ke}
            type="button"
            disabled={busy}
            onClick={klik(a.ke)}
            className={
              a.ke === "CANCELLED"
                ? "px-2 py-1 text-xs font-semibold text-text-med hover:text-danger transition-colors disabled:opacity-50"
                : "px-2.5 py-1 rounded-md bg-maroon text-white text-xs font-semibold hover:bg-maroon-dark transition-colors disabled:opacity-50"
            }
          >
            {a.tombol}
          </button>
        ))}
      </div>
      {kirimTerbuka && (
        <DialogResi
          nama={nama}
          onClose={() => setKirimTerbuka(false)}
          onKirim={(resi) => ubah("SHIPPED", resi)}
        />
      )}
      {dialog}
    </>
  );
}

function DialogResi({
  nama,
  onClose,
  onKirim,
}: {
  nama: string;
  onClose: () => void;
  onKirim: (resi: string) => Promise<void>;
}) {
  const [resi, setResi] = useState("");
  const [busy, setBusy] = useState(false);
  const [galat, setGalat] = useState("");

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    if (!resi.trim() || busy) return;
    setBusy(true);
    setGalat("");
    try {
      await onKirim(resi.trim());
      onClose();
    } catch (err) {
      setGalat(pesanGalat(err, "menandai pesanan dikirim"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40"
      onClick={(e) => {
        e.stopPropagation();
        if (!busy) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && !busy) {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="resi-title"
        onSubmit={kirim}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl bg-surface-1 border border-neutral-200 shadow-xl p-5"
      >
        <h2 id="resi-title" className="text-base font-semibold text-text-high">
          Kirim pesanan
        </h2>
        <p className="mt-2 text-sm text-text-med">
          Masukkan nomor resi pengiriman untuk {nama}. Pemesan akan menerima nomor ini lewat notifikasi.
        </p>
        <label className="block mt-4">
          <span className="block text-xs text-text-med mb-1">Nomor resi</span>
          <input
            autoFocus
            value={resi}
            onChange={(e) => setResi(e.target.value)}
            maxLength={60}
            className="w-full bg-surface-2 border border-neutral-200 rounded-lg px-3 py-2 text-sm text-text-high focus:outline-none focus:border-maroon focus:ring-1 focus:ring-gold/50"
            placeholder="Contoh: JNE0123456789"
          />
        </label>
        {galat && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {galat}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 rounded-lg text-sm text-text-med hover:text-text-high hover:bg-surface-2 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={busy || !resi.trim()}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-maroon hover:bg-maroon-dark transition-colors disabled:opacity-50"
          >
            {busy ? "Memproses…" : "Tandai dikirim"}
          </button>
        </div>
      </form>
    </div>
  );
}

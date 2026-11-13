"use client";

// Perlu Ditindak — halaman pertama admin. Merangkum antrean pekerjaan dari
// endpoint yang sudah ada. Tiap bagian dimuat terpisah (Promise.allSettled),
// jadi satu bagian gagal tidak mengganggu bagian lain.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CircleCheck, ChevronRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { label, pesanGalat } from "@/lib/labels";
import { formatRupiah } from "@/lib/notifications";
import { Toast, useToast } from "@/components/ui/Toast";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { AksiPenarikan, type Withdrawal } from "@/components/features/withdrawals/AksiPenarikan";
import { AksiPesanan } from "@/components/features/orders/AksiPesanan";

const MAKS_BARIS = 5;

type Orang = { name?: string | null; email?: string | null } | null | undefined;
type Pengajuan = { id: string; profession: string; createdAt: string; user?: Orang };
type Refund = {
  id: string;
  price: number | string;
  paidAmount?: number | string | null;
  createdAt: string;
  client?: Orang;
  expert?: Orang;
};
type Pesanan = {
  id: string;
  status: string;
  totalAmount: string;
  recipientName: string;
  createdAt: string;
  user?: { name?: string } | null;
};

type Bagian<T> = { status: "muat" | "ok" | "galat"; data: T[]; galat?: string };
const awal = <T,>(): Bagian<T> => ({ status: "muat", data: [] });

const tgl = (s: string) =>
  new Date(s).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

const PENGAMBIL = {
  penarikan: async () =>
    (await apiFetch<Withdrawal[]>("/api/webinar/admin/withdrawals")).filter((w) =>
      ["PENDING", "APPROVED"].includes(w.status),
    ),
  pengajuan: () => apiFetch<Pengajuan[]>("/api/expert/admin/applications?status=PENDING"),
  refund: () => apiFetch<Refund[]>("/api/consultations/admin/refunds"),
  pesanan: async () => {
    const [dibayar, diproses] = await Promise.all([
      apiFetch<Pesanan[]>("/api/admin/orders?status=PAID"),
      apiFetch<Pesanan[]>("/api/admin/orders?status=PROCESSING"),
    ]);
    return [...dibayar, ...diproses];
  },
};
type Kunci = keyof typeof PENGAMBIL;
const AKSI_MUAT: Record<Kunci, string> = {
  penarikan: "memuat penarikan saldo",
  pengajuan: "memuat pengajuan ahli",
  refund: "memuat refund konsultasi",
  pesanan: "memuat pesanan",
};

export default function InboxPage() {
  const { toast, showToast } = useToast();
  const [penarikan, setPenarikan] = useState(awal<Withdrawal>());
  const [pengajuan, setPengajuan] = useState(awal<Pengajuan>());
  const [refund, setRefund] = useState(awal<Refund>());
  const [pesanan, setPesanan] = useState(awal<Pesanan>());

  const setter = { penarikan: setPenarikan, pengajuan: setPengajuan, refund: setRefund, pesanan: setPesanan } as const;

  const muat = useCallback(async (kunci: Kunci[]) => {
    type SetUmum = (u: Bagian<unknown> | ((b: Bagian<unknown>) => Bagian<unknown>)) => void;
    const ambilSetter = (k: Kunci) => setter[k] as unknown as SetUmum;
    for (const k of kunci) ambilSetter(k)((b) => ({ ...b, status: "muat" }));
    const hasil = await Promise.allSettled(kunci.map((k) => PENGAMBIL[k]()));
    hasil.forEach((h, i) => {
      const k = kunci[i];
      const set = ambilSetter(k);
      if (h.status === "fulfilled") set({ status: "ok", data: Array.isArray(h.value) ? h.value : [] });
      else set({ status: "galat", data: [], galat: pesanGalat(h.reason, AKSI_MUAT[k]) });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void muat(["penarikan", "pengajuan", "refund", "pesanan"]);
  }, [muat]);

  const semua = [penarikan, pengajuan, refund, pesanan];
  const selesaiMuat = semua.every((b) => b.status !== "muat");
  const kosongSemua = semua.every((b) => b.status === "ok" && b.data.length === 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif text-text-high">Perlu Ditindak</h1>
        <p className="text-text-med text-sm mt-0.5">Pekerjaan yang sedang menunggu tim admin.</p>
      </div>

      {selesaiMuat && kosongSemua ? (
        <div className="bg-surface-1 border border-neutral-200 rounded-xl p-10 flex flex-col items-center text-center gap-3">
          <CircleCheck size={36} className="text-success" aria-hidden="true" />
          <p className="text-text-high font-medium">Tidak ada yang perlu dikerjakan sekarang.</p>
          <p className="text-text-low text-sm">Pekerjaan baru akan muncul di sini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
          <Kartu
            judul="Penarikan saldo ahli"
            href="/withdrawals"
            bagian={penarikan}
            onUlang={() => muat(["penarikan"])}
            baris={(w) => (
              <Baris
                key={w.id}
                utama={`${formatRupiah(Number(w.amount))} untuk ${w.expert?.name ?? "ahli"}`}
                kedua={`${label("withdrawal", w.status)} · ${w.bankName} ${w.accountNumber}`}
                aksi={
                  <AksiPenarikan
                    w={w}
                    onDone={(baru, pesan) => {
                      showToast(pesan);
                      setPenarikan((b) => ({
                        ...b,
                        data: baru.status === "APPROVED"
                          ? b.data.map((x) => (x.id === baru.id ? baru : x))
                          : b.data.filter((x) => x.id !== baru.id),
                      }));
                    }}
                  />
                }
              />
            )}
          />

          <Kartu
            judul="Pesanan buku perlu dikirim"
            href="/orders"
            bagian={pesanan}
            onUlang={() => muat(["pesanan"])}
            baris={(o) => (
              <Baris
                key={o.id}
                utama={`${o.recipientName} · ${formatRupiah(Number(o.totalAmount))}`}
                kedua={`${label("order", o.status)} · ${tgl(o.createdAt)}`}
                aksi={
                  <AksiPesanan
                    order={o}
                    onError={(p) => showToast(p, "error")}
                    onDone={(baru, pesan) => {
                      showToast(pesan);
                      setPesanan((b) => ({
                        ...b,
                        data: ["PAID", "PROCESSING"].includes(baru.status)
                          ? b.data.map((x) => (x.id === baru.id ? baru : x))
                          : b.data.filter((x) => x.id !== baru.id),
                      }));
                    }}
                  />
                }
              />
            )}
          />

          <Kartu
            judul="Pengajuan ahli hukum"
            href="/expert-applications"
            bagian={pengajuan}
            onUlang={() => muat(["pengajuan"])}
            baris={(a) => (
              <Baris
                key={a.id}
                utama={a.user?.name ?? "Pemohon"}
                kedua={`Diajukan ${tgl(a.createdAt)}`}
                aksi={<TautanAksi href="/expert-applications">Tinjau</TautanAksi>}
              />
            )}
          />

          <Kartu
            judul="Refund konsultasi"
            href="/consultations"
            bagian={refund}
            onUlang={() => muat(["refund"])}
            baris={(r) => (
              <Baris
                key={r.id}
                utama={`${formatRupiah(Number(r.paidAmount ?? r.price))} ke ${r.client?.name ?? "klien"}`}
                kedua={`Tidak dijawab ${r.expert?.name ?? "ahli"} tepat waktu`}
                aksi={<TautanAksi href="/consultations">Proses</TautanAksi>}
              />
            )}
          />
        </div>
      )}
      <Toast state={toast} />
    </div>
  );
}

function Kartu<T>({
  judul,
  href,
  bagian,
  onUlang,
  baris,
}: {
  judul: string;
  href: string;
  bagian: Bagian<T>;
  onUlang: () => void;
  baris: (item: T) => React.ReactNode;
}) {
  const jumlah = bagian.data.length;
  return (
    <section className="bg-surface-1 border border-neutral-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-neutral-200">
        <h2 className="text-text-high font-medium">
          {judul}
          {bagian.status === "ok" && <span className="ml-2 text-text-low font-normal">{jumlah}</span>}
        </h2>
        <Link href={href} className="text-xs text-text-med hover:text-maroon flex items-center gap-0.5">
          Lihat semua <ChevronRight size={14} aria-hidden="true" />
        </Link>
      </div>
      {bagian.status === "muat" ? (
        <div className="p-6 flex justify-center">
          <LoadingSpinner size="sm" />
        </div>
      ) : bagian.status === "galat" ? (
        <div className="p-5 text-sm">
          <p className="text-danger">{bagian.galat}</p>
          <button type="button" onClick={onUlang} className="mt-2 text-maroon font-semibold hover:underline">
            Coba lagi
          </button>
        </div>
      ) : jumlah === 0 ? (
        <p className="p-5 text-sm text-text-low">Tidak ada yang menunggu.</p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {bagian.data.slice(0, MAKS_BARIS).map(baris)}
          {jumlah > MAKS_BARIS && (
            <li className="px-5 py-2.5 text-xs text-text-low">dan {jumlah - MAKS_BARIS} lainnya</li>
          )}
        </ul>
      )}
    </section>
  );
}

function Baris({ utama, kedua, aksi }: { utama: string; kedua: string; aksi: React.ReactNode }) {
  return (
    <li className="px-5 py-3 flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm text-text-high font-medium truncate">{utama}</p>
        <p className="text-xs text-text-low">{kedua}</p>
      </div>
      <div className="shrink-0">{aksi}</div>
    </li>
  );
}

function TautanAksi({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-2.5 py-1 rounded-md bg-maroon text-white text-xs font-semibold hover:bg-maroon-dark transition-colors"
    >
      {children}
    </Link>
  );
}

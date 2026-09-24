"use client";

// Konsultasi Ahli — admin memantau konsultasi berbayar klien → expert,
// memproses refund konsultasi yang lewat SLA, dan mengatur bagi hasil expert.
// Sesuai ConsultationController backend (`/api/consultations/admin/...`).

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";

type Topic = "KONSULTASI_HUKUM" | "BANTUAN_HUKUM" | "PENDAMPINGAN_SKRIPSI";
type Status =
  | "PENDING_PAYMENT"
  | "AWAITING_EXPERT"
  | "ANSWERED"
  | "EXPIRED"
  | "REFUNDED"
  | "CANCELLED";

type Orang = { id: string; name: string; email?: string } | null;

type Consultation = {
  id: string;
  orderId: string;
  topic: Topic;
  question: string;
  status: Status;
  price: number | string;
  platformFeePercent: number;
  platformFee: number | string;
  expertEarning: number | string;
  respondBefore?: string | null;
  createdAt: string;
  closedAt?: string | null;
  adminNote?: string | null;
  client?: Orang;
  expert?: Orang;
  /** Hanya di antrean refund: total yang dibayar klien. */
  paidAmount?: number;
};

type Rate = {
  expertId: string;
  topic: Topic;
  price: number;
  slaHours: number;
  isActive: boolean;
  platformFeePercent: number;
  expert?: Orang;
};

const TOPIC_LABEL: Record<Topic, string> = {
  KONSULTASI_HUKUM: "Konsultasi Hukum",
  BANTUAN_HUKUM: "Bantuan Hukum",
  PENDAMPINGAN_SKRIPSI: "Pendampingan Skripsi",
};

const STATUS_LABEL: Record<Status, string> = {
  PENDING_PAYMENT: "Belum dibayar",
  AWAITING_EXPERT: "Menunggu jawaban",
  ANSWERED: "Dijawab",
  EXPIRED: "Lewat SLA — perlu refund",
  REFUNDED: "Sudah direfund",
  CANCELLED: "Dibatalkan",
};

function statusVariant(s: Status): "success" | "warning" | "danger" | "info" | "default" {
  if (s === "ANSWERED") return "success";
  if (s === "AWAITING_EXPERT") return "info";
  if (s === "EXPIRED") return "danger";
  if (s === "REFUNDED") return "warning";
  return "default";
}

function rupiah(n: number | string) {
  return "Rp " + Number(n || 0).toLocaleString("id-ID");
}
function tanggal(s?: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

const inputCls =
  "w-full bg-surface-2 border border-neutral-200 rounded-lg px-3 py-2 text-sm text-text-high focus:outline-none focus:border-maroon focus:ring-1 focus:ring-gold/50 transition-colors placeholder:text-text-low/50";

type Tab = "transaksi" | "refund" | "bagi-hasil";

async function ambil(filter: Status | "") {
  const q = filter ? `?status=${filter}` : "";
  const [list, refunds, rates] = await Promise.all([
    apiFetch<Consultation[]>(`/api/consultations/admin/list${q}`),
    apiFetch<Consultation[]>("/api/consultations/admin/refunds"),
    apiFetch<Rate[]>("/api/consultations/admin/rates"),
  ]);
  const arr = <T,>(x: T[]) => (Array.isArray(x) ? x : []);
  return { list: arr(list), refunds: arr(refunds), rates: arr(rates) };
}

function Orang({ o }: { o?: Orang }) {
  return (
    <div>
      <p className="text-text-high font-medium text-sm">{o?.name ?? "—"}</p>
      {o?.email && <p className="text-text-low text-xs">{o.email}</p>}
    </div>
  );
}

export default function ConsultationsPage() {
  const [tab, setTab] = useState<Tab>("transaksi");
  const [filter, setFilter] = useState<Status | "">("");
  const [list, setList] = useState<Consultation[]>([]);
  const [refunds, setRefunds] = useState<Consultation[]>([]);
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [refundRow, setRefundRow] = useState<Consultation | null>(null);
  const [catatan, setCatatan] = useState("");
  const [feeRow, setFeeRow] = useState<Rate | null>(null);
  const [fee, setFee] = useState("");
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  // Dinaikkan setelah aksi admin supaya effect di bawah memuat ulang.
  const [versi, setVersi] = useState(0);
  const muatUlang = () => setVersi((v) => v + 1);

  useEffect(() => {
    let aktif = true;
    ambil(filter)
      .then((d) => {
        if (!aktif) return;
        setList(d.list);
        setRefunds(d.refunds);
        setRates(d.rates);
        setError("");
      })
      .catch((err: unknown) => {
        if (aktif) setError(err instanceof Error ? err.message : "Gagal memuat data konsultasi.");
      })
      .finally(() => {
        if (aktif) setLoading(false);
      });
    return () => {
      aktif = false;
    };
  }, [filter, versi]);

  function bukaRefund(row: Consultation) {
    setRefundRow(row);
    setCatatan("");
    setModalError("");
  }

  function bukaFee(row: Rate) {
    setFeeRow(row);
    setFee(String(row.platformFeePercent));
    setModalError("");
  }

  async function simpanRefund() {
    if (!refundRow) return;
    setSaving(true);
    try {
      await apiFetch(`/api/consultations/admin/${refundRow.id}/refunded`, {
        method: "PATCH",
        body: JSON.stringify(catatan.trim() ? { adminNote: catatan.trim() } : {}),
      });
      setRefundRow(null);
      muatUlang();
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : "Gagal menandai refund.");
    } finally {
      setSaving(false);
    }
  }

  const feeAngka = Number(fee);
  const feeValid = fee.trim() !== "" && Number.isInteger(feeAngka) && feeAngka >= 0 && feeAngka <= 100;

  async function simpanFee() {
    if (!feeRow || !feeValid) return;
    setSaving(true);
    try {
      await apiFetch(`/api/consultations/admin/experts/${feeRow.expertId}/fee`, {
        method: "PATCH",
        body: JSON.stringify({ topic: feeRow.topic, platformFeePercent: feeAngka }),
      });
      setFeeRow(null);
      muatUlang();
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : "Gagal menyimpan bagi hasil.");
    } finally {
      setSaving(false);
    }
  }

  // Pendapatan hanya dari konsultasi yang dijawab: di status lain uangnya
  // belum/tidak pernah dibagi (expert baru dikredit saat menjawab).
  const dijawab = list.filter((c) => c.status === "ANSWERED");
  const pendapatanLexsee = dijawab.reduce((s, c) => s + Number(c.platformFee), 0);
  const bagianExpert = dijawab.reduce((s, c) => s + Number(c.expertEarning), 0);
  const nilaiRefund = refunds.reduce((s, c) => s + Number(c.paidAmount ?? c.price), 0);

  const kolomTransaksi: Column<Consultation>[] = [
    { header: "Klien", accessor: "client", render: (r) => <Orang o={r.client} /> },
    { header: "Expert", accessor: "expert", render: (r) => <Orang o={r.expert} /> },
    {
      header: "Layanan",
      accessor: "topic",
      render: (r) => (
        <div className="text-xs">
          <p className="text-text-high">{TOPIC_LABEL[r.topic] ?? r.topic}</p>
          <p className="text-text-low font-mono">{r.orderId}</p>
        </div>
      ),
    },
    {
      header: "Tarif · Bagi hasil",
      accessor: "price",
      render: (r) => (
        <div className="text-xs">
          <p className="text-text-high font-semibold">{rupiah(r.price)}</p>
          <p className="text-text-low">
            Expert {rupiah(r.expertEarning)} · Lexsee {rupiah(r.platformFee)} ({r.platformFeePercent}%)
          </p>
        </div>
      ),
    },
    {
      header: "Tanggal",
      accessor: "createdAt",
      render: (r) => (
        <div className="text-xs">
          <p className="text-text-med">{tanggal(r.createdAt)}</p>
          {r.status === "AWAITING_EXPERT" && (
            <p className="text-text-low">Batas: {tanggal(r.respondBefore)}</p>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (r) => <Badge variant={statusVariant(r.status)}>{STATUS_LABEL[r.status] ?? r.status}</Badge>,
    },
  ];

  const kolomRefund: Column<Consultation>[] = [
    { header: "Klien", accessor: "client", render: (r) => <Orang o={r.client} /> },
    { header: "Expert", accessor: "expert", render: (r) => <Orang o={r.expert} /> },
    {
      header: "Order",
      accessor: "orderId",
      render: (r) => <span className="text-xs font-mono text-text-high">{r.orderId}</span>,
    },
    {
      header: "Dikembalikan",
      accessor: "paidAmount",
      render: (r) => (
        <span className="text-text-high font-semibold text-sm">{rupiah(r.paidAmount ?? r.price)}</span>
      ),
    },
    {
      header: "Ditutup",
      accessor: "closedAt",
      render: (r) => <span className="text-text-med text-sm">{tanggal(r.closedAt)}</span>,
    },
    {
      header: "Aksi",
      accessor: "id",
      render: (r) => (
        <button
          onClick={() => bukaRefund(r)}
          className="px-2.5 py-1 rounded-md bg-maroon text-white text-xs font-semibold hover:bg-maroon-dark transition-colors"
        >
          Tandai sudah refund
        </button>
      ),
    },
  ];

  const kolomTarif: Column<Rate & { id: string }>[] = [
    { header: "Expert", accessor: "expert", render: (r) => <Orang o={r.expert} /> },
    {
      header: "Layanan",
      accessor: "topic",
      render: (r) => <span className="text-sm text-text-high">{TOPIC_LABEL[r.topic] ?? r.topic}</span>,
    },
    {
      header: "Tarif · SLA",
      accessor: "price",
      render: (r) => (
        <span className="text-sm text-text-high">
          {rupiah(r.price)} · {r.slaHours} jam
        </span>
      ),
    },
    {
      header: "Bagi hasil",
      accessor: "platformFeePercent",
      render: (r) => (
        <span className="text-sm text-text-high">
          Expert {100 - r.platformFeePercent}% / Lexsee {r.platformFeePercent}%
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "isActive",
      render: (r) => (
        <Badge variant={r.isActive ? "success" : "default"}>{r.isActive ? "Buka" : "Tutup"}</Badge>
      ),
    },
    {
      header: "Aksi",
      accessor: "id",
      render: (r) => (
        <button
          onClick={() => bukaFee(r)}
          className="px-2.5 py-1 rounded-md border border-neutral-300 text-text-med text-xs font-semibold hover:bg-surface-2 transition-colors"
        >
          Ubah bagi hasil
        </button>
      ),
    },
  ];

  const tabs: { key: Tab; label: string }[] = [
    { key: "transaksi", label: "Transaksi" },
    { key: "refund", label: `Antrean refund (${refunds.length})` },
    { key: "bagi-hasil", label: "Bagi hasil expert" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-high">Konsultasi Ahli</h1>
        <p className="text-text-med text-sm mt-1">
          Konsultasi berbayar klien → expert. Expert dikredit saat menjawab; yang lewat
          batas waktu masuk antrean refund.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        {[
          { label: "Perlu refund", value: String(refunds.length) },
          { label: "Nilai refund", value: rupiah(nilaiRefund) },
          { label: "Pendapatan Lexsee", value: rupiah(pendapatanLexsee) },
          { label: "Bagian expert", value: rupiah(bagianExpert) },
        ].map((k) => (
          <div key={k.label} className="bg-surface-1 border border-neutral-200 rounded-xl px-5 py-4 min-w-[180px]">
            <p className="text-text-low text-xs font-semibold uppercase tracking-wider">{k.label}</p>
            <p className="text-2xl font-semibold text-text-high mt-1">{k.value}</p>
          </div>
        ))}
      </div>
      <p className="text-text-low text-xs -mt-3">
        Pendapatan &amp; bagian expert dihitung dari konsultasi berstatus Dijawab pada daftar
        transaksi yang sedang ditampilkan (maks. 200 terbaru).
      </p>

      {error && (
        <div className="bg-surface-1 border border-neutral-200 rounded-xl p-4 flex items-center gap-3 text-danger text-sm">
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? "border-maroon text-text-high"
                : "border-transparent text-text-med hover:text-text-high"
            }`}
          >
            {t.label}
          </button>
        ))}
        {tab === "transaksi" && (
          <select
            aria-label="Filter status"
            value={filter}
            onChange={(e) => setFilter(e.target.value as Status | "")}
            className={`${inputCls} ml-auto mb-1 max-w-[14rem]`}
          >
            <option value="">Semua (kecuali belum dibayar)</option>
            {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
        )}
      </div>

      <div className="bg-surface-1 border border-neutral-200 rounded-xl p-2">
        {tab === "transaksi" && (
          <DataTable
            columns={kolomTransaksi}
            data={list}
            loading={loading}
            emptyMessage="Belum ada konsultasi"
            emptyDescription="Konsultasi yang sudah dibayar klien akan muncul di sini."
          />
        )}
        {tab === "refund" && (
          <DataTable
            columns={kolomRefund}
            data={refunds}
            loading={loading}
            emptyMessage="Tidak ada yang perlu direfund"
            emptyDescription="Konsultasi yang tidak dijawab expert sebelum batas waktunya akan muncul di sini."
          />
        )}
        {tab === "bagi-hasil" && (
          <DataTable
            columns={kolomTarif}
            data={rates.map((r) => ({ ...r, id: `${r.expertId}:${r.topic}` }))}
            loading={loading}
            emptyMessage="Belum ada expert yang membuka layanan"
            emptyDescription="Tarif muncul setelah expert mengatur layanannya di aplikasi."
          />
        )}
      </div>

      <Modal isOpen={refundRow !== null} onClose={() => setRefundRow(null)} title="Tandai sudah refund">
        {refundRow && (
          <div className="p-6 space-y-4">
            <p className="text-sm text-text-med">
              Kembalikan <b className="text-text-high">{rupiah(refundRow.paidAmount ?? refundRow.price)}</b> ke{" "}
              <b className="text-text-high">{refundRow.client?.name ?? "klien"}</b>
              {refundRow.client?.email ? ` (${refundRow.client.email})` : ""} untuk order{" "}
              <span className="font-mono">{refundRow.orderId}</span> lebih dulu — tombol ini hanya
              mencatat bahwa dana sudah dikembalikan. Saldo expert tidak berubah karena memang
              tidak pernah dikredit.
            </p>
            <div>
              <label className="text-sm font-medium text-text-high">Catatan (opsional)</label>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Mis. refund via Midtrans, ref. 123456"
                className={`${inputCls} mt-1`}
              />
            </div>
            {modalError && <p className="text-xs text-danger">{modalError}</p>}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRefundRow(null)}
                className="px-4 py-2 text-sm rounded-lg border border-neutral-200 text-text-med hover:bg-surface-2"
              >
                Batal
              </button>
              <button
                onClick={simpanRefund}
                disabled={saving}
                className="px-4 py-2 text-sm rounded-lg bg-maroon text-white font-semibold hover:bg-maroon-dark disabled:opacity-50"
              >
                {saving ? "Menyimpan…" : "Sudah direfund"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={feeRow !== null} onClose={() => setFeeRow(null)} title="Ubah bagi hasil">
        {feeRow && (
          <div className="p-6 space-y-4">
            <p className="text-sm text-text-med">
              {feeRow.expert?.name ?? "Expert"} · {TOPIC_LABEL[feeRow.topic]}. Berlaku untuk
              transaksi berikutnya — transaksi yang sudah terjadi tetap memakai persentase lamanya.
            </p>
            <div>
              <label className="text-sm font-medium text-text-high">Bagian Lexsee (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                className={`${inputCls} mt-1`}
              />
              <p className="text-xs text-text-low mt-1">
                {feeValid
                  ? `Dari tarif ${rupiah(feeRow.price)}: expert ${rupiah(Math.round(feeRow.price * (100 - feeAngka) / 100))}, Lexsee ${rupiah(Math.round(feeRow.price * feeAngka / 100))}.`
                  : "Isi bilangan bulat 0–100."}
              </p>
            </div>
            {modalError && <p className="text-xs text-danger">{modalError}</p>}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setFeeRow(null)}
                className="px-4 py-2 text-sm rounded-lg border border-neutral-200 text-text-med hover:bg-surface-2"
              >
                Batal
              </button>
              <button
                onClick={simpanFee}
                disabled={saving || !feeValid}
                className="px-4 py-2 text-sm rounded-lg bg-maroon text-white font-semibold hover:bg-maroon-dark disabled:opacity-50"
              >
                {saving ? "Menyimpan…" : "Simpan"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

"use client";

// Withdrawals page — admin meninjau & memproses penarikan saldo expert.

import { useEffect, useState, useCallback } from "react";
import { AlertTriangle } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { AksiPenarikan, type Withdrawal } from "@/components/features/withdrawals/AksiPenarikan";
import { Toast, useToast } from "@/components/ui/Toast";
import { label, pesanGalat } from "@/lib/labels";


function rupiah(n: number) {
  return "Rp " + Number(n || 0).toLocaleString("id-ID");
}
function tanggal(s: string) {
  if (!s) return "—";
  return new Date(s).toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}
function statusVariant(s: string): "success" | "warning" | "danger" | "info" | "default" {
  if (s === "TRANSFERRED") return "success";
  if (s === "APPROVED") return "info";
  if (s === "PENDING") return "warning";
  if (s === "REJECTED") return "danger";
  return "default";
}

export default function WithdrawalsPage() {
  const [items, setItems] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { toast, showToast } = useToast();

  const load = useCallback(async () => {
    try {
      const res = await apiFetch<Withdrawal[]>("/api/webinar/admin/withdrawals");
      setItems(Array.isArray(res) ? res : []);
      setError("");
    } catch (err: unknown) {
      setError(pesanGalat(err, "memuat data penarikan"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pendingTotal = items
    .filter((w) => w.status === "PENDING")
    .reduce((s, w) => s + Number(w.amount), 0);

  const columns: Column<Withdrawal>[] = [
    {
      header: "Ahli",
      accessor: "expert",
      render: (row) => (
        <div>
          <p className="text-text-high font-medium text-sm">{row.expert?.name ?? "—"}</p>
          <p className="text-text-low text-xs">{row.expert?.email ?? ""}</p>
        </div>
      ),
    },
    {
      header: "Jumlah",
      accessor: "amount",
      render: (row) => (
        <span className="text-text-high font-semibold text-sm">{rupiah(Number(row.amount))}</span>
      ),
    },
    {
      header: "Rekening",
      accessor: "bankName",
      render: (row) => (
        <div className="text-xs">
          <p className="text-text-high">{row.bankName} · {row.accountNumber}</p>
          <p className="text-text-low">{row.accountName}</p>
        </div>
      ),
    },
    {
      header: "Tanggal",
      accessor: "createdAt",
      render: (row) => <span className="text-text-med text-sm">{tanggal(row.createdAt)}</span>,
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => <Badge variant={statusVariant(row.status)}>{label("withdrawal", row.status)}</Badge>,
    },
    {
      header: "Aksi",
      accessor: "id",
      render: (row) => (
        <AksiPenarikan
          w={row}
          onDone={(_w, pesan) => {
            showToast(pesan);
            void load();
          }}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-high">Penarikan Saldo</h1>
        <p className="text-text-med text-sm mt-1">
          Tinjau dan proses permintaan penarikan saldo dari ahli hukum.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="bg-surface-1 border border-neutral-200 rounded-xl px-5 py-4 min-w-[180px]">
          <p className="text-text-low text-xs font-semibold uppercase tracking-wider">Menunggu Persetujuan</p>
          <p className="text-2xl font-semibold text-text-high mt-1">
            {items.filter((w) => w.status === "PENDING").length}
          </p>
        </div>
        <div className="bg-surface-1 border border-neutral-200 rounded-xl px-5 py-4 min-w-[180px]">
          <p className="text-text-low text-xs font-semibold uppercase tracking-wider">Total menunggu</p>
          <p className="text-2xl font-semibold text-text-high mt-1">{rupiah(pendingTotal)}</p>
        </div>
      </div>

      {error && (
        <div className="bg-surface-1 border border-neutral-200 rounded-xl p-4 flex items-center gap-3 text-danger text-sm">
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      <div className="bg-surface-1 border border-neutral-200 rounded-xl p-2">
        <DataTable
          columns={columns}
          data={items}
          loading={loading}
          emptyMessage="Belum ada permintaan penarikan"
          emptyDescription="Permintaan penarikan dari ahli hukum akan muncul di sini."
        />
      </div>
      <Toast state={toast} />
    </div>
  );
}

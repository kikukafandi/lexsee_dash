"use client";

// Webinars page — daftar webinar (PUBLISHED & LIVE) dari backend.

import { useEffect, useState } from "react";
import { AlertTriangle, Radio } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";

type WebinarExpert = { id: string; name: string; photoUrl?: string | null };
type Webinar = {
  id: string;
  title: string;
  description?: string;
  price: number;
  scheduledAt: string;
  durationMinutes?: number;
  status: string;
  maxParticipants?: number | null;
  expert?: WebinarExpert | null;
  _count?: { tickets: number };
};
type WebinarList = { data: Webinar[]; total: number; page: number; limit: number };

function rupiah(n: number) {
  return "Rp " + Number(n || 0).toLocaleString("id-ID");
}
function tanggal(s: string) {
  if (!s) return "—";
  return new Date(s).toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}
function statusVariant(s: string): "success" | "warning" | "info" | "default" {
  if (s === "LIVE") return "success";
  if (s === "PUBLISHED") return "info";
  if (s === "DRAFT") return "warning";
  return "default";
}

export default function WebinarsPage() {
  const [items, setItems] = useState<Webinar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch<WebinarList>("/api/webinar/events?limit=50");
        setItems(Array.isArray(res?.data) ? res.data : []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Gagal memuat webinar.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const liveCount = items.filter((w) => w.status === "LIVE").length;

  const columns: Column<Webinar>[] = [
    {
      header: "Judul",
      accessor: "title",
      render: (row) => (
        <div className="max-w-xs">
          <p className="text-text-high font-medium truncate">{row.title}</p>
          <p className="text-text-low text-xs truncate">{row.description ?? ""}</p>
        </div>
      ),
    },
    {
      header: "Narasumber",
      accessor: "expert",
      render: (row) => (
        <span className="text-text-med text-sm">{row.expert?.name ?? "—"}</span>
      ),
    },
    {
      header: "Jadwal",
      accessor: "scheduledAt",
      render: (row) => <span className="text-text-med text-sm">{tanggal(row.scheduledAt)}</span>,
    },
    {
      header: "Harga",
      accessor: "price",
      render: (row) => (
        <span className="text-text-high font-medium text-sm">
          {Number(row.price) > 0 ? rupiah(Number(row.price)) : "Gratis"}
        </span>
      ),
    },
    {
      header: "Peserta",
      accessor: "_count",
      render: (row) => (
        <span className="text-text-med text-sm">
          {row._count?.tickets ?? 0}
          {row.maxParticipants ? ` / ${row.maxParticipants}` : ""}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => <Badge variant={statusVariant(row.status)}>{row.status}</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-high">Webinar</h1>
        <p className="text-text-med text-sm mt-1">
          Daftar webinar yang dipublikasikan & sedang berlangsung.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="bg-surface-1 border border-neutral-200 rounded-xl px-5 py-4 min-w-[160px]">
          <p className="text-text-low text-xs font-semibold uppercase tracking-wider">Total Webinar</p>
          <p className="text-2xl font-semibold text-text-high mt-1">{items.length}</p>
        </div>
        <div className="bg-surface-1 border border-neutral-200 rounded-xl px-5 py-4 min-w-[160px]">
          <p className="text-text-low text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Radio size={12} className="text-success" /> Sedang Live
          </p>
          <p className="text-2xl font-semibold text-text-high mt-1">{liveCount}</p>
        </div>
      </div>

      {error ? (
        <div className="bg-surface-1 border border-neutral-200 rounded-xl p-6 flex items-center gap-3 text-danger text-sm">
          <AlertTriangle size={18} /> {error}
        </div>
      ) : (
        <div className="bg-surface-1 border border-neutral-200 rounded-xl p-2">
          <DataTable
            columns={columns}
            data={items}
            loading={loading}
            emptyMessage="Belum ada webinar"
            emptyDescription="Webinar yang dipublikasikan akan muncul di sini."
          />
        </div>
      )}
    </div>
  );
}

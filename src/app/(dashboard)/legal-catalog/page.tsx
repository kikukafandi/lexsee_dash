"use client";

// Legal Catalog page — browse and manage the Peraturan (regulation) catalog.
// Admins can search/filter regulations, preview PDFs, and trigger JDIH sync.

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Modal } from "@/components/ui/Modal";
import { RefreshCw, CheckCircle2, XCircle, Hourglass } from "lucide-react";
import type { Peraturan, PeraturanListResponse } from "@/types";

// Maps a jenis (regulation type) code to a Badge variant
function jenisVariant(code: string) {
  if (["UU", "PERPU"].includes(code)) return "info" as const;
  if (["PERPRES", "KEPRES"].includes(code)) return "gold" as const;
  if (["PP", "PERMEN"].includes(code)) return "default" as const;
  return "default" as const;
}

// Table column definitions for the Peraturan table
const COLUMNS: Column<Peraturan>[] = [
  {
    header: "Judul",
    accessor: "judul",
    render: (row) => (
      <div>
        <p className="text-text-high font-medium text-sm leading-snug line-clamp-2">
          {row.judul}
        </p>
        <p className="text-text-low text-xs mt-0.5">{row.idperaturan}</p>
      </div>
    ),
    width: "w-2/5",
  },
  {
    header: "Jenis",
    accessor: "jenisCode",
    render: (row) => (
      <Badge variant={jenisVariant(row.jenisCode)}>{row.jenisCode}</Badge>
    ),
  },
  {
    header: "Nomor",
    accessor: "nomor",
    render: (row) => (
      <span className="text-text-med text-xs">{row.nomor ?? "—"}</span>
    ),
  },
  {
    header: "Tahun",
    accessor: "tahun",
    render: (row) => (
      <span className="text-gold font-semibold text-sm">{row.tahun ?? "—"}</span>
    ),
  },
];

export default function LegalCatalogPage() {
  // ── Data state ───────────────────────────────────────────────────────
  const [data, setData] = useState<Peraturan[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // ── Filter state ──────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [jenis, setJenis] = useState("");
  const [tahun, setTahun] = useState("");

  // ── Sync state ────────────────────────────────────────────────────────
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [syncError, setSyncError] = useState("");

  // ── PDF preview modal state ───────────────────────────────────────────
  const [previewItem, setPreviewItem] = useState<Peraturan | null>(null);

  // ── Fetch peraturan list ──────────────────────────────────────────────
  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "20" });
      if (query) params.set("q", query);
      if (jenis) params.set("jenis", jenis);
      if (tahun) params.set("tahun", tahun);

      const res = await apiFetch<PeraturanListResponse>(
        `/api/legal/peraturan?${params}`
      );
      setData(res.data);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [query, jenis, tahun]);

  useEffect(() => {
    load(1);
    setPage(1);
  }, [load]);

  // ── Trigger JDIH Setneg sync ──────────────────────────────────────────
  async function handleSync() {
    if (!confirm("Jalankan sync JDIH Setneg? Proses bisa memakan 3–10 menit.")) return;
    setSyncing(true);
    setSyncMsg("");
    setSyncError("");
    try {
      const res = await apiFetch<{ message: string }>(
        "/api/legal/admin/sync-setneg",
        { method: "POST" }
      );
      setSyncMsg(res.message ?? "Sync selesai!");
      load(1);
    } catch (err: unknown) {
      setSyncError(err instanceof Error ? err.message : "Sync gagal.");
    } finally {
      setSyncing(false);
    }
  }

  // ── Columns with PDF action added ─────────────────────────────────────
  const columnsWithAction: Column<Peraturan>[] = [
    ...COLUMNS,
    {
      header: "PDF",
      accessor: "pdfPath",
      render: (row) =>
        row.pdfPath ? (
          <button
            onClick={() => setPreviewItem(row)}
            className="text-gold hover:text-gold-light text-xs underline underline-offset-2 transition-colors"
          >
            Preview
          </button>
        ) : (
          <span className="text-text-low text-xs">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-serif text-text-high">Legal Catalog</h1>
          <p className="text-text-med text-sm mt-0.5">
            Katalog peraturan dari JDIH Setneg.{" "}
            <span className="text-gold">{total}</span> peraturan tersedia.
          </p>
        </div>

        {/* Sync button */}
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-white font-semibold text-sm hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {syncing ? (
            <>
              <LoadingSpinner size="sm" />
              Syncing...
            </>
          ) : (
            <><RefreshCw size={16} /> Sync JDIH Setneg</>
          )}
        </button>
      </div>

      {/* Sync status messages */}
      {syncMsg && (
        <div className="p-3 rounded-lg bg-success/10 border border-success/25 text-success text-sm flex items-center gap-2">
          <CheckCircle2 size={16} className="shrink-0" /> {syncMsg}
        </div>
      )}
      {syncError && (
        <div className="p-3 rounded-lg bg-danger/10 border border-danger/25 text-danger text-sm flex items-center gap-2">
          <XCircle size={16} className="shrink-0" /> {syncError}
        </div>
      )}
      {syncing && (
        <div className="p-3 rounded-lg bg-surface-2 border border-neutral-200 text-text-med text-sm flex items-center gap-2">
          <Hourglass size={16} className="shrink-0" /> Proses sync sedang berjalan (3–10 menit). Jangan tutup tab ini.
        </div>
      )}

      {/* ── Filters ──────────────────────────────────────────────────── */}
      <div className="bg-surface-1 border border-neutral-200 rounded-xl p-4">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Text search */}
          <div className="flex-1 min-w-48">
            <label className="block text-text-low text-xs uppercase tracking-wider mb-1">
              Cari Judul
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load(1)}
              placeholder="Ketik judul..."
              className="w-full bg-surface-2 border border-neutral-200 rounded-lg px-3 py-2 text-text-high text-sm focus:outline-none focus:border-maroon transition-colors"
            />
          </div>

          {/* Jenis filter */}
          <div className="min-w-36">
            <label className="block text-text-low text-xs uppercase tracking-wider mb-1">
              Jenis
            </label>
            <select
              value={jenis}
              onChange={(e) => setJenis(e.target.value)}
              className="w-full bg-surface-2 border border-neutral-200 rounded-lg px-3 py-2 text-text-high text-sm focus:outline-none focus:border-maroon transition-colors"
            >
              <option value="">Semua</option>
              <option value="UU">UU</option>
              <option value="PERPU">PERPU</option>
              <option value="PP">PP</option>
              <option value="PERPRES">PERPRES</option>
              <option value="PERMEN">PERMEN</option>
              <option value="KEPRES">KEPRES</option>
              <option value="LAINNYA">Lainnya</option>
            </select>
          </div>

          {/* Year filter */}
          <div className="w-24">
            <label className="block text-text-low text-xs uppercase tracking-wider mb-1">
              Tahun
            </label>
            <input
              type="text"
              value={tahun}
              onChange={(e) => setTahun(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load(1)}
              placeholder="2024"
              className="w-full bg-surface-2 border border-neutral-200 rounded-lg px-3 py-2 text-text-high text-sm focus:outline-none focus:border-maroon transition-colors"
            />
          </div>

          {/* Search + Reset buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => load(1)}
              className="px-4 py-2 rounded-lg bg-gold text-white font-semibold text-sm hover:bg-gold-light transition-colors"
            >
              Cari
            </button>
            <button
              onClick={() => {
                setQuery("");
                setJenis("");
                setTahun("");
              }}
              className="px-4 py-2 rounded-lg bg-surface-2 text-text-med text-sm border border-neutral-200 hover:text-text-high transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* ── Data table ───────────────────────────────────────────────── */}
      <div className="bg-surface-1 border border-neutral-200 rounded-xl overflow-hidden">
        <DataTable
          columns={columnsWithAction}
          data={data}
          loading={loading}
          page={page}
          totalPages={totalPages}
          onPageChange={(p) => {
            setPage(p);
            load(p);
          }}
          emptyMessage="Belum ada peraturan"
          emptyDescription="Jalankan Sync JDIH Setneg untuk mengambil data peraturan terbaru."
        />
      </div>

      {/* ── PDF Preview Modal ──────────────────────────────────────────── */}
      <Modal
        isOpen={!!previewItem}
        onClose={() => setPreviewItem(null)}
        title={previewItem?.judul}
      >
        {previewItem?.pdfPath && (
          <iframe
            src={previewItem.pdfPath}
            className="w-full h-full border-none bg-white"
            title={previewItem.judul}
          />
        )}
      </Modal>
    </div>
  );
}

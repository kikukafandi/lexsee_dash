"use client";

// Knowledge Base page — manage AI documents and ingest new content.
// Shows stats, document list with delete, and ingest forms (3 modes).

import { useEffect, useState, useCallback, ReactNode } from "react";
import { apiFetch } from "@/lib/api";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ThumbsUp, ThumbsDown, CheckCircle2, XCircle, Hourglass } from "lucide-react";
import type { KbStats, LegalDocument, DocumentListResponse, DocType } from "@/types";

// The document type options available for ingestion
const DOC_TYPE_OPTIONS: { value: DocType; label: string }[] = [
  { value: "UU", label: "Undang-Undang (UU)" },
  { value: "PERPU", label: "PERPU" },
  { value: "PP", label: "Peraturan Pemerintah (PP)" },
  { value: "PUTUSAN", label: "Putusan Pengadilan" },
  { value: "JURNAL", label: "Jurnal Hukum" },
  { value: "LAINNYA", label: "Lainnya" },
];

// ─── Stats row component ────────────────────────────────────────────────────

function StatsRow({ stats }: { stats: KbStats | null }) {
  if (!stats) return null;

  const helpfulRate =
    stats.feedback.helpful + stats.feedback.notHelpful > 0
      ? Math.round(
          (stats.feedback.helpful /
            (stats.feedback.helpful + stats.feedback.notHelpful)) *
            100
        )
      : 0;

  const items: { label: ReactNode; value: number | string; color: string }[] = [
    { label: "Dokumen Aktif", value: stats.documents.active, color: "text-gold" },
    { label: "Total Dokumen", value: stats.documents.total, color: "text-text-high" },
    { label: "Vector Chunks", value: stats.chunks, color: "text-gold" },
    { label: "Sesi Chat", value: stats.sessions, color: "text-text-high" },
    { label: <span className="flex justify-center items-center gap-1">Feedback Positif <ThumbsUp size={12}/></span>, value: stats.feedback.helpful, color: "text-success" },
    { label: <span className="flex justify-center items-center gap-1">Feedback Negatif <ThumbsDown size={12}/></span>, value: stats.feedback.notHelpful, color: "text-danger" },
    { label: "Tingkat Kepuasan", value: `${helpfulRate}%`, color: helpfulRate >= 70 ? "text-success" : "text-warning" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      {items.map((item, i) => (
        <div key={i} className="bg-surface-1 border border-gold/25 rounded-xl p-3 text-center">
          <p className={`text-2xl font-serif font-bold ${item.color}`}>{item.value}</p>
          <p className="text-text-low text-xs mt-1 leading-tight">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Ingest panel component ─────────────────────────────────────────────────

type IngestTab = "jdih" | "manual" | "setneg" | "reingest";

function IngestPanel({ onSuccess }: { onSuccess: () => void }) {
  const [tab, setTab] = useState<IngestTab>("jdih");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  // JDIH auto-scrape form state
  const [jdihQuery, setJdihQuery] = useState("");
  const [jdihType, setJdihType] = useState<DocType>("UU");
  const [jdihLimit, setJdihLimit] = useState(5);

  // Manual upload form state
  const [manualTitle, setManualTitle] = useState("");
  const [manualType, setManualType] = useState<DocType>("UU");
  const [manualText, setManualText] = useState("");

  const tabs: { id: IngestTab; label: string }[] = [
    { id: "jdih", label: "Auto Scrape (JDIH)" },
    { id: "manual", label: "Upload Manual" },
    { id: "setneg", label: "Sync Setneg" },
    { id: "reingest", label: "Re-ingest Lokal" },
  ];

  async function runIngest() {
    setLoading(true);
    setResult("");
    setError("");
    try {
      let body = {};
      let endpoint = "/api/legal/ingest";

      if (tab === "jdih") {
        body = { query: jdihQuery, docType: jdihType, limit: jdihLimit };
      } else if (tab === "manual") {
        body = { title: manualTitle, text: manualText, docType: manualType };
      } else if (tab === "setneg") {
        endpoint = "/api/legal/admin/sync-setneg";
      } else if (tab === "reingest") {
        endpoint = "/api/legal/admin/reingest-local";
      }

      const res = await apiFetch<{ message?: string; ingested?: number; skipped?: number; failed?: number }>(
        endpoint,
        { method: "POST", body: JSON.stringify(body) }
      );

      if (tab === "reingest") {
        setResult(`Selesai: ${res.ingested} berhasil · ${res.skipped} dilewati · ${res.failed} gagal`);
      } else {
        setResult(res.message ?? "Berhasil!");
      }
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-surface-1 border border-gold/25 rounded-xl p-5">
      <h2 className="text-text-high font-serif text-lg mb-4">Tambah Dokumen ke Knowledge Base</h2>

      {/* Tab buttons */}
      <div className="flex gap-1 mb-5 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setResult(""); setError(""); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === t.id
                ? "bg-gold text-maroon-deep"
                : "bg-surface-2 text-text-med hover:text-text-high border border-gold/15"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: JDIH Auto Scrape */}
      {tab === "jdih" && (
        <div className="space-y-3">
          <p className="text-text-med text-xs">Scrape otomatis dari JDIH Mahkamah Agung. Duplikat dilewati.</p>
          <input
            value={jdihQuery}
            onChange={(e) => setJdihQuery(e.target.value)}
            placeholder="Kata kunci (contoh: hak asasi manusia)"
            className="w-full bg-surface-2 border border-gold/25 rounded-lg px-3 py-2 text-text-high text-sm focus:outline-none focus:border-gold/60"
          />
          <div className="flex gap-3">
            <select
              value={jdihType}
              onChange={(e) => setJdihType(e.target.value as DocType)}
              className="flex-1 bg-surface-2 border border-gold/25 rounded-lg px-3 py-2 text-text-high text-sm focus:outline-none focus:border-gold/60"
            >
              {DOC_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <input
              type="number"
              min={1} max={10}
              value={jdihLimit}
              onChange={(e) => setJdihLimit(Number(e.target.value))}
              className="w-20 bg-surface-2 border border-gold/25 rounded-lg px-3 py-2 text-text-high text-sm focus:outline-none focus:border-gold/60"
            />
          </div>
        </div>
      )}

      {/* Tab: Manual Upload */}
      {tab === "manual" && (
        <div className="space-y-3">
          <p className="text-text-med text-xs">Upload teks dokumen secara manual. Cocok untuk dokumen internal.</p>
          <input
            value={manualTitle}
            onChange={(e) => setManualTitle(e.target.value)}
            placeholder="Judul dokumen"
            className="w-full bg-surface-2 border border-gold/25 rounded-lg px-3 py-2 text-text-high text-sm focus:outline-none focus:border-gold/60"
          />
          <select
            value={manualType}
            onChange={(e) => setManualType(e.target.value as DocType)}
            className="w-full bg-surface-2 border border-gold/25 rounded-lg px-3 py-2 text-text-high text-sm focus:outline-none focus:border-gold/60"
          >
            {DOC_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <textarea
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            rows={5}
            placeholder="Paste teks dokumen hukum di sini..."
            className="w-full bg-surface-2 border border-gold/25 rounded-lg px-3 py-2 text-text-high text-sm focus:outline-none focus:border-gold/60 resize-y"
          />
        </div>
      )}

      {/* Tab: Sync Setneg */}
      {tab === "setneg" && (
        <div className="space-y-3">
          <p className="text-text-med text-xs">
            Scrape 50 dokumen terbaru dari JDIH Setneg, download PDF, dan embed ke knowledge base AI.
          </p>
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/25 text-warning text-xs flex items-center gap-1.5">
            <Hourglass size={14} className="shrink-0" /> Proses ini bisa memakan waktu <strong>3–10 menit</strong>. Jangan tutup halaman selama proses berlangsung.
          </div>
        </div>
      )}

      {/* Tab: Re-ingest Local */}
      {tab === "reingest" && (
        <div className="space-y-3">
          <p className="text-text-med text-xs">
            Re-embed PDF yang sudah ada di folder <code className="text-gold">static/pdf/</code> tanpa download ulang.
            Berguna jika embedding sebelumnya gagal.
          </p>
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={runIngest}
        disabled={loading || (tab === "manual" && (!manualTitle || !manualText))}
        className="mt-4 w-full py-2.5 rounded-lg bg-gold text-maroon-deep font-semibold text-sm hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? <><LoadingSpinner size="sm" /> Memproses...</> : "Jalankan"}
      </button>

      {/* Result/error messages */}
      {result && (
        <div className="mt-3 p-3 rounded-lg bg-success/10 border border-success/25 text-success text-sm flex items-center gap-2">
          <CheckCircle2 size={16} className="shrink-0" /> {result}
        </div>
      )}
      {error && (
        <div className="mt-3 p-3 rounded-lg bg-danger/10 border border-danger/25 text-danger text-sm flex items-center gap-2">
          <XCircle size={16} className="shrink-0" /> {error}
        </div>
      )}
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────

export default function KnowledgeBasePage() {
  const [stats, setStats] = useState<KbStats | null>(null);
  const [docs, setDocs] = useState<LegalDocument[]>([]);
  const [docsPage, setDocsPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [docsLoading, setDocsLoading] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const s = await apiFetch<KbStats>("/api/legal/admin/stats");
      setStats(s);
    } catch { /* silent */ }
  }, []);

  const loadDocs = useCallback(async (p = 1) => {
    setDocsLoading(true);
    try {
      const res = await apiFetch<DocumentListResponse>(
        `/api/legal/admin/documents?page=${p}&pageSize=20`
      );
      setDocs(res.data);
      setTotalPages(res.pagination.totalPages);
    } catch {
      setDocs([]);
    } finally {
      setDocsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadDocs(1);
  }, [loadStats, loadDocs]);

  async function handleDelete(id: string) {
    if (!confirm("Hapus dokumen dari knowledge base AI? (Soft delete — tidak permanen)")) return;
    try {
      await apiFetch(`/api/legal/admin/documents/${id}`, { method: "DELETE" });
      loadDocs(docsPage);
      loadStats();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal menghapus.");
    }
  }

  // Table columns for the document list
  const columns: Column<LegalDocument>[] = [
    {
      header: "Judul",
      accessor: "title",
      render: (row) => (
        <div>
          <p className="text-text-high font-medium text-sm">{row.title}</p>
          <p className="text-text-low text-xs">{row.id.slice(0, 8)}...</p>
        </div>
      ),
      width: "w-2/5",
    },
    {
      header: "Tipe",
      accessor: "type",
      render: (row) => <Badge variant="info">{row.type}</Badge>,
    },
    {
      header: "Chunks",
      accessor: "_count",
      render: (row) => (
        <Badge variant="default">{row._count?.chunks ?? 0} chunks</Badge>
      ),
    },
    {
      header: "Status",
      accessor: "isActive",
      render: (row) => (
        <Badge variant={row.isActive ? "success" : "danger"}>
          {row.isActive ? "Aktif" : "Nonaktif"}
        </Badge>
      ),
    },
    {
      header: "Tanggal",
      accessor: "createdAt",
      render: (row) => (
        <span className="text-text-med text-xs">
          {new Date(row.createdAt).toLocaleDateString("id-ID")}
        </span>
      ),
    },
    {
      header: "Aksi",
      accessor: "id",
      render: (row) =>
        row.isActive ? (
          <button
            onClick={() => handleDelete(row.id!)}
            className="text-danger hover:text-danger/70 text-xs font-medium transition-colors"
          >
            Hapus
          </button>
        ) : (
          <span className="text-text-low text-xs">Nonaktif</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Page header ──────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-serif text-text-high">Knowledge Base</h1>
        <p className="text-text-med text-sm mt-0.5">
          Kelola dokumen hukum untuk AI Lexsy. Dokumen di-embed ke pgvector untuk RAG.
        </p>
      </div>

      {/* ── Stats row ─────────────────────────────────────────────────── */}
      <StatsRow stats={stats} />

      {/* ── 2-column layout: doc list + ingest form ────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Document list */}
        <div className="bg-surface-1 border border-gold/25 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gold/15">
            <h2 className="text-text-high font-serif text-lg">Daftar Dokumen</h2>
            <button
              onClick={() => { loadDocs(1); loadStats(); }}
              className="text-text-low hover:text-gold text-xs transition-colors"
            >
              ↻ Refresh
            </button>
          </div>
          <DataTable
            columns={columns}
            data={docs}
            loading={docsLoading}
            page={docsPage}
            totalPages={totalPages}
            onPageChange={(p) => { setDocsPage(p); loadDocs(p); }}
            emptyMessage="Belum ada dokumen"
            emptyDescription="Gunakan form di samping untuk menambah dokumen ke knowledge base."
          />
        </div>

        {/* Ingest panel */}
        <IngestPanel onSuccess={() => { loadDocs(1); loadStats(); }} />
      </div>
    </div>
  );
}

"use client";

// Knowledge Base page — manage AI documents and ingest new content.
// Shows stats, document list with delete, and ingest forms (3 modes).

import { useEffect, useState, useCallback, ReactNode } from "react";
import { apiFetch } from "@/lib/api";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ThumbsUp, ThumbsDown, CheckCircle2, XCircle, Hourglass, ChevronRight } from "lucide-react";
import ScrapePanel from "@/components/features/knowledge-base/ScrapePanel";
import type { KbStats, LegalDocument, DocumentListResponse, DocType } from "@/types";
import { Select } from "@/components/ui/Select";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { Toast, useToast } from "@/components/ui/Toast";
import { label, pesanGalat } from "@/lib/labels";

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

function StatsRow({ stats, lengkap = false }: { stats: KbStats | null; lengkap?: boolean }) {
  if (!stats) return null;

  const helpfulRate =
    stats.feedback.helpful + stats.feedback.notHelpful > 0
      ? Math.round(
          (stats.feedback.helpful /
            (stats.feedback.helpful + stats.feedback.notHelpful)) *
            100
        )
      : 0;

  const ringkas: { label: ReactNode; value: number | string; color: string }[] = [
    { label: "Dokumen aktif", value: stats.documents.active, color: "text-gold" },
    { label: "Total dokumen", value: stats.documents.total, color: "text-text-high" },
    { label: "Tingkat kepuasan jawaban AI", value: `${helpfulRate}%`, color: helpfulRate >= 70 ? "text-success" : "text-warning" },
  ];
  const teknis: { label: ReactNode; value: number | string; color: string }[] = [
    { label: "Potongan teks (vector chunks)", value: stats.chunks, color: "text-gold" },
    { label: "Sesi chat", value: stats.sessions, color: "text-text-high" },
    { label: <span className="flex justify-center items-center gap-1">Jawaban membantu <ThumbsUp size={12}/></span>, value: stats.feedback.helpful, color: "text-success" },
    { label: <span className="flex justify-center items-center gap-1">Jawaban kurang tepat <ThumbsDown size={12}/></span>, value: stats.feedback.notHelpful, color: "text-danger" },
  ];
  const items = lengkap ? teknis : ringkas;

  return (
    <div className={`grid grid-cols-2 gap-3 ${lengkap ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
      {items.map((item, i) => (
        <div key={i} className="bg-surface-1 border border-neutral-200 rounded-xl p-3 text-center">
          <p className={`text-2xl font-serif font-bold ${item.color}`}>{item.value}</p>
          <p className="text-text-low text-xs mt-1 leading-tight">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Ingest panel component ─────────────────────────────────────────────────

type IngestTab = "jdih" | "manual" | "setneg" | "reingest";

function IngestPanel({ onSuccess, lanjutan = false }: { onSuccess: () => void; lanjutan?: boolean }) {
  const [tab, setTab] = useState<IngestTab>(lanjutan ? "jdih" : "manual");
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

  const tabs: { id: IngestTab; label: string }[] = lanjutan
    ? [
        { id: "jdih", label: "Ambil dari JDIH MA" },
        { id: "setneg", label: "Sinkron JDIH Setneg" },
        { id: "reingest", label: "Proses ulang berkas lokal" },
      ]
    : [];

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
      setError(pesanGalat(err, "menambahkan dokumen"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-surface-1 border border-neutral-200 rounded-xl p-5">
      <h2 className="text-text-high font-serif text-lg mb-4">
        {lanjutan ? "Ambil dokumen otomatis" : "Tambah dokumen"}
      </h2>

      {/* Tab buttons */}
      <div className={`flex gap-1 flex-wrap ${tabs.length ? "mb-5" : ""}`}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setResult(""); setError(""); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === t.id
                ? "bg-gold text-white"
                : "bg-surface-2 text-text-med hover:text-text-high border border-neutral-200"
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
            className="w-full bg-surface-2 border border-neutral-200 rounded-lg px-3 py-2 text-text-high text-sm focus:outline-none focus:border-maroon"
          />
          <div className="flex gap-3">
            <Select<DocType> label="Jenis dokumen" className="flex-1" value={jdihType} onChange={setJdihType} options={DOC_TYPE_OPTIONS} />
            <input
              type="number"
              min={1} max={10}
              value={jdihLimit}
              onChange={(e) => setJdihLimit(Number(e.target.value))}
              className="w-20 bg-surface-2 border border-neutral-200 rounded-lg px-3 py-2 text-text-high text-sm focus:outline-none focus:border-maroon"
            />
          </div>
        </div>
      )}

      {/* Tab: Manual Upload */}
      {tab === "manual" && (
        <div className="space-y-3">
          <p className="text-text-med text-xs">Tempel teks dokumen hukum, misalnya peraturan atau dokumen internal. AI akan memakainya untuk menjawab.</p>
          <input
            value={manualTitle}
            onChange={(e) => setManualTitle(e.target.value)}
            placeholder="Judul dokumen"
            className="w-full bg-surface-2 border border-neutral-200 rounded-lg px-3 py-2 text-text-high text-sm focus:outline-none focus:border-maroon"
          />
          <Select<DocType> label="Jenis dokumen" value={manualType} onChange={setManualType} options={DOC_TYPE_OPTIONS} />
          <textarea
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            rows={5}
            placeholder="Tempel teks dokumen di sini…"
            className="w-full bg-surface-2 border border-neutral-200 rounded-lg px-3 py-2 text-text-high text-sm focus:outline-none focus:border-maroon resize-y"
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
        className="mt-4 w-full py-2.5 rounded-lg bg-gold text-white font-semibold text-sm hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? <><LoadingSpinner size="sm" /> Memproses...</> : tab === "manual" ? "Simpan dokumen" : "Jalankan"}
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
  const { confirm, dialog } = useConfirm();
  const { toast, showToast } = useToast();
  const [lanjutan, setLanjutan] = useState(false);
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

  function handleDelete(id: string) {
    confirm({
      title: "Nonaktifkan dokumen",
      tone: "danger",
      confirmLabel: "Nonaktifkan",
      aksi: "menonaktifkan dokumen",
      message: "Dokumen tidak akan dipakai lagi oleh AI untuk menjawab. Datanya tetap tersimpan dan bisa diaktifkan kembali oleh developer.",
      onConfirm: async () => {
        await apiFetch(`/api/legal/admin/documents/${id}`, { method: "DELETE" });
        showToast("Dokumen dinonaktifkan.");
        loadDocs(docsPage);
        loadStats();
      },
    });
  }

  // Table columns for the document list
  const columns: Column<LegalDocument>[] = [
    {
      header: "Judul",
      accessor: "title",
      render: (row) => (
        <div>
          <p className="text-text-high font-medium text-sm">{row.title}</p>
        </div>
      ),
      width: "w-2/5",
    },
    {
      header: "Tipe",
      accessor: "type",
      // Singkatan resmi (UU, PP) dipakai di tabel supaya kolom tidak melebar; nama lengkap di tooltip.
      render: (row) => {
        const lengkap = label("docType", row.type);
        const singkat = lengkap.match(/\(([^)]+)\)$/)?.[1] ?? lengkap;
        return (
          <span title={lengkap}>
            <Badge variant="info" className="whitespace-nowrap">{singkat}</Badge>
          </span>
        );
      },
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
            Nonaktifkan
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
        <h1 className="text-2xl font-serif text-text-high">Basis Pengetahuan AI</h1>
        <p className="text-text-med text-sm mt-0.5">
          Dokumen hukum yang dipakai AI Lexsy untuk menjawab pertanyaan pengguna.
        </p>
      </div>

      <StatsRow stats={stats} />

      {/* ── 2-column layout: doc list + ingest form ────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[3fr_2fr] gap-6 items-start">
        {/* Document list */}
        <div className="bg-surface-1 border border-neutral-200 rounded-xl overflow-x-auto min-w-0">
          <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-200">
            <h2 className="text-text-high font-serif text-lg">Daftar dokumen</h2>
            <button
              onClick={() => { loadDocs(1); loadStats(); }}
              className="text-text-low hover:text-gold text-xs transition-colors"
            >
              Muat ulang
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
            emptyDescription="Tambahkan dokumen lewat form di samping."
          />
        </div>

        {/* Ingest panel */}
        <IngestPanel onSuccess={() => { loadDocs(1); loadStats(); }} />
      </div>

      {/* ── Pengaturan lanjutan (untuk developer) ─────────────────────── */}
      <div>
        <button
          type="button"
          onClick={() => setLanjutan((v) => !v)}
          aria-expanded={lanjutan}
          className="flex items-center gap-1.5 text-sm font-medium text-text-med hover:text-text-high transition-colors py-2"
        >
          <ChevronRight size={16} className={`transition-transform ${lanjutan ? "rotate-90" : ""}`} aria-hidden="true" />
          Pengaturan lanjutan
        </button>
        <p className="text-text-low text-xs">
          Pengambilan otomatis dari sumber resmi dan statistik teknis. Biasanya dipakai developer.
        </p>
        {lanjutan && (
          <div className="mt-4 space-y-6">
            <StatsRow stats={stats} lengkap />
            <IngestPanel lanjutan onSuccess={() => { loadDocs(1); loadStats(); }} />
            <div>
              <h2 className="text-text-high font-serif text-lg mb-1">Pengambilan dari banyak sumber</h2>
              <p className="text-text-med text-sm mb-4">
                Ambil katalog dulu, lalu proses (unduh dan ekstrak). Penyiapan untuk AI bisa ditunda lalu dijalankan
                sekaligus lewat tombol <span className="text-gold">Embed Pending</span>.
              </p>
              <ScrapePanel onChanged={() => { loadStats(); loadDocs(1); }} />
            </div>
          </div>
        )}
      </div>
      {dialog}
      <Toast state={toast} />
    </div>
  );
}

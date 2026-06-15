"use client";

// ScrapePanel — kontrol scraping multi-sumber.
// Alur dua fase (katalog -> proses), toggle embed, dan log realtime via SSE.

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Database, Download, Cpu, RefreshCw, Terminal, Upload } from "lucide-react";
import type { ScrapeSource, ScrapeLogLine, ScrapeCounts } from "@/types";

const TOKEN_KEY = "lexsee_admin_token";

type JobStatus = "RUNNING" | "DONE" | "FAILED" | null;

const LEVEL_COLOR: Record<string, string> = {
  info: "text-text-med",
  warn: "text-warning",
  error: "text-danger",
  success: "text-success",
};

export default function ScrapePanel({ onChanged }: { onChanged?: () => void }) {
  const [sources, setSources] = useState<ScrapeSource[]>([]);
  const [loadingSources, setLoadingSources] = useState(true);
  const [embedImmediately, setEmbedImmediately] = useState(false);
  const [limit, setLimit] = useState(50);

  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [logs, setLogs] = useState<ScrapeLogLine[]>([]);
  const [counts, setCounts] = useState<ScrapeCounts | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Upload manual PDF
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

  const esRef = useRef<EventSource | null>(null);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  const loadSources = useCallback(async () => {
    setLoadingSources(true);
    try {
      const data = await apiFetch<ScrapeSource[]>("/api/legal/admin/scrape/sources");
      setSources(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat sumber.");
    } finally {
      setLoadingSources(false);
    }
  }, []);

  useEffect(() => {
    loadSources();
    return () => esRef.current?.close();
  }, [loadSources]);

  // Auto-scroll log ke bawah saat ada baris baru
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const openStream = useCallback(
    (jobId: string) => {
      esRef.current?.close();
      setLogs([]);
      setCounts(null);
      setJobStatus("RUNNING");
      setActiveJobId(jobId);

      const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
      const es = new EventSource(
        `/api/legal/admin/scrape/jobs/${jobId}/stream?token=${encodeURIComponent(token ?? "")}`
      );
      esRef.current = es;

      es.onmessage = (event) => {
        let payload: Record<string, unknown>;
        try {
          payload = JSON.parse(event.data);
        } catch {
          return;
        }

        const type = payload.type;
        if (type === "snapshot") {
          setLogs((payload.logs as ScrapeLogLine[]) ?? []);
          setCounts((payload.counts as ScrapeCounts) ?? null);
          setJobStatus((payload.status as JobStatus) ?? "RUNNING");
          if (payload.status && payload.status !== "RUNNING") {
            es.close();
            void loadSources();
          }
        } else if (type === "log") {
          setLogs((prev) => [
            ...prev,
            { seq: payload.seq as number, level: payload.level as ScrapeLogLine["level"], message: payload.message as string },
          ]);
        } else if (type === "status") {
          setCounts((prev) => ({ ...(prev ?? { total: 0, processed: 0, ingested: 0, skipped: 0, failed: 0 }), ...(payload.counts as Partial<ScrapeCounts>) }));
        } else if (type === "done") {
          setJobStatus((payload.status as JobStatus) ?? "DONE");
          es.close();
          void loadSources();
          onChanged?.();
        }
      };

      es.onerror = () => {
        // EventSource akan mencoba reconnect; tutup agar tidak duplikat snapshot.
        es.close();
        setJobStatus((s) => (s === "RUNNING" ? "RUNNING" : s));
      };
    },
    [loadSources, onChanged]
  );

  async function startJob(endpoint: string, body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      const res = await apiFetch<{ jobId: string }>(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });
      openStream(res.jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memulai job.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadManual() {
    if (!uploadFile) return;
    setUploading(true);
    setUploadMsg("");
    setError("");
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
      const form = new FormData();
      form.append("file", uploadFile);
      if (uploadTitle.trim()) form.append("title", uploadTitle.trim());

      // FormData multipart — jangan set Content-Type manual (browser atur boundary)
      const res = await fetch("/api/legal/admin/scrape/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `Upload gagal (HTTP ${res.status})`);
      }
      const data = (await res.json()) as { judul: string };
      setUploadMsg(`Tersimpan: "${data.judul}". Tekan Embed Pending untuk meng-embed.`);
      setUploadFile(null);
      setUploadTitle("");
      void loadSources();
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload gagal.");
    } finally {
      setUploading(false);
    }
  }

  const running = jobStatus === "RUNNING";

  return (
    <div className="space-y-5">
      {/* ── Control bar ──────────────────────────────────────────── */}
      <div className="bg-surface-1 border border-gold/25 rounded-xl p-4 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={embedImmediately}
            onChange={(e) => setEmbedImmediately(e.target.checked)}
            className="accent-gold w-4 h-4"
          />
          <span className="text-text-high text-sm">
            Embed otomatis setelah scrape
            <span className="text-text-low text-xs ml-1">(default mati — embedding sering bermasalah)</span>
          </span>
        </label>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-text-med text-xs">Batas/proses</span>
          <input
            type="number"
            min={1}
            value={limit}
            onChange={(e) => setLimit(Math.max(1, Number(e.target.value)))}
            className="w-20 bg-surface-2 border border-gold/25 rounded-lg px-2 py-1.5 text-text-high text-sm focus:outline-none focus:border-gold/60"
          />
          <button
            onClick={() => startJob("/api/legal/admin/scrape/embed-pending", {})}
            disabled={busy || running}
            className="flex items-center gap-1.5 rounded-lg border border-gold/40 px-3 py-1.5 text-xs text-gold hover:bg-gold/10 transition-colors disabled:opacity-40"
          >
            <Cpu size={14} /> Embed Pending (semua)
          </button>
        </div>
      </div>

      {/* ── Upload PDF manual ────────────────────────────────────── */}
      <div className="bg-surface-1 border border-gold/25 rounded-xl p-4">
        <div className="flex items-center gap-2 text-text-high text-sm mb-3">
          <Upload size={15} className="text-gold" /> Upload PDF Manual
          <span className="text-text-low text-xs">(dokumen milik sendiri → masuk katalog, embed via Embed Pending)</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
            className="text-text-med text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-gold/15 file:px-3 file:py-1.5 file:text-gold file:text-xs file:font-semibold"
          />
          <input
            value={uploadTitle}
            onChange={(e) => setUploadTitle(e.target.value)}
            placeholder="Judul (opsional — default nama file)"
            className="flex-1 min-w-[200px] bg-surface-2 border border-gold/25 rounded-lg px-3 py-1.5 text-text-high text-sm focus:outline-none focus:border-gold/60"
          />
          <button
            onClick={uploadManual}
            disabled={!uploadFile || uploading}
            className="flex items-center gap-1.5 rounded-lg bg-gold px-4 py-1.5 text-xs font-semibold text-maroon-deep hover:bg-gold-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {uploading ? <LoadingSpinner size="sm" /> : <Upload size={13} />} Upload
          </button>
        </div>
        {uploadMsg && <p className="text-success text-xs mt-2">{uploadMsg}</p>}
      </div>

      {/* ── Source cards ─────────────────────────────────────────── */}
      {loadingSources ? (
        <div className="flex justify-center py-8"><LoadingSpinner /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sources.map((s) => (
            <div
              key={s.key}
              className={`bg-surface-1 border rounded-xl p-4 ${s.available ? "border-gold/25" : "border-gold/10 opacity-60"}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database size={16} className="text-gold" />
                  <h3 className="text-text-high font-medium text-sm">{s.label}</h3>
                </div>
                {!s.available && (
                  <span className="text-text-low text-[11px] border border-gold/20 rounded px-1.5 py-0.5">belum tersedia</span>
                )}
              </div>

              {/* Counts */}
              <div className="grid grid-cols-4 gap-2 mt-3">
                <Stat label="Total" value={s.total} color="text-text-high" />
                <Stat label="Sudah" value={s.downloaded} color="text-success" />
                <Stat label="Belum" value={s.pendingDownload} color="text-warning" />
                <Stat label="Embed pending" value={s.embedPending} color="text-gold" />
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => startJob("/api/legal/admin/scrape/catalog", { source: s.key })}
                  disabled={!s.available || busy || running}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-gold/30 px-3 py-2 text-xs text-text-high hover:bg-gold/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RefreshCw size={13} /> Refresh Katalog
                </button>
                <button
                  onClick={() =>
                    startJob("/api/legal/admin/scrape/process", { source: s.key, embedImmediately, limit })
                  }
                  disabled={!s.available || busy || running}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-gold px-3 py-2 text-xs font-semibold text-maroon-deep hover:bg-gold-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Download size={13} /> Proses
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-danger/10 border border-danger/25 text-danger text-sm">{error}</div>
      )}

      {/* ── Live log viewer ──────────────────────────────────────── */}
      {activeJobId && (
        <div className="bg-surface-1 border border-gold/25 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gold/15">
            <div className="flex items-center gap-2 text-text-high text-sm">
              <Terminal size={15} className="text-gold" /> Log Scraping
              {running && <LoadingSpinner size="sm" />}
            </div>
            <div className="flex items-center gap-3 text-xs">
              {counts && (
                <span className="text-text-med">
                  {counts.processed}/{counts.total} · <span className="text-success">{counts.ingested} ok</span> ·{" "}
                  <span className="text-warning">{counts.skipped} lewat</span> ·{" "}
                  <span className="text-danger">{counts.failed} gagal</span>
                </span>
              )}
              <StatusBadge status={jobStatus} />
            </div>
          </div>
          <div className="h-64 overflow-y-auto bg-surface-2/50 px-4 py-3 font-mono text-xs leading-relaxed">
            {logs.length === 0 ? (
              <p className="text-text-low">Menunggu log...</p>
            ) : (
              logs.map((l) => (
                <div key={l.seq} className={LEVEL_COLOR[l.level] ?? "text-text-med"}>
                  <span className="text-text-low mr-2">{String(l.seq).padStart(3, "0")}</span>
                  {l.message}
                </div>
              ))
            )}
            <div ref={logEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-surface-2 border border-gold/15 rounded-lg p-2 text-center">
      <p className={`text-lg font-serif font-bold ${color}`}>{value}</p>
      <p className="text-text-low text-[10px] mt-0.5 leading-tight">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: JobStatus }) {
  if (!status) return null;
  const map: Record<string, string> = {
    RUNNING: "bg-gold/15 text-gold",
    DONE: "bg-success/15 text-success",
    FAILED: "bg-danger/15 text-danger",
  };
  const label: Record<string, string> = { RUNNING: "Berjalan", DONE: "Selesai", FAILED: "Gagal" };
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${map[status]}`}>{label[status]}</span>;
}

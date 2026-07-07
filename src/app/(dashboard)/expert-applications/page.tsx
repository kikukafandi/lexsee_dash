"use client";

// Expert Applications — admin meninjau pengajuan user menjadi Ahli Hukum,
// melihat dokumen (di-stream ber-auth, bukan URL publik), lalu setuju/tolak.

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, FileText, ExternalLink } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";

const TOKEN_KEY = "lexsee_admin_token";

type ExpertUser = { id: string; name: string; email: string; phone?: string | null; photoUrl?: string | null };
type Application = {
  id: string;
  profession: string;
  professionOther?: string | null;
  status: string;
  createdAt: string;
  reviewedAt?: string | null;
  user?: ExpertUser | null;
};
type ApplicationDetail = Application & {
  bio: string;
  reviewNote?: string | null;
  documents: { type: string }[];
};

const PROFESSION_LABEL: Record<string, string> = {
  ADVOKAT: "Advokat / Pengacara",
  NOTARIS_PPAT: "Notaris / PPAT",
  KONSULTAN_HUKUM: "Konsultan Hukum",
  DOSEN_AKADEMISI: "Dosen / Akademisi",
  MEDIATOR: "Mediator",
  LAINNYA: "Lainnya",
};
const DOCS = [
  { type: "idCard", label: "Identitas (KTP/Paspor)" },
  { type: "license", label: "Kartu / Izin Profesi" },
  { type: "diploma", label: "Ijazah / Sertifikat" },
  { type: "cv", label: "CV / Portofolio" },
];
const STATUSES = ["PENDING", "APPROVED", "REJECTED", "ALL"] as const;

function professionText(p: string, other?: string | null) {
  return p === "LAINNYA" && other ? other : PROFESSION_LABEL[p] ?? p;
}
function tanggal(s?: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}
function statusVariant(s: string): "success" | "warning" | "danger" | "default" {
  if (s === "APPROVED") return "success";
  if (s === "PENDING") return "warning";
  if (s === "REJECTED") return "danger";
  return "default";
}

/** Stream dokumen PII dengan token (tak bisa via <img src> biasa karena butuh auth). */
async function fetchDocUrl(appId: string, type: string): Promise<{ url: string; isImage: boolean }> {
  const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
  const res = await fetch(`/api/expert/admin/applications/${appId}/documents/${type}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Gagal memuat dokumen");
  const blob = await res.blob();
  return { url: URL.createObjectURL(blob), isImage: blob.type.startsWith("image/") };
}

export default function ExpertApplicationsPage() {
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("PENDING");

  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [docUrls, setDocUrls] = useState<Record<string, { url: string; isImage: boolean }>>({});
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [modalError, setModalError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = status === "ALL" ? "" : `?status=${status}`;
      const res = await apiFetch<Application[]>(`/api/expert/admin/applications${q}`);
      setItems(Array.isArray(res) ? res : []);
      setError("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat pengajuan.");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  async function openDetail(id: string) {
    setModalError("");
    setNote("");
    setDocUrls({});
    try {
      const d = await apiFetch<ApplicationDetail>(`/api/expert/admin/applications/${id}`);
      setDetail(d);
      // Muat semua dokumen sebagai blob ber-auth.
      const loaded: Record<string, { url: string; isImage: boolean }> = {};
      await Promise.all(
        DOCS.map(async (doc) => {
          try {
            loaded[doc.type] = await fetchDocUrl(id, doc.type);
          } catch {
            /* biarkan kosong bila gagal */
          }
        }),
      );
      setDocUrls(loaded);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat detail.");
    }
  }

  function closeModal() {
    Object.values(docUrls).forEach((d) => URL.revokeObjectURL(d.url));
    setDetail(null);
    setDocUrls({});
  }

  async function review(decision: "APPROVED" | "REJECTED") {
    if (!detail) return;
    if (decision === "REJECTED" && !note.trim()) {
      setModalError("Beri alasan penolakan agar user bisa memperbaiki.");
      return;
    }
    setBusy(true);
    try {
      await apiFetch(`/api/expert/admin/applications/${detail.id}/review`, {
        method: "PATCH",
        body: JSON.stringify({ decision, note: note.trim() || undefined }),
      });
      closeModal();
      await load();
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : "Gagal memproses.");
    } finally {
      setBusy(false);
    }
  }

  const columns: Column<Application>[] = [
    {
      header: "Pemohon",
      accessor: "user",
      render: (row) => (
        <div>
          <p className="text-text-high font-medium text-sm">{row.user?.name ?? "—"}</p>
          <p className="text-text-low text-xs">{row.user?.email ?? ""}</p>
        </div>
      ),
    },
    {
      header: "Profesi",
      accessor: "profession",
      render: (row) => (
        <span className="text-text-med text-sm">{professionText(row.profession, row.professionOther)}</span>
      ),
    },
    {
      header: "Diajukan",
      accessor: "createdAt",
      render: (row) => <span className="text-text-med text-sm">{tanggal(row.createdAt)}</span>,
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => <Badge variant={statusVariant(row.status)}>{row.status}</Badge>,
    },
    {
      header: "Aksi",
      accessor: "id",
      render: (row) => (
        <button
          onClick={() => openDetail(row.id)}
          className="px-2.5 py-1 rounded-md bg-maroon text-white text-xs font-semibold hover:bg-maroon-dark transition-colors"
        >
          Tinjau
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-high">Pengajuan Ahli Hukum</h1>
        <p className="text-text-med text-sm mt-1">
          Verifikasi dokumen pemohon, lalu setujui atau tolak. Persetujuan menaikkan role user ke Expert.
        </p>
      </div>

      <div className="flex gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              status === s
                ? "bg-maroon text-white"
                : "bg-surface-1 border border-neutral-200 text-text-med hover:text-text-high"
            }`}
          >
            {s === "ALL" ? "Semua" : s}
          </button>
        ))}
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
          emptyMessage="Belum ada pengajuan"
          emptyDescription="Pengajuan user menjadi Ahli Hukum akan muncul di sini."
        />
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeModal}>
          <div
            className="bg-surface-1 border border-neutral-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-text-high">{detail.user?.name ?? "—"}</h2>
                <p className="text-text-low text-xs">{detail.user?.email} · {detail.user?.phone ?? "tanpa telepon"}</p>
              </div>
              <Badge variant={statusVariant(detail.status)}>{detail.status}</Badge>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="text-text-low text-xs font-semibold uppercase tracking-wider">Profesi</p>
                <p className="text-text-high">{professionText(detail.profession, detail.professionOther)}</p>
              </div>
              <div>
                <p className="text-text-low text-xs font-semibold uppercase tracking-wider">Pengalaman</p>
                <p className="text-text-med whitespace-pre-wrap">{detail.bio}</p>
              </div>
              {detail.reviewNote && (
                <div>
                  <p className="text-text-low text-xs font-semibold uppercase tracking-wider">Catatan Review</p>
                  <p className="text-text-med">{detail.reviewNote}</p>
                </div>
              )}
            </div>

            <div className="mt-5">
              <p className="text-text-low text-xs font-semibold uppercase tracking-wider mb-2">Dokumen</p>
              <div className="grid grid-cols-2 gap-3">
                {DOCS.map((doc) => {
                  const d = docUrls[doc.type];
                  return (
                    <div key={doc.type} className="border border-neutral-200 rounded-xl p-3">
                      <p className="text-text-high text-xs font-medium mb-2">{doc.label}</p>
                      {!d ? (
                        <p className="text-text-low text-xs">Memuat…</p>
                      ) : d.isImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={d.url} alt={doc.label} className="w-full h-32 object-cover rounded-lg" />
                      ) : (
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-maroon text-xs font-semibold hover:underline"
                        >
                          <FileText size={16} /> Buka dokumen <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {detail.status === "PENDING" && (
              <div className="mt-5 space-y-3">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Catatan / alasan (wajib bila menolak)"
                  rows={2}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-text-high focus:outline-none focus:border-maroon"
                />
                {modalError && <p className="text-danger text-xs">{modalError}</p>}
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => review("REJECTED")}
                    disabled={busy}
                    className="px-4 py-2 rounded-lg border border-neutral-300 text-text-med text-sm font-semibold hover:text-danger hover:border-danger/40 transition-colors disabled:opacity-50"
                  >
                    Tolak
                  </button>
                  <button
                    onClick={() => review("APPROVED")}
                    disabled={busy}
                    className="px-4 py-2 rounded-lg bg-maroon text-white text-sm font-semibold hover:bg-maroon-dark transition-colors disabled:opacity-50"
                  >
                    Setujui
                  </button>
                </div>
              </div>
            )}

            {detail.status !== "PENDING" && (
              <div className="mt-5 flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg border border-neutral-300 text-text-med text-sm font-semibold hover:text-text-high transition-colors"
                >
                  Tutup
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

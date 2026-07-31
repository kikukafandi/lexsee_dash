"use client";

// Detail Notifikasi — membuka satu notifikasi dari daftar/bell secara penuh.
// Saat halaman dibuka notifikasi otomatis ditandai sudah dibaca dan badge di
// Topbar ikut diperbarui.

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MailOpen, MoreVertical, Trash2 } from "lucide-react";

import { ApiError, apiFetch } from "@/lib/api";
import {
  formatTanggal,
  getMetadataLabel,
  notifAction,
  refreshNotifBell,
  setPendingToast,
  type AdminNotif,
} from "@/lib/notifications";
import { Toast, useToast } from "@/components/ui/Toast";
import {
  DeleteNotificationDialog,
  NotificationActionButton,
  NotificationCategoryBadge,
  NotificationDetailSkeleton,
  NotificationErrorState,
  NotificationIcon,
  NotificationInformationCard,
  NotificationStatusBadge,
  type InfoRow,
} from "@/components/features/notifications/NotificationParts";

const LIST_URL = "/notifications";

/**
 * Baris referensi entity — pelengkap metadata, sekaligus penjaga notifikasi lama
 * yang hanya punya entityId tanpa metadata sama sekali.
 */
function entityRows(n: AdminNotif): InfoRow[] {
  if (!n.entityId) return [];
  return [
    { label: "Jenis Data", value: n.entityType ? getMetadataLabel(n.entityType) : undefined },
    { label: "ID Data Terkait", value: n.entityId },
  ];
}

export default function NotificationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast, showToast } = useToast();

  const [notif, setNotif] = useState<AdminNotif | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const autoRead = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotFound(false);
    try {
      setNotif(await apiFetch<AdminNotif>(`/api/admin/notifications/${id}`));
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 404) setNotFound(true);
      else setError(err instanceof Error ? err.message : "Gagal memuat notifikasi.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Otomatis tandai sudah dibaca begitu detail terbuka.
  useEffect(() => {
    if (!notif || notif.isRead || autoRead.current) return;
    autoRead.current = true;
    apiFetch(`/api/admin/notifications/${notif.id}`, {
      method: "PATCH",
      body: JSON.stringify({ isRead: true }),
    })
      .then(() => {
        setNotif((n) => (n ? { ...n, isRead: true } : n));
        refreshNotifBell();
      })
      .catch(() => {
        /* status baca bukan aksi utama — biarkan senyap */
      });
  }, [notif]);

  // Tutup menu titik tiga saat klik di luar atau tekan Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  async function markUnread() {
    if (!notif) return;
    setMenuOpen(false);
    try {
      await apiFetch(`/api/admin/notifications/${notif.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isRead: false }),
      });
      autoRead.current = true; // jangan langsung ditandai dibaca lagi
      setNotif({ ...notif, isRead: false });
      refreshNotifBell();
      showToast("Ditandai belum dibaca.");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Gagal mengubah status.", "error");
    }
  }

  async function remove() {
    if (!notif) return;
    setBusy(true);
    try {
      await apiFetch(`/api/admin/notifications/${notif.id}`, { method: "DELETE" });
      refreshNotifBell();
      setPendingToast("Notifikasi dihapus.");
      router.push(LIST_URL);
    } catch (err: unknown) {
      setBusy(false);
      setConfirmDelete(false);
      showToast(err instanceof Error ? err.message : "Gagal menghapus notifikasi.", "error");
    }
  }

  const action = notif ? notifAction(notif) : null;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <Link
          href={LIST_URL}
          aria-label="Kembali ke daftar notifikasi"
          className="p-2 -ml-2 rounded-lg text-text-med hover:bg-surface-2 hover:text-text-high transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-lg sm:text-xl font-semibold text-text-high flex-1 min-w-0 truncate">
          Detail Notifikasi
        </h1>

        {notif && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Menu notifikasi"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="p-2 rounded-lg text-text-med hover:bg-surface-2 hover:text-text-high transition-colors"
            >
              <MoreVertical size={20} />
            </button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-56 bg-surface-1 border border-neutral-200 rounded-xl shadow-lg z-40 overflow-hidden"
              >
                <button
                  role="menuitem"
                  onClick={markUnread}
                  disabled={!notif.isRead}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm text-text-high hover:bg-surface-2 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <MailOpen size={16} /> Tandai belum dibaca
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    setConfirmDelete(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm text-danger hover:bg-surface-2 transition-colors border-t border-neutral-100"
                >
                  <Trash2 size={16} /> Hapus notifikasi
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Isi ─────────────────────────────────────────────────────────── */}
      {loading ? (
        <NotificationDetailSkeleton />
      ) : notFound ? (
        <NotificationErrorState
          title="Notifikasi tidak ditemukan"
          description="Notifikasi ini sudah dihapus atau tautannya tidak berlaku lagi."
        />
      ) : error ? (
        <NotificationErrorState description={error} onRetry={load} />
      ) : notif ? (
        <>
          {/* Identitas notifikasi */}
          <section className="bg-surface-1 border border-neutral-200 rounded-2xl p-4 sm:p-5 flex gap-4">
            <NotificationIcon type={notif.type} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <NotificationCategoryBadge type={notif.type} />
                <NotificationStatusBadge isRead={notif.isRead} />
              </div>
              <p className="text-text-low text-xs mt-2">
                Diterima {formatTanggal(notif.createdAt)}
              </p>
            </div>
          </section>

          {/* Isi utama */}
          <section className="bg-surface-1 border border-neutral-200 rounded-2xl p-4 sm:p-5">
            <h2 className="text-text-high text-lg sm:text-xl font-semibold">{notif.title}</h2>
            <p className="text-text-med text-sm leading-relaxed mt-2 whitespace-pre-wrap">
              {notif.body}
            </p>
          </section>

          {/* Informasi terkait */}
          <NotificationInformationCard metadata={notif.metadata} rows={entityRows(notif)} />

          {/* Tindakan lanjutan */}
          {action && (
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <NotificationActionButton
                label="Kembali ke Daftar"
                href={LIST_URL}
                variant="secondary"
              />
              <NotificationActionButton label={action.label} href={action.url} />
            </div>
          )}
        </>
      ) : null}

      <DeleteNotificationDialog
        open={confirmDelete}
        busy={busy}
        onCancel={() => !busy && setConfirmDelete(false)}
        onConfirm={remove}
      />
      <Toast state={toast} />
    </div>
  );
}

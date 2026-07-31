"use client";

// Daftar Notifikasi — versi halaman penuh dari feed yang ada di bell Topbar.
// Setiap baris membuka halaman detail /notifications/[id].

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { apiFetch } from "@/lib/api";
import {
  ago,
  refreshNotifBell,
  takePendingToast,
  type AdminNotif,
  type NotifFeed,
} from "@/lib/notifications";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Toast, useToast } from "@/components/ui/Toast";
import {
  NotificationCategoryBadge,
  NotificationIcon,
} from "@/components/features/notifications/NotificationParts";

const FILTERS = [
  { key: "all", label: "Semua" },
  { key: "unread", label: "Belum dibaca" },
] as const;

export default function NotificationsPage() {
  const { toast, showToast } = useToast();
  const [items, setItems] = useState<AdminNotif[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = filter === "unread" ? "?unread=true" : "";
      const res = await apiFetch<NotifFeed>(`/api/admin/notifications${q}`);
      setItems(res.items ?? []);
      setUnreadCount(res.unreadCount ?? 0);
      setError("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat notifikasi.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  // Toast yang dititipkan halaman detail (mis. setelah notifikasi dihapus).
  useEffect(() => {
    const pending = takePendingToast();
    if (pending) showToast(pending);
  }, [showToast]);

  async function markAllRead() {
    try {
      await apiFetch("/api/admin/notifications/read", { method: "POST", body: "{}" });
      refreshNotifBell();
      await load();
      showToast("Semua notifikasi ditandai dibaca.");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Gagal menandai dibaca.", "error");
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text-high">Notifikasi</h1>
          <p className="text-text-med text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca.` : "Semua notifikasi sudah dibaca."}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-maroon text-sm font-semibold hover:underline"
          >
            Tandai semua dibaca
          </button>
        )}
      </div>

      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === f.key
                ? "bg-maroon text-white"
                : "bg-surface-1 border border-neutral-200 text-text-med hover:text-text-high"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-surface-1 border border-neutral-200 rounded-xl p-4 flex items-center gap-3 text-danger text-sm">
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      <div className="bg-surface-1 border border-neutral-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="Belum ada notifikasi"
            description="Aktivitas yang perlu Anda ketahui akan muncul di sini."
          />
        ) : (
          <ul>
            {items.map((n) => (
              <li key={n.id} className="border-b border-neutral-100 last:border-0">
                <Link
                  href={`/notifications/${n.id}`}
                  className={`flex gap-3 px-4 py-3.5 hover:bg-surface-2 transition-colors ${
                    n.isRead ? "" : "bg-maroon/5"
                  }`}
                >
                  <NotificationIcon type={n.type} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <p className="text-text-high text-sm font-medium flex-1 min-w-0 truncate">
                        {n.title}
                      </p>
                      {!n.isRead && (
                        <span
                          className="mt-1.5 w-2 h-2 rounded-full bg-maroon shrink-0"
                          aria-label="Belum dibaca"
                        />
                      )}
                    </div>
                    <p className="text-text-med text-xs mt-0.5 line-clamp-2">{n.body}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <NotificationCategoryBadge type={n.type} />
                      <span className="text-text-low text-[11px]">{ago(n.createdAt)}</span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Toast state={toast} />
    </div>
  );
}

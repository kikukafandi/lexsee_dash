"use client";

// AdminNotificationBell — bell di Topbar yang memberi tahu admin ada aktivitas
// baru (mulai dari pengajuan Ahli Hukum). Polling ringan tiap 30 detik.

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { apiFetch } from "@/lib/api";

type AdminNotif = {
  id: string;
  type: string;
  title: string;
  body: string;
  entityId?: string | null;
  isRead: boolean;
  createdAt: string;
};
type Feed = { items: AdminNotif[]; unreadCount: number };

function ago(s: string) {
  const diff = Date.now() - new Date(s).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m}m lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j lalu`;
  return `${Math.floor(h / 24)}h lalu`;
}

const TARGET: Record<string, string> = { EXPERT_APPLICATION: "/expert-applications" };

export function AdminNotificationBell() {
  const router = useRouter();
  const [feed, setFeed] = useState<Feed>({ items: [], unreadCount: 0 });
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch<Feed>("/api/admin/notifications");
      setFeed({ items: res.items ?? [], unreadCount: res.unreadCount ?? 0 });
    } catch {
      /* diam saja — polling ringan */
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  // Tutup dropdown saat klik di luar.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function markRead(ids?: string[]) {
    try {
      await apiFetch("/api/admin/notifications/read", {
        method: "POST",
        body: JSON.stringify(ids ? { ids } : {}),
      });
      await load();
    } catch {
      /* abaikan */
    }
  }

  function openItem(n: AdminNotif) {
    setOpen(false);
    if (!n.isRead) markRead([n.id]);
    const target = TARGET[n.type];
    if (target) router.push(target);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg text-text-med hover:bg-surface-2 hover:text-text-high transition-colors"
        aria-label="Notifikasi"
      >
        <Bell size={18} />
        {feed.unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-maroon text-white text-[10px] font-bold flex items-center justify-center">
            {feed.unreadCount > 99 ? "99+" : feed.unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-surface-1 border border-neutral-200 rounded-xl shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
            <p className="text-text-high text-sm font-semibold">Notifikasi</p>
            {feed.unreadCount > 0 && (
              <button
                onClick={() => markRead()}
                className="text-maroon text-xs font-semibold hover:underline"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>
          {feed.items.length === 0 ? (
            <p className="px-4 py-6 text-center text-text-low text-sm">Belum ada notifikasi</p>
          ) : (
            feed.items.map((n) => (
              <button
                key={n.id}
                onClick={() => openItem(n)}
                className={`w-full text-left px-4 py-3 border-b border-neutral-100 hover:bg-surface-2 transition-colors ${
                  n.isRead ? "" : "bg-maroon/5"
                }`}
              >
                <div className="flex items-start gap-2">
                  {!n.isRead && <span className="mt-1.5 w-2 h-2 rounded-full bg-maroon shrink-0" />}
                  <div className={n.isRead ? "pl-4" : ""}>
                    <p className="text-text-high text-sm font-medium">{n.title}</p>
                    <p className="text-text-med text-xs mt-0.5">{n.body}</p>
                    <p className="text-text-low text-[11px] mt-1">{ago(n.createdAt)}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

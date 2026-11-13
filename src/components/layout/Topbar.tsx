"use client";

// Topbar.tsx — Sticky top navigation bar.
// Shows the current page breadcrumb, admin user info, and logout button.

import { usePathname } from "next/navigation";
import { Menu, UserRound } from "lucide-react";
import type { User } from "@/types";
import { AdminNotificationBell } from "./AdminNotificationBell";
import { NAV_LABEL } from "@/lib/labels";

type TopbarProps = {
  user: User | null;
  onLogout: () => void;
  onMenuClick?: () => void;
};


export function Topbar({ user, onLogout, onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  // Cocokkan path persis; kalau tidak ada (mis. rute detail /notifications/[id])
  // pakai segmen pertamanya.
  const pageName =
    NAV_LABEL[pathname] ?? NAV_LABEL[`/${pathname.split("/")[1]}`] ?? "Dashboard";

  return (
    <header className="h-16 shrink-0 bg-surface-1 border-b border-neutral-200 flex items-center px-4 sm:px-6 gap-3 sm:gap-4">
      {/* ── Hamburger (mobile only) ──────────────────────────────────── */}
      <button
        onClick={onMenuClick}
        className="lg:hidden -ml-1 p-2 rounded-lg text-text-med hover:bg-surface-2 hover:text-text-high transition-colors"
        aria-label="Buka menu"
      >
        <Menu size={20} />
      </button>

      {/* ── Breadcrumb ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-text-high font-medium">{pageName}</span>
      </div>

      {/* ── Spacer ───────────────────────────────────────────────────── */}
      <div className="flex-1" />

      {/* ── Notifikasi aktivitas ─────────────────────────────────────── */}
      <AdminNotificationBell />

      {/* ── Admin yang masuk + Keluar ───────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <UserRound size={20} className="text-text-med shrink-0" aria-hidden="true" />
        {user && (
          <div className="text-left hidden sm:block">
            <p className="text-text-high text-sm font-medium leading-none">
              {user.name}
            </p>
            <p className="text-text-low text-xs mt-0.5">{user.email}</p>
          </div>
        )}

        {/* Logout button */}
        <button
          onClick={onLogout}
          className="text-text-med hover:text-danger transition-colors text-sm px-2 py-2 ml-1"
        >
          Keluar
        </button>
      </div>
    </header>
  );
}

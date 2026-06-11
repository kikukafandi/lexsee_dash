"use client";

// Topbar.tsx — Sticky top navigation bar.
// Shows the current page breadcrumb, admin user info, and logout button.

import { usePathname } from "next/navigation";
import type { User } from "@/types";

type TopbarProps = {
  user: User | null;
  onLogout: () => void;
};

// Maps URL paths to display names for the breadcrumb
const PAGE_NAMES: Record<string, string> = {
  "/overview": "Overview",
  "/users": "Users",
  "/membership": "Membership Plans",
  "/orders": "Orders",
  "/payments": "Payments",
  "/legal-catalog": "Legal Catalog",
  "/knowledge-base": "Knowledge Base",
  "/testing": "Testing Suite",
};

export function Topbar({ user, onLogout }: TopbarProps) {
  const pathname = usePathname();
  const pageName = PAGE_NAMES[pathname] ?? "Dashboard";

  // Get initials from user's name for the avatar
  const initials = user?.name
    ? user.name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "A";

  return (
    <header className="h-16 shrink-0 bg-surface-1 border-b border-gold/15 flex items-center px-6 gap-4">
      {/* ── Breadcrumb ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-text-low">Workspace</span>
        <span className="text-text-low">›</span>
        <span className="text-text-high font-medium">{pageName}</span>
      </div>

      {/* ── Spacer ───────────────────────────────────────────────────── */}
      <div className="flex-1" />

      {/* ── User info + Logout ───────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {user && (
          <div className="text-right hidden sm:block">
            <p className="text-text-high text-sm font-medium leading-none">
              {user.name}
            </p>
            <p className="text-text-low text-xs mt-0.5">{user.email}</p>
          </div>
        )}

        {/* Avatar circle with initials */}
        <div className="w-9 h-9 rounded-full bg-linear-to-br from-gold to-gold-dim flex items-center justify-center text-maroon-deep font-bold text-sm font-serif shrink-0">
          {initials}
        </div>

        {/* Admin role badge */}
        <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gold/15 text-gold border border-gold/30">
          Admin
        </span>

        {/* Logout button */}
        <button
          onClick={onLogout}
          className="text-text-low hover:text-danger transition-colors text-xs px-3 py-1.5 rounded border border-gold/20 hover:border-danger/40 ml-1"
          title="Logout"
        >
          Keluar
        </button>
      </div>
    </header>
  );
}

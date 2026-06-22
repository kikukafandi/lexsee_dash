"use client";

// Sidebar.tsx — Fixed left navigation sidebar for the Admin Dashboard.
// Shows the Lexsee brand logo and grouped navigation links.
// Active page is highlighted with a gold left border and subtle background.

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Package,
  Wallet,
  BookOpen,
  Database,
  FlaskConical,
  Radio,
  Banknote
} from "lucide-react";

// Navigation structure — grouped by purpose
const NAV_GROUPS = [
  {
    label: "WORKSPACE",
    items: [
      { href: "/overview", label: "Overview", icon: <LayoutDashboard size={18} /> },
      { href: "/users", label: "Users", icon: <Users size={18} /> },
      { href: "/membership", label: "Membership Plans", icon: <CreditCard size={18} /> },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      { href: "/orders", label: "Orders", icon: <Package size={18} /> },
      { href: "/payments", label: "Payments", icon: <Wallet size={18} /> },
      { href: "/webinars", label: "Webinars", icon: <Radio size={18} /> },
      { href: "/legal-catalog", label: "Legal Catalog", icon: <BookOpen size={18} /> },
      { href: "/knowledge-base", label: "Knowledge Base", icon: <Database size={18} /> },
    ],
  },
  {
    label: "ADMINISTRATION",
    items: [
      { href: "/withdrawals", label: "Penarikan Saldo", icon: <Banknote size={18} /> },
      { href: "/testing", label: "Testing Suite", icon: <FlaskConical size={18} /> },
    ],
  },
];

export function Sidebar({
  open = false,
  onClose,
}: {
  open?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  // Check if the given href matches the current page
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* Backdrop (mobile only, saat drawer terbuka) */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-60 shrink-0 h-screen bg-surface-1
          border-r border-neutral-200 flex flex-col overflow-hidden
          transition-transform duration-300 ease-out
          lg:static lg:z-auto lg:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
      {/* ── Logo + Brand ────────────────────────────────────────────── */}
      <div className="px-5 py-5 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          {/* "L" icon — solid merah (tanpa gradient) */}
          <div className="w-9 h-9 rounded-lg bg-maroon flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-base font-serif">L</span>
          </div>
          <div>
            <p className="text-gold font-bold text-sm font-serif tracking-wider leading-none">
              LEXSEE
            </p>
            <p className="text-text-low text-[10px] tracking-widest uppercase mt-0.5">
              Admin Console
            </p>
          </div>
        </div>
      </div>

      {/* ── Navigation Groups ────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            {/* Group label */}
            <p className="text-text-low text-[10px] font-semibold tracking-widest uppercase px-2 mb-2">
              {group.label}
            </p>

            {/* Nav items */}
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm transition-all
                    ${
                      active
                        ? "bg-maroon text-white border-l-2 border-maroon font-medium"
                        : "text-text-med hover:bg-surface-2 hover:text-text-high border-l-2 border-transparent"
                    }
                  `}
                >
                  <span className="text-base w-5 text-center shrink-0" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Bottom divider ───────────────────────────────────────────── */}
      <div className="border-t border-neutral-200 p-3">
        <p className="text-text-low text-[10px] text-center">
          Lexsee Admin Console v1.0
        </p>
      </div>
      </aside>
    </>
  );
}

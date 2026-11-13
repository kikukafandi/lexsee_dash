"use client";

// Sidebar.tsx — Navigasi kiri dashboard admin.
// Nama menu diambil dari NAV_LABEL (src/lib/labels.ts). Alat untuk developer
// dikumpulkan di grup "Alat Teknis" yang tertutup secara bawaan.

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Inbox,
  LayoutDashboard,
  Users,
  CreditCard,
  Package,
  Wallet,
  BookOpen,
  Database,
  FlaskConical,
  Radio,
  Banknote,
  Sparkles,
  Scale,
  Ticket,
  SlidersHorizontal,
  MessagesSquare,
  ChevronRight,
} from "lucide-react";
import { NAV_LABEL } from "@/lib/labels";

type NavItem = { href: string; icon: React.ReactNode };
type NavGroup = { label: string; items: NavItem[]; collapsible?: boolean };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Utama",
    items: [
      { href: "/inbox", icon: <Inbox size={18} /> },
      { href: "/overview", icon: <LayoutDashboard size={18} /> },
      { href: "/users", icon: <Users size={18} /> },
      { href: "/membership", icon: <CreditCard size={18} /> },
    ],
  },
  {
    label: "Operasional",
    items: [
      { href: "/orders", icon: <Package size={18} /> },
      { href: "/payments", icon: <Wallet size={18} /> },
      { href: "/webinars", icon: <Radio size={18} /> },
      { href: "/consultations", icon: <MessagesSquare size={18} /> },
      { href: "/expert-applications", icon: <Scale size={18} /> },
      { href: "/withdrawals", icon: <Banknote size={18} /> },
    ],
  },
  {
    label: "Pengaturan",
    items: [
      { href: "/legal-catalog", icon: <BookOpen size={18} /> },
      { href: "/knowledge-base", icon: <Database size={18} /> },
      { href: "/ai-store", icon: <Sparkles size={18} /> },
      { href: "/vouchers", icon: <Ticket size={18} /> },
      { href: "/settings", icon: <SlidersHorizontal size={18} /> },
    ],
  },
  {
    label: "Alat Teknis",
    collapsible: true,
    items: [{ href: "/testing", icon: <FlaskConical size={18} /> }],
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
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  // Grup yang bisa dilipat terbuka sendiri kalau halamannya sedang dibuka.
  const [teknisTerbuka, setTeknisTerbuka] = useState(false);

  return (
    <>
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
        <div className="px-5 py-5 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <Image src="/logo-lexsee.png" alt="" width={36} height={36} priority className="shrink-0" />
            <div>
              <p className="text-gold font-bold text-sm font-serif tracking-wider leading-none">
                LEXSEE
              </p>
              <p className="text-text-low text-[10px] tracking-widest uppercase mt-0.5">
                Admin
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3" aria-label="Menu utama">
          {NAV_GROUPS.map((group) => {
            const terbuka =
              !group.collapsible ||
              teknisTerbuka ||
              group.items.some((i) => isActive(i.href));
            return (
              <div key={group.label} className="mb-5">
                {group.collapsible ? (
                  <button
                    type="button"
                    onClick={() => setTeknisTerbuka((v) => !v)}
                    aria-expanded={terbuka}
                    className="w-full flex items-center gap-1 text-text-low text-[10px] font-semibold tracking-widest uppercase px-2 mb-2 py-1 hover:text-text-med transition-colors"
                  >
                    <ChevronRight
                      size={12}
                      className={`transition-transform ${terbuka ? "rotate-90" : ""}`}
                      aria-hidden="true"
                    />
                    {group.label}
                  </button>
                ) : (
                  <p className="text-text-low text-[10px] font-semibold tracking-widest uppercase px-2 mb-2">
                    {group.label}
                  </p>
                )}

                {terbuka &&
                  group.items.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        aria-current={active ? "page" : undefined}
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
                        <span>{NAV_LABEL[item.href]}</span>
                      </Link>
                    );
                  })}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

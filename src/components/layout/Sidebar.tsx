"use client";

import Link from "next/link";
import { removeToken } from "@/lib/auth";
import type { Profile } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export default function Sidebar({
  activePath,
  profile,
}: {
  activePath: string;
  profile: Profile | null;
}) {
  const { t } = useI18n();
  const navGroups = [
    {
      title: t("workspace"),
      items: [
        { label: t("overview"), href: "/overview" },
        { label: t("matters"), href: "/matters" },
        { label: t("clients"), href: "/clients" },
        { label: t("documents"), href: "/documents" },
      ],
    },
    {
      title: t("operations"),
      items: [
        { label: t("billingInvoices"), href: "/billing-invoices" },
        { label: t("reports"), href: "/reports" },
        { label: t("auditLog"), href: "/audit-log" },
      ],
    },
    {
      title: t("administration"),
      items: [
        { label: t("usersRoles"), href: "/users-roles" },
        { label: t("settings"), href: "/settings" },
      ],
    },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-dividerGold bg-surface1 px-5 py-6">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gold text-white flex items-center justify-center font-semibold">
            L
          </div>
          <div>
            <div className="text-sm font-semibold text-textHigh">Lexsee</div>
            <div className="text-[11px] uppercase tracking-widest text-textLow">
              Admin console
            </div>
          </div>
        </div>
      </div>

      <nav className="space-y-6">
        {navGroups.map((group) => (
          <div key={group.title}>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-textLow">
              {group.title}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = activePath.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                      active
                        ? "bg-gold text-white"
                        : "text-textMed hover:bg-surface4 hover:text-textHigh"
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.label === t("matters") && (
                      <span className="rounded-full bg-surface2 px-2 py-0.5 text-[10px] text-textMed">
                        24
                      </span>
                    )}
                    {item.label === t("documents") && (
                      <span className="rounded-full bg-surface2 px-2 py-0.5 text-[10px] text-textMed">
                        NEW
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-8 rounded-xl border border-dividerGold bg-surface2 p-4">
        <div className="text-xs text-textLow">{t("storage")}</div>
        <div className="mt-2 h-2 w-full rounded-full bg-white">
          <div className="h-2 w-[68%] rounded-full bg-gold" />
        </div>
        <div className="mt-2 text-xs text-textMed">68.4 / 100 GB</div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-dividerGold pt-4">
        <div className="text-sm text-textHigh">
          {profile?.name || profile?.email || "Admin"}
        </div>
        <button
          className="text-xs uppercase tracking-widest text-textLow"
          onClick={() => {
            removeToken();
            window.location.href = "/login";
          }}
        >
          Logout
        </button>
      </div>
    </aside>
  );
}

"use client";

import type { Profile } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export default function Topbar({ profile }: { profile: Profile | null }) {
  const { lang, setLang, t } = useI18n();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-dividerGold bg-surface1 px-8">
      <div className="flex items-center gap-4 text-sm text-textMed">
        <span>{t("workspace")}</span>
        <span className="text-textLow">›</span>
        <span className="text-textHigh">{t("overview")}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-dividerGold bg-surface2 px-3 py-2 text-sm text-textMed">
          <span>🔍</span>
          <input
            className="w-48 bg-transparent text-textHigh placeholder:text-textLow focus:outline-none"
            placeholder={t("searchPlaceholder")}
          />
          <span className="rounded bg-white px-1 text-[10px] text-textLow">⌘K</span>
        </div>
        <div className="rounded-lg border border-dividerGold bg-surface2 px-3 py-2 text-sm text-textMed">
          {t("dateRange")}
        </div>
        <button className="rounded-lg border border-dividerGold bg-white px-3 py-2 text-sm text-textHigh">
          {t("export")}
        </button>
        <button className="rounded-lg bg-gold px-3 py-2 text-sm font-semibold text-white">
          + {t("newMatter")}
        </button>
        <button
          className="rounded-lg border border-dividerGold bg-white px-2 py-2 text-xs text-textMed"
          onClick={() => setLang(lang === "id" ? "en" : "id")}
        >
          {lang.toUpperCase()}
        </button>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-surface2 flex items-center justify-center text-xs">
            {profile?.name?.[0] || "A"}
          </div>
          <div className="text-sm text-textHigh">
            {profile?.name || profile?.email || "Admin"}
          </div>
        </div>
      </div>
    </header>
  );
}

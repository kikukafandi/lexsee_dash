"use client";

import { useEffect, useMemo, useState } from "react";
import KpiCard from "@/components/ui/KpiCard";
import RevenueChart from "@/components/features/overview/RevenueChart";
import ActivityFeed from "@/components/features/overview/ActivityFeed";
import { apiFetch } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { getProfile } from "@/lib/auth";
import type { AdminStats, PaymentHistoryItem } from "@/types";

export default function OverviewPage() {
  const { t, lang } = useI18n();
  const [stats, setStats] = useState<AdminStats>({});
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [name, setName] = useState("Admin");

  useEffect(() => {
    apiFetch<AdminStats>("/legal/admin/stats")
      .then(setStats)
      .catch(() => setStats({}));

    apiFetch<PaymentHistoryItem[]>("/payment/history")
      .then((data) => setPayments(Array.isArray(data) ? data : []))
      .catch(() => setPayments([]));

    getProfile()
      .then((profile) => setName(profile?.name || profile?.email || "Admin"))
      .catch(() => setName("Admin"));
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t("greetingMorning");
    if (hour < 18) return t("greetingAfternoon");
    return t("greetingEvening");
  }, [t]);

  const revenueData = useMemo(() => {
    if (!payments.length) {
      return [];
    }

    const grouped = payments.reduce<Record<string, number>>((acc, item) => {
      const date = new Date(item.createdAt || Date.now());
      const key = date.toLocaleString("en", { month: "short" });
      acc[key] = (acc[key] || 0) + (item.amount || 0);
      return acc;
    }, {});

    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [payments]);

  const helpfulRate = useMemo(() => {
    const helpful = stats.feedback?.helpful || 0;
    const notHelpful = stats.feedback?.notHelpful || 0;
    const total = helpful + notHelpful;
    return total ? Math.round((helpful / total) * 100) : 0;
  }, [stats]);

  const summaryText = useMemo(() => {
    const docs = stats.documents?.active || 0;
    const sessions = stats.sessions || 0;
    const chunks = stats.chunks || 0;
    if (lang === "id") {
      return `Status pengetahuan: ${docs} dokumen aktif, ${sessions} sesi chat, ${chunks} chunk vektor.`;
    }
    return `Knowledge status: ${docs} active documents, ${sessions} chat sessions, ${chunks} vector chunks.`;
  }, [lang, stats]);

  return (
    <div className="space-y-6">
      <div className="lux-card p-6">
        <div className="text-xs uppercase tracking-widest text-textLow">
          {new Date().toLocaleDateString(lang === "id" ? "id-ID" : "en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </div>
        <h1 className="mt-2 text-3xl text-textHigh">
          {greeting}, {name}.
        </h1>
        <p className="mt-2 text-sm text-textMed">{summaryText}</p>
        <div className="mt-3 text-xs text-success">● {t("systemsNormal")}</div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <KpiCard label={t("activeMatters")} value={stats.documents?.active || 0} />
        <KpiCard label={t("billableHours")} value={stats.sessions || 0} />
        <KpiCard label={t("outstandingAR")} value={stats.chunks || 0} />
        <KpiCard label={t("realizationRate")} value={`${helpfulRate}%`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr,1fr]">
        <div className="lux-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-textLow">
                {t("financialPerformance")}
              </div>
              <div className="text-lg text-textHigh">
                {t("billingsCollections")}
              </div>
            </div>
            <div className="flex gap-2 text-xs text-textMed">
              <span className="rounded-full border border-dividerGold px-2 py-1">7D</span>
              <span className="rounded-full border border-dividerGold px-2 py-1">30D</span>
              <span className="rounded-full border border-dividerGold px-2 py-1">90D</span>
              <span className="rounded-full border border-dividerGold px-2 py-1 bg-surface2">12M</span>
            </div>
          </div>
          <div className="mt-4">
            <RevenueChart data={revenueData} />
          </div>
        </div>
        <ActivityFeed
          title={t("liveActivity")}
          subtitle={t("acrossFirm")}
          items={[
            {
              label:
                lang === "id"
                  ? `Dokumen aktif: ${stats.documents?.active || 0}`
                  : `Active documents: ${stats.documents?.active || 0}`,
              time: lang === "id" ? "baru saja" : "just now",
            },
            {
              label:
                lang === "id"
                  ? `Sesi chat: ${stats.sessions || 0}`
                  : `Chat sessions: ${stats.sessions || 0}`,
              time: lang === "id" ? "baru saja" : "just now",
            },
            {
              label:
                lang === "id"
                  ? `Chunk vektor: ${stats.chunks || 0}`
                  : `Vector chunks: ${stats.chunks || 0}`,
              time: lang === "id" ? "baru saja" : "just now",
            },
            {
              label:
                lang === "id"
                  ? `Feedback membantu: ${stats.feedback?.helpful || 0}`
                  : `Helpful feedback: ${stats.feedback?.helpful || 0}`,
              time: lang === "id" ? "baru saja" : "just now",
            },
          ]}
        />
      </div>
    </div>
  );
}

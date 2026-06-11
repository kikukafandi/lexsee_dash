"use client";

// Overview page — the main landing page of the Admin Console.
// Shows KPI cards from the knowledge base stats, a payment chart,
// and a summary of the membership plans.

import { useEffect, useState } from "react";
import { AlertTriangle, ThumbsUp, ThumbsDown } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { apiFetch } from "@/lib/api";
import { Sparkline } from "@/components/ui/Sparkline";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { KbStats, Payment, MembershipPlan, AdminUsersResponse } from "@/types";

// ─── Helper: get time-of-day greeting ──────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Selamat pagi";
  if (hour < 17) return "Selamat siang";
  return "Selamat malam";
}

// ─── Helper: group payments by month for the area chart ───────────────────

type ChartPoint = { month: string; sukses: number; pending: number };

function groupPaymentsByMonth(payments: Payment[]): ChartPoint[] {
  // Use a Map to accumulate totals per month label
  const map = new Map<string, { sukses: number; pending: number }>();

  payments.forEach((p) => {
    const date = new Date(p.createdAt);
    const label = date.toLocaleDateString("id-ID", {
      month: "short",
      year: "2-digit",
    });
    if (!map.has(label)) map.set(label, { sukses: 0, pending: 0 });
    const entry = map.get(label)!;
    const amount = Number(p.amount);
    if (p.status === "SUCCESS") entry.sukses += amount;
    else entry.pending += amount;
  });

  return Array.from(map.entries()).map(([month, data]) => ({
    month,
    ...data,
  }));
}

// ─── Sub-component: single KPI card ────────────────────────────────────────

type KpiCardProps = {
  label: string;
  value: string | number;
  subtext?: string;
  sparkData?: number[];
  accentColor?: string;
};

function KpiCard({
  label,
  value,
  subtext,
  sparkData,
  accentColor = "#C9A84C",
}: KpiCardProps) {
  return (
    <div className="bg-surface-1 border border-gold/25 rounded-xl p-5 flex flex-col gap-3">
      <p className="text-text-low text-xs font-semibold uppercase tracking-wider">
        {label}
      </p>
      <p className="text-3xl font-serif text-gold leading-none">{value}</p>
      <div className="flex items-end justify-between">
        {subtext && <p className="text-text-med text-xs">{subtext}</p>}
        {sparkData && <Sparkline data={sparkData} color={accentColor} />}
      </div>
    </div>
  );
}

// ─── Main page component ────────────────────────────────────────────────────

export default function OverviewPage() {
  const [stats, setStats] = useState<KbStats | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [userStats, setUserStats] = useState<AdminUsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch all data in parallel for faster loading
        const [statsData, paymentsData, plansData, usersData] = await Promise.all([
          apiFetch<KbStats>("/api/legal/admin/stats"),
          apiFetch<Payment[]>("/api/payment/history"),
          apiFetch<MembershipPlan[]>("/api/membership-plans"),
          apiFetch<AdminUsersResponse>("/api/admin/users"),
        ]);
        setStats(statsData);
        setPayments(Array.isArray(paymentsData) ? paymentsData : []);
        setPlans(Array.isArray(plansData) ? plansData : []);
        setUserStats(usersData);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Gagal memuat data.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Derived: helpful feedback rate as a percentage
  const helpfulRate =
    stats && stats.feedback.helpful + stats.feedback.notHelpful > 0
      ? Math.round(
          (stats.feedback.helpful /
            (stats.feedback.helpful + stats.feedback.notHelpful)) *
            100
        )
      : 0;

  // Derived: chart data from payment history
  const chartData = groupPaymentsByMonth(payments);

  // Derived: total revenue (successful payments)
  const totalRevenue = payments
    .filter((p) => p.status === "SUCCESS")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Greeting header ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text-low text-xs uppercase tracking-widest mb-1">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <h1 className="text-3xl font-serif text-text-high">
            {getGreeting()}, Admin.
          </h1>
          <p className="text-text-med text-sm mt-1">
            Selamat datang di Lexsee Admin Console.
          </p>
        </div>
        {/* System status indicator */}
        <div className="flex items-center gap-2 text-xs text-text-med bg-surface-2 px-3 py-1.5 rounded-full border border-gold/15">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          Sistem normal
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/25 text-danger text-sm flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0" /> {error}
        </div>
      )}

      {/* ── KPI Cards row ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Dokumen AI Aktif"
          value={stats?.documents.active ?? 0}
          subtext={`${stats?.documents.total ?? 0} total dokumen`}
          sparkData={[3, 5, 4, 8, 6, 10, stats?.documents.active ?? 0]}
        />
        <KpiCard
          label="Sesi Konsultasi"
          value={stats?.sessions ?? 0}
          subtext="Total sesi chat AI"
          sparkData={[10, 15, 12, 20, 18, 25, stats?.sessions ?? 0]}
          accentColor="#E2C97E"
        />
        <KpiCard
          label="Vector Embedding"
          value={stats?.chunks ?? 0}
          subtext="Chunks di knowledge base"
          sparkData={[50, 80, 120, 160, 200, stats?.chunks ?? 0]}
          accentColor="#9A7E38"
        />
        <KpiCard
          label="Tingkat Kepuasan AI"
          value={`${helpfulRate}%`}
          subtext={`${stats?.feedback.helpful ?? 0} positif · ${stats?.feedback.notHelpful ?? 0} negatif`}
          sparkData={[60, 65, 70, 75, helpfulRate]}
          accentColor={helpfulRate >= 70 ? "#43A047" : "#F59E0B"}
        />
      </div>

      {/* ── Chart + Activity section ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Payment area chart (takes 2/3 width on large screens) */}
        <div className="lg:col-span-2 bg-surface-1 border border-gold/25 rounded-xl p-5">
          <p className="text-text-low text-xs uppercase tracking-wider mb-1">
            RIWAYAT PEMBAYARAN
          </p>
          <h2 className="text-text-high font-serif text-xl mb-1">
            Pembayaran vs. Pending
          </h2>
          <p className="text-text-med text-xs mb-5">
            Total berhasil:{" "}
            <span className="text-gold font-semibold">
              Rp {totalRevenue.toLocaleString("id-ID")}
            </span>
          </p>

          {chartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-text-low text-sm">
              Belum ada data pembayaran.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  {/* Gold gradient fill for successful payments */}
                  <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#C9A84C" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(201,168,76,0.1)"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: "#2A0909",
                    border: "1px solid rgba(201,168,76,0.25)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  labelStyle={{ color: "#E2C97E", fontWeight: "bold" }}
                  formatter={(value: number) => [
                    `Rp ${value.toLocaleString("id-ID")}`,
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="sukses"
                  stroke="#C9A84C"
                  fill="url(#goldGrad)"
                  strokeWidth={2}
                  name="Berhasil"
                />
                <Area
                  type="monotone"
                  dataKey="pending"
                  stroke="#5C0A0A"
                  fill="rgba(92,10,10,0.2)"
                  strokeWidth={2}
                  name="Pending"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Feedback breakdown (1/3 width) */}
        <div className="bg-surface-1 border border-gold/25 rounded-xl p-5">
          <p className="text-text-low text-xs uppercase tracking-wider mb-1">
            FEEDBACK AI
          </p>
          <h2 className="text-text-high font-serif text-xl mb-4">
            Respons Pengguna
          </h2>

          <div className="space-y-4">
            {/* Helpful feedback */}
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-success text-sm flex items-center gap-1"><ThumbsUp size={14} /> Membantu</span>
                <span className="text-text-high font-semibold">
                  {stats?.feedback.helpful ?? 0}
                </span>
              </div>
              <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-success rounded-full transition-all"
                  style={{ width: `${helpfulRate}%` }}
                />
              </div>
            </div>

            {/* Not helpful feedback */}
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-danger text-sm flex items-center gap-1"><ThumbsDown size={14} /> Kurang tepat</span>
                <span className="text-text-high font-semibold">
                  {stats?.feedback.notHelpful ?? 0}
                </span>
              </div>
              <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-danger rounded-full transition-all"
                  style={{ width: `${100 - helpfulRate}%` }}
                />
              </div>
            </div>

            <div className="border-t border-gold/10 pt-4">
              <p className="text-text-low text-xs">Total feedback</p>
              <p className="text-gold text-2xl font-serif font-bold mt-1">
                {(stats?.feedback.helpful ?? 0) +
                  (stats?.feedback.notHelpful ?? 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Membership Plans summary ─────────────────────────────────── */}
      {plans.length > 0 && (
        <div>
          <h2 className="text-text-med text-sm font-semibold uppercase tracking-wider mb-3">
            Paket Membership Aktif
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans
              .filter((p) => p.isActive)
              .map((plan) => (
                <div
                  key={plan.id}
                  className={`bg-surface-1 border rounded-xl p-4 ${
                    plan.isPopular
                      ? "border-gold/50 shadow-lg shadow-gold/10"
                      : "border-gold/20"
                  }`}
                >
                  {plan.isPopular && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gold bg-gold/10 px-2 py-0.5 rounded-full border border-gold/20 mb-2 inline-block">
                      Populer
                    </span>
                  )}
                  <p className="text-text-high font-semibold">{plan.name}</p>
                  <p className="text-gold text-xl font-serif font-bold mt-1">
                    Rp {Number(plan.price).toLocaleString("id-ID")}
                  </p>
                  <p className="text-text-low text-xs mt-0.5">
                    per {plan.duration === "MONTHLY" ? "bulan" : "tahun"}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── User Distribution ────────────────────────────────────────── */}
      {userStats && (
        <div>
          <h2 className="text-text-med text-sm font-semibold uppercase tracking-wider mb-3">
            Distribusi Pengguna
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-surface-1 border border-gold/25 rounded-xl p-5">
              <p className="text-text-low text-xs font-semibold uppercase tracking-wider mb-2">
                Total Pengguna Terdaftar
              </p>
              <p className="text-4xl font-serif text-gold">{userStats.summary.total}</p>
              <p className="text-text-low text-xs mt-1">
                {(userStats.summary.byMembership["SILVER"] ?? 0) +
                  (userStats.summary.byMembership["GOLD"] ?? 0) +
                  (userStats.summary.byMembership["PLATINUM"] ?? 0)}{" "}
                berlangganan ·{" "}
                {userStats.summary.byMembership["FREE"] ?? 0} free
              </p>
            </div>
            <div className="bg-surface-1 border border-gold/25 rounded-xl p-5">
              <p className="text-text-low text-xs font-semibold uppercase tracking-wider mb-4">
                Breakdown per Tier
              </p>
              <div className="space-y-2.5">
                {(["FREE", "SILVER", "GOLD", "PLATINUM"] as const).map((tier) => {
                  const count = userStats.summary.byMembership[tier] ?? 0;
                  const pct =
                    userStats.summary.total > 0
                      ? Math.round((count / userStats.summary.total) * 100)
                      : 0;
                  const barColor =
                    tier === "PLATINUM"
                      ? "bg-warning"
                      : tier === "GOLD"
                      ? "bg-gold"
                      : tier === "SILVER"
                      ? "bg-blue-400"
                      : "bg-surface-4";
                  return (
                    <div key={tier}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-text-med">{tier}</span>
                        <span className="text-text-high font-semibold">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${barColor} rounded-full transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

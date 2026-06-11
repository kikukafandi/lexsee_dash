"use client";

// Membership page — overview of active plans, subscriber counts, and tier pricing.

import { useEffect, useState } from "react";
import { AlertTriangle, Plus, Edit, Trash2 } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { Badge } from "@/components/ui/Badge";
import { PlanForm } from "@/components/features/membership/PlanForm";
import type { MembershipPlan, MembershipTier, AdminUsersResponse } from "@/types";

// ─── Tier badge variant helper ───────────────────────────────────────────────

type TierKey = "SILVER" | "GOLD" | "PLATINUM" | "FREE";

const TIER_VARIANTS: Record<TierKey, "info" | "gold" | "warning" | "default"> = {
  SILVER: "info",
  GOLD: "gold",
  PLATINUM: "warning",
  FREE: "default",
};

function tierVariant(tier: string): "info" | "gold" | "warning" | "default" {
  return TIER_VARIANTS[tier as TierKey] ?? "default";
}

// ─── Format helpers ──────────────────────────────────────────────────────────

function formatRp(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

function durationLabel(duration: "MONTHLY" | "YEARLY"): string {
  return duration === "MONTHLY" ? "bulan" : "tahun";
}

// ─── Sub-components ──────────────────────────────────────────────────────────

type StatCardProps = {
  label: string;
  value: number;
  tier?: TierKey;
};

function StatCard({ label, value, tier }: StatCardProps) {
  return (
    <div className="bg-surface-1 border border-gold/25 rounded-xl p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-text-med text-sm font-semibold uppercase tracking-wider">
          {label}
        </span>
        {tier && (
          <Badge variant={tierVariant(tier)}>{tier}</Badge>
        )}
      </div>
      <p className="text-3xl font-serif text-gold">{value}</p>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function MembershipPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [plansData, tiersData, usersData] = await Promise.all([
        apiFetch<MembershipPlan[]>("/api/admin/membership-plans"),
        apiFetch<MembershipTier[]>("/api/payment/tiers"),
        apiFetch<AdminUsersResponse>("/api/admin/users"),
      ]);
      setPlans(Array.isArray(plansData) ? plansData : []);
      setTiers(Array.isArray(tiersData) ? tiersData : []);
      setSummary(usersData?.summary?.byMembership ?? {});
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat data membership.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleOpenForm = (plan: MembershipPlan | null = null) => {
    setSelectedPlan(plan);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setSelectedPlan(null);
    setIsFormOpen(false);
  };

  const handleSuccess = () => {
    fetchAllData();
  };

  const handleDelete = async (planId: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus plan ini?")) {
      try {
        await apiFetch(`/api/admin/membership-plans/${planId}`, { method: "DELETE" });
        handleSuccess();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal menghapus plan.");
      }
    }
  };

  if (loading) return <PageLoader />;

  // ── Stat totals ─────────────────────────────────────────────────────────────
  const silverCount = summary["SILVER"] ?? 0;
  const goldCount = summary["GOLD"] ?? 0;
  const platinumCount = summary["PLATINUM"] ?? 0;
  const totalSubscribers = silverCount + goldCount + platinumCount;

  // ── Active plans ─────────────────────────────────────────────────────────────
  const activePlans = plans.filter((p) => p.isActive);
  const inactivePlans = plans.filter((p) => !p.isActive);

  // Derive subscriber count for a plan by matching plan name's first word to a tier key
  function planSubscriberCount(planName: string): number {
    const tierKey = planName.split(" ")[0]?.toUpperCase() ?? "";
    return summary[tierKey] ?? 0;
  }

  return (
    <div className="space-y-8">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-serif text-text-high">Membership</h1>
        <p className="text-text-med text-sm mt-0.5">
          Ringkasan paket berlangganan aktif dan distribusi pengguna.
        </p>
      </div>

      {/* ── Error banner ─────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-danger/10 border border-danger/25 text-danger text-sm">
          <AlertTriangle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* ── Stat cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Berlangganan" value={totalSubscribers} />
        <StatCard label="Silver" value={silverCount} tier="SILVER" />
        <StatCard label="Gold" value={goldCount} tier="GOLD" />
        <StatCard label="Platinum" value={platinumCount} tier="PLATINUM" />
      </div>

      {/* ── Active plan cards ─────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-2xl font-serif text-text-high">Paket Langganan</h2>
          <button onClick={() => handleOpenForm()} className="btn btn-primary btn-sm">
            <Plus size={16} />
            Buat Plan Baru
          </button>
        </div>

        {plans.length === 0 && !loading ? (
          <p className="text-text-low text-sm">Belum ada paket yang dibuat.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const subscribers = planSubscriberCount(plan.name);
              const priceNum = Number(plan.price);
              const origNum = plan.originalPrice ? Number(plan.originalPrice) : null;
              const hasDiscount = origNum !== null && origNum > priceNum;
              const featuresArray: any[] = Array.isArray(plan.features)
                ? plan.features
                : [];

              return (
                <div
                  key={plan.id}
                  className={`bg-surface-1 border rounded-xl p-5 flex flex-col gap-3 transition-all ${plan.isActive ? 'border-gold/25' : 'border-base-content/10 opacity-60'}`}
                >
                  {/* Plan header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-text-high font-semibold text-base">{plan.name}</p>
                      <p className="text-text-low text-xs mt-0.5">
                        per {durationLabel(plan.duration)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!plan.isActive && <Badge variant="secondary">Arsip</Badge>}
                      {plan.isPopular && <Badge variant="gold">Populer</Badge>}
                    </div>
                  </div>

                  {/* Pricing */}
                  <div>
                    <p className="text-3xl font-serif text-gold">
                      {formatRp(priceNum)}
                    </p>
                    {hasDiscount && origNum !== null && (
                      <p className="text-text-low text-sm line-through">
                        {formatRp(origNum)}
                      </p>
                    )}
                  </div>

                  {/* Subscriber count */}
                  <div className="flex items-center gap-2">
                    <span className="text-text-med text-sm font-semibold uppercase tracking-wider">
                      Pelanggan
                    </span>
                    <span className="text-text-high font-semibold text-sm">{subscribers}</span>
                  </div>

                  {/* Features */}
                  {featuresArray.length > 0 && (
                    <ul className="space-y-1 mt-2 border-t border-gold/10 pt-3">
                      {featuresArray.map((feature: any, idx) => {
                        const name = typeof feature === "string" ? feature : feature.name;
                        const isIncluded = typeof feature === "string" ? true : feature.included !== false;
                        return (
                          <li key={idx} className={`flex items-start gap-2 text-sm ${isIncluded ? 'text-text-med' : 'text-text-low'}`}>
                            <span className={isIncluded ? 'text-gold shrink-0' : 'text-text-low shrink-0 opacity-50'}>
                              {isIncluded ? '✓' : '✕'}
                            </span>
                            <span className={!isIncluded ? 'line-through opacity-70' : ''}>{name}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {/* Admin Actions */}
                  <div className="mt-auto pt-4 border-t border-gold/10 flex items-center justify-end gap-2">
                     <button onClick={() => handleOpenForm(plan)} className="btn btn-ghost btn-sm text-text-med hover:bg-gold/10 hover:text-gold">
                       <Edit size={14} />
                       Edit
                     </button>
                     <button onClick={() => handleDelete(plan.id)} className="btn btn-ghost btn-sm text-danger/70 hover:bg-danger/10 hover:text-danger">
                       <Trash2 size={14} />
                       Hapus
                     </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Pricing tier reference table ─────────────────────────────────── */}
      <section>
        <h2 className="text-2xl font-serif text-text-high mb-4">Referensi Harga Tier</h2>
        <div className="bg-surface-1 border border-gold/25 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gold/15">
                <th className="text-left text-text-med text-sm font-semibold uppercase tracking-wider px-5 py-3">
                  Tier
                </th>
                <th className="text-left text-text-med text-sm font-semibold uppercase tracking-wider px-5 py-3">
                  Label
                </th>
                <th className="text-left text-text-med text-sm font-semibold uppercase tracking-wider px-5 py-3">
                  Harga
                </th>
                <th className="text-left text-text-med text-sm font-semibold uppercase tracking-wider px-5 py-3">
                  Durasi
                </th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((tier, idx) => (
                <tr
                  key={tier.tier}
                  className={idx % 2 === 0 ? "bg-transparent" : "bg-surface-2/40"}
                >
                  <td className="px-5 py-3">
                    <Badge variant={tierVariant(tier.tier)}>{tier.tier}</Badge>
                  </td>
                  <td className="px-5 py-3 text-text-high">{tier.label}</td>
                  <td className="px-5 py-3 text-gold font-semibold">
                    {formatRp(tier.amount)}
                  </td>
                  <td className="px-5 py-3 text-text-med">{tier.durationDays} hari</td>
                </tr>
              ))}
              {tiers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-center text-text-low">
                    Tidak ada data tier tersedia.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <PlanForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSuccess={handleSuccess}
        plan={selectedPlan}
      />
    </div>
  );
}

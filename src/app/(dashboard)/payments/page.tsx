"use client";

// Payments page — view payment history and membership tiers.
// Note: Only shows the admin user's own payment data.
// A future /api/admin/payments endpoint would be needed for all-user data.

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Badge, paymentStatusVariant } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { DetailModal } from "@/components/ui/DetailModal";
import type { Payment, MembershipTier } from "@/types";

// Payment admin = payment + relasi user
type AdminPayment = Payment & {
  user?: { id: string; name: string; email: string } | null;
  membershipTier?: string | null;
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<AdminPayment | null>(null);

  const fmtRp = (n: number | string) => "Rp " + Number(n || 0).toLocaleString("id-ID");
  const fmtDateTime = (s: string) =>
    new Date(s).toLocaleString("id-ID", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });

  useEffect(() => {
    async function load() {
      try {
        const [paymentsData, tiersData] = await Promise.all([
          apiFetch<AdminPayment[]>("/api/admin/payments"),
          apiFetch<MembershipTier[]>("/api/payment/tiers"),
        ]);
        setPayments(Array.isArray(paymentsData) ? paymentsData : []);
        setTiers(Array.isArray(tiersData) ? tiersData : []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Gagal memuat data.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Summary totals
  const totalSuccess = payments
    .filter((p) => p.status === "SUCCESS")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const totalPending = payments
    .filter((p) => p.status === "PENDING")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const columns: Column<AdminPayment>[] = [
    {
      header: "Pengguna",
      accessor: "user",
      render: (row) => (
        <div>
          <p className="text-text-high text-sm font-medium">{row.user?.name ?? "—"}</p>
          <p className="text-text-low text-xs">{row.user?.email ?? ""}</p>
        </div>
      ),
    },
    {
      header: "Jumlah",
      accessor: "amount",
      render: (row) => (
        <span className="text-gold font-semibold text-sm">
          Rp {Number(row.amount).toLocaleString("id-ID")}
        </span>
      ),
    },
    {
      header: "Tipe",
      accessor: "type",
      render: (row) => (
        <Badge variant={row.type === "MEMBERSHIP" ? "gold" : "info"}>
          {row.type}
        </Badge>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => (
        <Badge variant={paymentStatusVariant(row.status)}>{row.status}</Badge>
      ),
    },
    {
      header: "Midtrans ID",
      accessor: "midtransId",
      render: (row) => (
        <span className="text-text-low text-xs font-mono">
          {row.midtransId ?? "—"}
        </span>
      ),
    },
    {
      header: "Tanggal",
      accessor: "createdAt",
      render: (row) => (
        <span className="text-text-med text-xs">
          {new Date(row.createdAt).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page header ──────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-serif text-text-high">Payments</h1>
        <p className="text-text-med text-sm mt-0.5">
          Riwayat transaksi pembayaran.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-danger/10 border border-danger/25 text-danger text-sm">
          <AlertTriangle size={16} className="inline shrink-0" /> {error}
        </div>
      )}

      {/* ── Summary cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-1 border border-neutral-200 rounded-xl p-4 text-center">
          <p className="text-text-low text-xs uppercase tracking-wider mb-1">Total Transaksi</p>
          <p className="text-gold text-3xl font-serif font-bold">{payments.length}</p>
        </div>
        <div className="bg-surface-1 border border-success/30 rounded-xl p-4 text-center">
          <p className="text-text-low text-xs uppercase tracking-wider mb-1">Total Berhasil</p>
          <p className="text-success text-2xl font-serif font-bold">
            Rp {totalSuccess.toLocaleString("id-ID")}
          </p>
        </div>
        <div className="bg-surface-1 border border-warning/30 rounded-xl p-4 text-center">
          <p className="text-text-low text-xs uppercase tracking-wider mb-1">Total Pending</p>
          <p className="text-warning text-2xl font-serif font-bold">
            Rp {totalPending.toLocaleString("id-ID")}
          </p>
        </div>
      </div>

      {/* ── Payment history table ─────────────────────────────────────── */}
      <div className="bg-surface-1 border border-neutral-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-neutral-200">
          <h2 className="text-text-high font-serif text-lg">Riwayat Transaksi</h2>
        </div>
        <DataTable
          columns={columns}
          data={payments}
          onRowClick={setSelected}
          emptyMessage="Belum ada transaksi"
          emptyDescription="Transaksi pembayaran akan muncul di sini."
        />
      </div>

      {/* ── Membership tiers ──────────────────────────────────────────── */}
      {tiers.length > 0 && (
        <div>
          <h2 className="text-text-med text-sm font-semibold uppercase tracking-wider mb-3">
            Paket Membership Tersedia
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {tiers.map((tier) => (
              <div
                key={tier.tier}
                className="bg-surface-1 border border-neutral-200 rounded-xl p-4"
              >
                <p className="text-gold font-semibold text-sm">{tier.tier}</p>
                <p className="text-text-high font-serif text-xl font-bold mt-1">
                  Rp {tier.amount.toLocaleString("id-ID")}
                </p>
                <p className="text-text-low text-xs mt-1">{tier.label}</p>
                <p className="text-text-med text-xs mt-0.5">{tier.durationDays} hari</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <DetailModal
        open={!!selected}
        title="Detail Transaksi"
        subtitle={selected?.id}
        onClose={() => setSelected(null)}
        rows={
          selected
            ? [
                { label: "Pengguna", value: selected.user?.name ?? "—" },
                { label: "Email", value: selected.user?.email ?? "—" },
                { label: "Jumlah", value: fmtRp(selected.amount) },
                { label: "Tipe", value: <Badge variant={selected.type === "MEMBERSHIP" ? "gold" : "info"}>{selected.type}</Badge> },
                { label: "Status", value: <Badge variant={paymentStatusVariant(selected.status)}>{selected.status}</Badge> },
                { label: "Tier", value: selected.membershipTier ?? "—" },
                { label: "Midtrans ID", value: <span className="font-mono text-xs">{selected.midtransId ?? "—"}</span> },
                { label: "ID Transaksi", value: <span className="font-mono text-xs">{selected.id}</span> },
                { label: "Tanggal", value: fmtDateTime(selected.createdAt) },
              ]
            : []
        }
      />
    </div>
  );
}

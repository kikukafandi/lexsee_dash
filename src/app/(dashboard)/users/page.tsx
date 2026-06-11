"use client";

// Users page — lists all platform users from GET /api/admin/users.
// Features: stat cards, search, membership tier filter, paginated DataTable.

import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";
import { Badge, roleVariant } from "@/components/ui/Badge";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import type { AdminUser, AdminUsersResponse } from "@/types";

const PAGE_SIZE = 20;

type MembershipFilter = "ALL" | "FREE" | "SILVER" | "GOLD" | "PLATINUM";

/** Maps a membership tier to a badge variant. */
function membershipVariant(
  tier: AdminUser["membershipTier"]
): "info" | "gold" | "warning" | "default" {
  if (tier === "SILVER") return "info";
  if (tier === "GOLD") return "gold";
  if (tier === "PLATINUM") return "warning";
  return "default"; // FREE
}

/** Formats an ISO date string to a readable Indonesian date, or returns "—". */
function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Column definitions for DataTable<AdminUser>
const COLUMNS: Column<AdminUser>[] = [
  {
    header: "Pengguna",
    accessor: "name",
    render: (row) => (
      <div>
        <p className="text-text-high font-medium">{row.name}</p>
        <p className="text-text-low text-xs">{row.email}</p>
      </div>
    ),
  },
  {
    header: "Role",
    accessor: "role",
    render: (row) => (
      <Badge variant={roleVariant(row.role)}>{row.role}</Badge>
    ),
    width: "w-28",
  },
  {
    header: "Keanggotaan",
    accessor: "membershipTier",
    render: (row) => (
      <Badge variant={membershipVariant(row.membershipTier)}>
        {row.membershipTier}
      </Badge>
    ),
    width: "w-32",
  },
  {
    header: "Pembayaran Terakhir",
    accessor: "lastPaymentAt",
    render: (row) => (
      <span className="text-text-med text-sm">{formatDate(row.lastPaymentAt)}</span>
    ),
    width: "w-40",
  },
  {
    header: "Bergabung",
    accessor: "createdAt",
    render: (row) => (
      <span className="text-text-med text-sm">{formatDate(row.createdAt)}</span>
    ),
    width: "w-36",
  },
];

export default function UsersPage() {
  const [data, setData] = useState<AdminUsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter / search state
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<MembershipFilter>("ALL");
  const [page, setPage] = useState(1);

  // Fetch on mount
  useEffect(() => {
    apiFetch<AdminUsersResponse>("/api/admin/users")
      .then(setData)
      .catch((err: unknown) =>
        setError(
          err instanceof Error ? err.message : "Gagal memuat data pengguna."
        )
      )
      .finally(() => setLoading(false));
  }, []);

  // Derived stat values
  const stats = useMemo(() => {
    if (!data) return { total: 0, subscribed: 0, free: 0, admin: 0 };
    const { users, summary } = data;
    const free = summary.byMembership["FREE"] ?? 0;
    const subscribed = summary.total - free;
    const admin = users.filter((u) => u.role === "ADMIN").length;
    return { total: summary.total, subscribed, free, admin };
  }, [data]);

  // Client-side filtering
  const filteredUsers = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.users.filter((u) => {
      const matchesSearch =
        q === "" ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);
      const matchesTier =
        tierFilter === "ALL" || u.membershipTier === tierFilter;
      return matchesSearch && matchesTier;
    });
  }, [data, search, tierFilter]);

  // Reset to page 1 when filter/search changes
  useEffect(() => {
    setPage(1);
  }, [search, tierFilter]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const pageSlice = filteredUsers.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  // Loading state
  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-serif text-text-high">Pengguna</h1>
        <p className="text-text-med text-sm mt-0.5">
          Manajemen seluruh pengguna platform Lexsee.
        </p>
      </div>

      {/* ── Error banner ──────────────────────────────────────────────────── */}
      {error && (
        <div className="p-3 rounded-lg bg-danger/10 border border-danger/25 text-danger text-sm">
          {error}
        </div>
      )}

      {/* ── Stat cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-surface-1 border border-gold/25 rounded-xl p-5">
          <p className="text-text-low text-xs uppercase tracking-wider mb-1">
            Total Pengguna
          </p>
          <p className="text-text-high text-2xl font-serif font-semibold">
            {stats.total}
          </p>
        </div>

        {/* Subscribed */}
        <div className="bg-surface-1 border border-gold/25 rounded-xl p-5">
          <p className="text-text-low text-xs uppercase tracking-wider mb-1">
            Berlangganan
          </p>
          <p className="text-success text-2xl font-serif font-semibold">
            {stats.subscribed}
          </p>
        </div>

        {/* Free */}
        <div className="bg-surface-1 border border-gold/25 rounded-xl p-5">
          <p className="text-text-low text-xs uppercase tracking-wider mb-1">
            Free
          </p>
          <p className="text-text-med text-2xl font-serif font-semibold">
            {stats.free}
          </p>
        </div>

        {/* Admin */}
        <div className="bg-surface-1 border border-gold/25 rounded-xl p-5">
          <p className="text-text-low text-xs uppercase tracking-wider mb-1">
            Admin
          </p>
          <p className="text-gold text-2xl font-serif font-semibold">
            {stats.admin}
          </p>
        </div>
      </div>

      {/* ── Table card ────────────────────────────────────────────────────── */}
      <div className="bg-surface-1 border border-gold/25 rounded-xl">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 p-5 border-b border-gold/15">
          {/* Search */}
          <input
            type="text"
            placeholder="Cari nama atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-surface-2 border border-gold/25 rounded-lg px-3 py-2 text-text-high text-sm focus:outline-none focus:border-gold/60"
          />

          {/* Tier filter */}
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value as MembershipFilter)}
            className="bg-surface-2 border border-gold/25 rounded-lg px-3 py-2 text-text-high text-sm focus:outline-none focus:border-gold/60"
          >
            <option value="ALL">Semua Tier</option>
            <option value="FREE">FREE</option>
            <option value="SILVER">SILVER</option>
            <option value="GOLD">GOLD</option>
            <option value="PLATINUM">PLATINUM</option>
          </select>
        </div>

        {/* Filtered count */}
        <div className="px-5 py-2 border-b border-gold/10">
          <p className="text-text-low text-xs">
            Menampilkan{" "}
            <span className="text-text-med font-semibold">
              {filteredUsers.length}
            </span>{" "}
            dari{" "}
            <span className="text-text-med font-semibold">{stats.total}</span>{" "}
            pengguna
          </p>
        </div>

        {/* Table */}
        <DataTable<AdminUser>
          columns={COLUMNS}
          data={pageSlice}
          loading={false}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          emptyMessage="Tidak ada pengguna ditemukan"
          emptyDescription="Coba ubah filter atau kata kunci pencarian."
        />
      </div>
    </div>
  );
}

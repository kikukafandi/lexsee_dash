"use client";

// Vouchers — CRUD kode diskon. Data & validasi ada di backend (PricingService).

import { useEffect, useState } from "react";
import { AlertTriangle, Plus, Edit, Trash2, Ticket } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { Badge } from "@/components/ui/Badge";
import { VoucherForm, type Voucher } from "@/components/features/vouchers/VoucherForm";

const SCOPE_LABELS: Record<Voucher["scope"], string> = {
  ALL: "Semua",
  MEMBERSHIP: "Membership",
  BOOK: "Buku",
  WEBINAR: "Webinar",
  AI_FEATURE: "Kuota AI",
};

function formatRp(n: number): string {
  return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
}

function discountLabel(v: Voucher): string {
  const value = Number(v.value);
  return v.type === "PERCENT" ? `${value}%` : formatRp(value);
}

function validityLabel(v: Voucher): string {
  const from = v.validFrom ? String(v.validFrom).slice(0, 10) : null;
  const until = v.validUntil ? String(v.validUntil).slice(0, 10) : null;
  if (!from && !until) return "Tanpa batas";
  return `${from ?? "…"} → ${until ?? "…"}`;
}

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selected, setSelected] = useState<Voucher | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Voucher[]>("/api/admin/vouchers");
      setVouchers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat voucher.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openForm = (v: Voucher | null = null) => {
    setSelected(v);
    setIsFormOpen(true);
  };

  const handleDelete = async (v: Voucher) => {
    if (!window.confirm(`Hapus voucher "${v.code}"?`)) return;
    try {
      await apiFetch(`/api/admin/vouchers/${v.id}`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus voucher.");
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-serif text-text-high">Voucher</h1>
          <p className="text-text-med text-sm mt-0.5">
            Kelola kode diskon. Diskon diterapkan sebelum pajak saat checkout.
          </p>
        </div>
        <button onClick={() => openForm()} className="btn btn-primary btn-sm shrink-0">
          <Plus size={16} />
          Buat Voucher
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-danger/10 border border-danger/25 text-danger text-sm">
          <AlertTriangle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {vouchers.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-text-low">
          <Ticket size={32} className="opacity-40" />
          <p className="text-sm">Belum ada voucher.</p>
        </div>
      ) : (
        <div className="bg-surface-1 border border-neutral-200 rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-[820px]">
            <thead>
              <tr className="border-b border-neutral-200">
                {["Kode", "Diskon", "Berlaku Untuk", "Pemakaian", "Masa Berlaku", "Status", ""].map((h) => (
                  <th key={h} className="text-left text-text-med text-xs font-semibold uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vouchers.map((v, idx) => (
                <tr key={v.id} className={idx % 2 === 0 ? "bg-transparent" : "bg-surface-2/40"}>
                  <td className="px-4 py-3">
                    <span className="font-mono font-semibold text-text-high">{v.code}</span>
                    {v.description && <p className="text-xs text-text-low mt-0.5">{v.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-gold font-semibold">{discountLabel(v)}</td>
                  <td className="px-4 py-3 text-text-med">{SCOPE_LABELS[v.scope]}</td>
                  <td className="px-4 py-3 text-text-med">
                    {v.redeemedCount}
                    {v.maxRedemptions != null ? ` / ${v.maxRedemptions}` : ""}
                  </td>
                  <td className="px-4 py-3 text-text-med text-xs">{validityLabel(v)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={v.isActive ? "gold" : "default"}>{v.isActive ? "Aktif" : "Nonaktif"}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openForm(v)} className="btn btn-ghost btn-sm text-text-med hover:bg-neutral-100 hover:text-gold">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleDelete(v)} className="btn btn-ghost btn-sm text-danger/70 hover:bg-danger/10 hover:text-danger">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <VoucherForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={fetchData}
        voucher={selected}
      />
    </div>
  );
}

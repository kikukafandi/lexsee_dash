"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Edit, Trash2, AlertTriangle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { Badge } from "@/components/ui/Badge";
import { ProductForm } from "@/components/features/ai-store/ProductForm";
import type { AiFeatureProduct } from "@/types";

function formatRp(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

export default function AiStorePage() {
  const [products, setProducts] = useState<AiFeatureProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AiFeatureProduct | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<AiFeatureProduct[]>("/api/admin/ai-products");
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat produk");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus paket ini?")) return;
    try {
      await apiFetch(`/api/admin/ai-products/${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus");
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif text-text-high">Kuota AI</h1>
          <p className="text-sm text-text-med">Kelola paket & harga fitur AI pay-per-use.</p>
        </div>
        <button
          onClick={() => { setEditing(null); setFormOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-maroon text-white hover:opacity-90"
        >
          <Plus size={16} /> Tambah Paket
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-danger/10 border border-danger/25 text-danger text-sm">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <div className="bg-surface-1 border border-neutral-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-text-med uppercase text-xs tracking-wider">
            <tr>
              <th className="text-left px-4 py-3">Fitur</th>
              <th className="text-left px-4 py-3">Label</th>
              <th className="text-right px-4 py-3">Kuota</th>
              <th className="text-right px-4 py-3">Harga</th>
              <th className="text-center px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-neutral-200">
                <td className="px-4 py-3 text-text-med font-mono text-xs">{p.featureKey}</td>
                <td className="px-4 py-3 text-text-high">{p.label}</td>
                <td className="px-4 py-3 text-right text-text-high">
                  {p.featureKey === "plagiarism" ? `${p.quota.toLocaleString("id-ID")} kata` : `${p.quota}x`}
                </td>
                {/* effectivePrice = harga yang benar-benar ditagih; untuk paket
                    berbasis modal, kolom price mentah bukan harga jualnya. */}
                <td className="px-4 py-3 text-right text-gold">
                  {formatRp(p.effectivePrice ?? Number(p.price))}
                  {p.costPrice != null && (
                    <span className="block text-xs text-text-low font-normal">
                      modal {formatRp(Number(p.costPrice))}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge variant={p.isActive ? "info" : "default"}>{p.isActive ? "Aktif" : "Nonaktif"}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => { setEditing(p); setFormOpen(true); }}
                      className="p-1.5 rounded-md hover:bg-surface-2 text-text-med" aria-label="Edit">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(p.id)}
                      className="p-1.5 rounded-md hover:bg-danger/10 text-danger" aria-label="Hapus">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-text-med">Belum ada paket.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <ProductForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={load}
        product={editing}
      />
    </div>
  );
}

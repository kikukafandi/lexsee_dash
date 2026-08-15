"use client";

// Settings — konfigurasi harga global: keuntungan, tarif pajak & biaya admin.
// Sumber kebenaran ada di backend (PricingConfig). Pajak dihitung dari harga
// setelah diskon; biaya admin fixed tanpa pajak.
//
// Keuntungan dipakai paket AI yang mengisi modal: harga jual = modal x
// (1 + keuntungan), dibulatkan ke atas ke kelipatan seribu. Mengubahnya di
// sini menggerakkan semua paket tersebut sekaligus, tanpa deploy.

import { useEffect, useState } from "react";
import { AlertTriangle, Check, Save } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { PageLoader, LoadingSpinner } from "@/components/ui/LoadingSpinner";

type PricingConfig = {
  taxRate: number | string;
  taxEnabled: boolean;
  adminFee: number | string;
  marginRate: number | string;
};

function formatRp(n: number): string {
  return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
}

export default function SettingsPage() {
  const [marginPercent, setMarginPercent] = useState(30);
  const [taxPercent, setTaxPercent] = useState(11);
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [adminFee, setAdminFee] = useState(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const c = await apiFetch<PricingConfig>("/api/admin/pricing-config");
        setMarginPercent(Number(c.marginRate) * 100);
        setTaxPercent(Number(c.taxRate) * 100);
        setTaxEnabled(c.taxEnabled);
        setAdminFee(Number(c.adminFee));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat konfigurasi harga.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await apiFetch("/api/admin/pricing-config", {
        method: "PUT",
        body: JSON.stringify({
          marginRate: marginPercent / 100,
          taxRate: taxPercent / 100,
          taxEnabled,
          adminFee,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan konfigurasi.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  // Contoh modal: tagihan Copyscape untuk paket 10.000 kata.
  const sampleModal = 18200;
  const sampleJual = Math.ceil((sampleModal * (1 + marginPercent / 100)) / 1000) * 1000;

  // Contoh perhitungan untuk harga dasar Rp100.000 (tanpa diskon)
  const sampleBase = 100000;
  const sampleTax = taxEnabled ? Math.round(sampleBase * (taxPercent / 100)) : 0;
  const sampleTotal = sampleBase + sampleTax + adminFee;

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-serif text-text-high">Pengaturan Harga</h1>
        <p className="text-text-med text-sm mt-0.5">
          Tarif pajak & biaya admin yang berlaku untuk semua checkout (membership, buku, webinar, kuota AI).
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-danger/10 border border-danger/25 text-danger text-sm">
          <AlertTriangle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-surface-1 border border-neutral-200 rounded-xl p-6 flex flex-col gap-6">
        {/* Pajak aktif */}
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              checked={taxEnabled}
              onChange={(e) => setTaxEnabled(e.target.checked)}
              className="peer shrink-0 w-5 h-5 border-2 border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-gold/20 bg-transparent checked:bg-gold checked:border-gold appearance-none transition-colors"
            />
            <svg className="absolute left-[3px] top-[3px] w-3.5 h-3.5 text-surface-1 pointer-events-none opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-text-high group-hover:text-gold transition-colors">Pajak Aktif</span>
            <span className="text-xs text-text-low">Matikan untuk tidak membebankan pajak sama sekali</span>
          </div>
        </label>

        {/* Keuntungan */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-high">Keuntungan (%)</label>
          <input
            type="number"
            step="1"
            min={0}
            max={500}
            value={marginPercent}
            onChange={(e) => setMarginPercent(Number(e.target.value))}
            className="w-full bg-surface-2 border border-neutral-200 rounded-lg px-3 py-2 text-sm text-text-high focus:outline-none focus:border-maroon focus:ring-1 focus:ring-gold/50 transition-colors"
          />
          <p className="text-xs text-text-low">
            Berlaku untuk paket AI yang mengisi modal. Modal {formatRp(sampleModal)} jadi{" "}
            <span className="text-text-high font-medium">{formatRp(sampleJual)}</span> — untung{" "}
            {formatRp(sampleJual - sampleModal)}. Paket bisa menetapkan persentasenya sendiri.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Tarif pajak */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-high">Tarif Pajak (%)</label>
            <input
              type="number"
              step="0.1"
              min={0}
              max={100}
              value={taxPercent}
              disabled={!taxEnabled}
              onChange={(e) => setTaxPercent(Number(e.target.value))}
              className="w-full bg-surface-2 border border-neutral-200 rounded-lg px-3 py-2 text-sm text-text-high focus:outline-none focus:border-maroon focus:ring-1 focus:ring-gold/50 transition-colors disabled:opacity-50"
            />
            <p className="text-xs text-text-low">Mis. 11 untuk PPN 11%. Dihitung dari harga setelah diskon.</p>
          </div>

          {/* Biaya admin */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-high">Biaya Admin (Rp)</label>
            <input
              type="number"
              step="500"
              min={0}
              value={adminFee}
              onChange={(e) => setAdminFee(Number(e.target.value))}
              className="w-full bg-surface-2 border border-neutral-200 rounded-lg px-3 py-2 text-sm text-text-high focus:outline-none focus:border-maroon focus:ring-1 focus:ring-gold/50 transition-colors"
            />
            <p className="text-xs text-text-low">Nominal tetap, ditambahkan di akhir tanpa pajak.</p>
          </div>
        </div>

        {/* Preview perhitungan */}
        <div className="rounded-lg bg-surface-2 border border-neutral-100 p-4 text-sm">
          <p className="text-text-med font-semibold uppercase tracking-wider text-xs mb-3">
            Contoh (harga dasar {formatRp(sampleBase)}, tanpa diskon)
          </p>
          <div className="space-y-1.5">
            <div className="flex justify-between"><span className="text-text-med">Harga dasar</span><span className="text-text-high">{formatRp(sampleBase)}</span></div>
            <div className="flex justify-between"><span className="text-text-med">Pajak ({taxEnabled ? taxPercent : 0}%)</span><span className="text-text-high">{formatRp(sampleTax)}</span></div>
            <div className="flex justify-between"><span className="text-text-med">Biaya admin</span><span className="text-text-high">{formatRp(adminFee)}</span></div>
            <div className="flex justify-between border-t border-neutral-200 pt-1.5 mt-1.5"><span className="text-text-high font-semibold">Total</span><span className="text-gold font-semibold">{formatRp(sampleTotal)}</span></div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-gold">
              <Check size={16} /> Tersimpan
            </span>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-medium text-surface-1 bg-gold hover:bg-maroon-dark transition-colors disabled:opacity-50 min-w-[160px] flex items-center justify-center gap-2"
          >
            {saving ? <LoadingSpinner size="sm" /> : (<><Save size={16} /> Simpan Perubahan</>)}
          </button>
        </div>
      </div>
    </div>
  );
}

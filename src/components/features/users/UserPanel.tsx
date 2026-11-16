"use client";

// UserPanel — detail satu pengguna + ubah keanggotaan dan peran.
// Memanggil PATCH /api/admin/users/:id. Peran Admin dan Ahli Hukum tidak bisa
// diubah dari sini (Ahli Hukum lewat persetujuan pengajuan).

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { label, pesanGalat } from "@/lib/labels";
import { DetailModal } from "@/components/ui/DetailModal";
import { Select } from "@/components/ui/Select";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import type { AdminUser } from "@/types";

type Tier = AdminUser["membershipTier"];
type PeranBoleh = "USER" | "PREMIUM" | "SALES";

const TIER_OPSI: { value: Tier; label: string }[] = [
  { value: "FREE", label: "Tanpa keanggotaan" },
  { value: "SILVER", label: "Silver" },
  { value: "GOLD", label: "Gold" },
  { value: "PLATINUM", label: "Platinum" },
];
const PERAN_OPSI: { value: PeranBoleh; label: string }[] = [
  { value: "USER", label: "Pengguna" },
  { value: "PREMIUM", label: "Premium" },
  { value: "SALES", label: "Sales" },
];

const inputCls =
  "w-full bg-surface-2 border border-neutral-200 rounded-lg px-3 py-2 text-sm text-text-high focus:outline-none focus:border-maroon focus:ring-1 focus:ring-gold/50";
const tombolCls =
  "px-4 py-2 rounded-lg bg-maroon text-white text-sm font-semibold hover:bg-maroon-dark transition-colors disabled:opacity-50";

function tgl(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—";
}
/** ISO → nilai <input type="date"> (YYYY-MM-DD, zona lokal). */
function keInputTanggal(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

type Props = {
  user: AdminUser;
  onClose: () => void;
  onSaved: (u: AdminUser, pesan: string) => void;
};

export function UserPanel({ user, onClose, onSaved }: Props) {
  const { confirm, dialog } = useConfirm();
  const [tier, setTier] = useState<Tier>(user.membershipTier);
  const [akhir, setAkhir] = useState(keInputTanggal(user.membershipTier === "FREE" ? null : user.membershipEndsAt));
  const [peran, setPeran] = useState<string>(user.role);
  const [busy, setBusy] = useState(false);
  const [galat, setGalat] = useState("");

  const peranTerkunci = user.role === "ADMIN" || user.role === "EXPERT_HUKUM";

  async function kirim(body: Record<string, unknown>, pesan: string) {
    const res = await apiFetch<Partial<AdminUser>>(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    onSaved({ ...user, ...res } as AdminUser, pesan);
  }

  async function simpanKeanggotaan() {
    setGalat("");
    if (tier !== "FREE" && !akhir) {
      setGalat("Isi tanggal berakhir keanggotaan.");
      return;
    }
    setBusy(true);
    try {
      // Tanggal berakhir dihitung sampai akhir hari yang dipilih.
      const body =
        tier === "FREE"
          ? { membershipTier: null }
          : { membershipTier: tier, membershipEndsAt: new Date(`${akhir}T23:59:59`).toISOString() };
      await kirim(body, "Keanggotaan disimpan.");
    } catch (err) {
      setGalat(pesanGalat(err, "menyimpan keanggotaan"));
    } finally {
      setBusy(false);
    }
  }

  function simpanPeran() {
    setGalat("");
    confirm({
      title: "Ubah peran pengguna",
      confirmLabel: "Ubah peran",
      aksi: "mengubah peran",
      message: `Peran ${user.name} akan diubah dari ${label("role", user.role)} menjadi ${label("role", peran)}. Berlaku setelah ${user.name} login ulang.`,
      onConfirm: () => kirim({ role: peran }, "Peran diubah."),
    });
  }

  const tierBerubah =
    tier !== user.membershipTier ||
    (tier !== "FREE" && akhir !== keInputTanggal(user.membershipEndsAt));

  return (
    <>
      <DetailModal
        open
        title={user.name}
        subtitle={user.email}
        onClose={onClose}
        rows={[
          { label: "Peran", value: label("role", user.role) },
          { label: "Keanggotaan aktif", value: label("tier", user.membershipTier) },
          { label: "Berlaku sampai", value: user.membershipTier === "FREE" ? "—" : tgl(user.membershipEndsAt) },
          { label: "Pembayaran terakhir", value: tgl(user.lastPaymentAt) },
          { label: "Bergabung", value: tgl(user.createdAt) },
        ]}
      >
        <section className="mt-5 pt-4 border-t border-neutral-200 space-y-3">
          <h4 className="text-sm font-semibold text-text-high">Ubah keanggotaan</h4>
          <p className="text-xs text-text-low">
            Untuk hadiah, kompensasi, atau uji coba. Tidak membuat catatan pembayaran.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select<Tier> label="Keanggotaan" showLabel value={tier} onChange={setTier} options={TIER_OPSI} />
            {tier !== "FREE" && (
              <label className="block">
                <span className="block text-xs text-text-med mb-1">Berlaku sampai</span>
                <input type="date" value={akhir} onChange={(e) => setAkhir(e.target.value)} className={inputCls} />
              </label>
            )}
          </div>
          <div className="flex justify-end">
            <button type="button" className={tombolCls} disabled={busy || !tierBerubah} onClick={simpanKeanggotaan}>
              {busy ? "Menyimpan…" : "Simpan keanggotaan"}
            </button>
          </div>
        </section>

        <section className="mt-5 pt-4 border-t border-neutral-200 space-y-3">
          <h4 className="text-sm font-semibold text-text-high">Peran</h4>
          {peranTerkunci ? (
            <p className="text-xs text-text-low">
              Peran {label("role", user.role)} tidak bisa diubah dari dashboard.
            </p>
          ) : (
            <>
              <p className="text-xs text-text-low">
                Peran baru berlaku setelah pengguna keluar lalu masuk lagi di aplikasi.
              </p>
              <Select<string>
                label="Peran"
                value={peran}
                onChange={setPeran}
                options={PERAN_OPSI}
              />
              <div className="flex justify-end">
                <button type="button" className={tombolCls} disabled={peran === user.role} onClick={simpanPeran}>
                  Ubah peran
                </button>
              </div>
            </>
          )}
        </section>

        {galat && (
          <p role="alert" className="mt-4 text-sm text-danger">
            {galat}
          </p>
        )}
      </DetailModal>
      {dialog}
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiFetch } from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { AlertTriangle } from "lucide-react";

export type Voucher = {
  id: string;
  code: string;
  description?: string | null;
  type: "PERCENT" | "FIXED";
  value: number | string;
  scope: "ALL" | "MEMBERSHIP" | "BOOK" | "WEBINAR" | "AI_FEATURE";
  minAmount?: number | string | null;
  maxRedemptions?: number | null;
  redeemedCount: number;
  perUserLimit: number;
  validFrom?: string | null;
  validUntil?: string | null;
  isActive: boolean;
  createdAt: string;
};

const optionalNumber = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.coerce.number().min(0).optional(),
);

const optionalDate = z.preprocess(
  (v) => (v === "" || v === null ? undefined : v),
  z.string().optional(),
);

const voucherSchema = z
  .object({
    code: z.string().min(3, "Kode minimal 3 karakter"),
    description: z.string().optional(),
    type: z.enum(["PERCENT", "FIXED"]),
    value: z.coerce.number().min(0, "Nilai tidak boleh negatif"),
    scope: z.enum(["ALL", "MEMBERSHIP", "BOOK", "WEBINAR", "AI_FEATURE"]),
    minAmount: optionalNumber,
    maxRedemptions: optionalNumber,
    perUserLimit: z.coerce.number().int().min(0).default(1),
    validFrom: optionalDate,
    validUntil: optionalDate,
    isActive: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.type === "PERCENT" && data.value > 100) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["value"], message: "Persen maksimal 100" });
    }
  });

type VoucherFormValues = z.input<typeof voucherSchema>;

const SCOPE_LABELS: Record<Voucher["scope"], string> = {
  ALL: "Semua produk",
  MEMBERSHIP: "Membership",
  BOOK: "Buku",
  WEBINAR: "Webinar",
  AI_FEATURE: "Kuota AI",
};

const inputCls =
  "w-full bg-surface-2 border border-neutral-200 rounded-lg px-3 py-2 text-sm text-text-high focus:outline-none focus:border-maroon focus:ring-1 focus:ring-gold/50 transition-colors placeholder:text-text-low/50";

function toDateInput(v?: string | null): string {
  return v ? String(v).slice(0, 10) : "";
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  voucher?: Voucher | null;
};

export function VoucherForm({ isOpen, onClose, onSuccess, voucher }: Props) {
  const [error, setError] = useState("");
  const isEditMode = !!voucher;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<VoucherFormValues>({
    resolver: zodResolver(voucherSchema),
  });

  const type = watch("type");

  useEffect(() => {
    if (isOpen) {
      reset({
        code: voucher?.code ?? "",
        description: voucher?.description ?? "",
        type: voucher?.type ?? "PERCENT",
        value: voucher?.value != null ? Number(voucher.value) : 0,
        scope: voucher?.scope ?? "ALL",
        minAmount: voucher?.minAmount != null ? Number(voucher.minAmount) : ("" as any),
        maxRedemptions: voucher?.maxRedemptions ?? ("" as any),
        perUserLimit: voucher?.perUserLimit ?? 1,
        validFrom: toDateInput(voucher?.validFrom),
        validUntil: toDateInput(voucher?.validUntil),
        isActive: voucher?.isActive ?? true,
      });
      setError("");
    }
  }, [isOpen, voucher, reset]);

  const onSubmit: SubmitHandler<any> = async (data) => {
    setError("");
    try {
      // Buang optional yang kosong agar lolos validasi @IsOptional backend
      const payload: Record<string, unknown> = { ...data };
      for (const k of ["description", "minAmount", "maxRedemptions", "validFrom", "validUntil"]) {
        if (payload[k] === "" || payload[k] === undefined || payload[k] === null) delete payload[k];
      }

      const endpoint = isEditMode ? `/api/admin/vouchers/${voucher!.id}` : "/api/admin/vouchers";
      await apiFetch(endpoint, {
        method: isEditMode ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? "Edit Voucher" : "Buat Voucher"}>
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 bg-surface-1 h-full overflow-y-auto">
        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-danger/10 border border-danger/25 text-danger text-sm">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-high">Kode Voucher</label>
            <input {...register("code")} className={inputCls} placeholder="DISKON10" />
            {errors.code && <p className="text-xs text-danger">{errors.code.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-high">Berlaku Untuk</label>
            <select {...register("scope")} className={inputCls}>
              {Object.entries(SCOPE_LABELS).map(([v, label]) => (
                <option key={v} value={v}>{label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-high">Tipe</label>
            <select {...register("type")} className={inputCls}>
              <option value="PERCENT">Persen (%)</option>
              <option value="FIXED">Nominal (Rp)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-high">
              {type === "FIXED" ? "Nilai Diskon (Rp)" : "Nilai Diskon (%)"}
            </label>
            <input type="number" step={type === "FIXED" ? "500" : "1"} {...register("value")} className={inputCls} placeholder="0" />
            {errors.value && <p className="text-xs text-danger">{errors.value.message as string}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-high">Min. Transaksi (Rp, opsional)</label>
            <input type="number" step="1000" {...register("minAmount")} className={inputCls} placeholder="Tanpa minimum" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-high">Kuota Total (opsional)</label>
            <input type="number" step="1" {...register("maxRedemptions")} className={inputCls} placeholder="Tak terbatas" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-high">Limit per User</label>
            <input type="number" step="1" {...register("perUserLimit")} className={inputCls} placeholder="1" />
            <p className="text-xs text-text-low">0 = tak terbatas per user</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-high">Deskripsi (opsional)</label>
            <input {...register("description")} className={inputCls} placeholder="Promo lebaran" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-high">Berlaku Dari (opsional)</label>
            <input type="date" {...register("validFrom")} className={inputCls} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-high">Berlaku Sampai (opsional)</label>
            <input type="date" {...register("validUntil")} className={inputCls} />
          </div>
        </div>

        <div className="mt-6 p-4 rounded-lg bg-surface-2 border border-neutral-100">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex items-center">
              <input type="checkbox" {...register("isActive")} className="peer shrink-0 w-5 h-5 border-2 border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-gold/20 bg-transparent checked:bg-gold checked:border-gold appearance-none transition-colors" />
              <svg className="absolute left-[3px] top-[3px] w-3.5 h-3.5 text-surface-1 pointer-events-none opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-text-high group-hover:text-gold transition-colors">Voucher Aktif</span>
              <span className="text-xs text-text-low">Bisa dipakai user saat checkout</span>
            </div>
          </label>
        </div>

        <div className="mt-8 pt-4 border-t border-neutral-100 flex flex-col-reverse sm:flex-row justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-text-med bg-surface-2 border border-neutral-200 hover:bg-neutral-100 hover:text-gold transition-colors">
            Kembali
          </button>
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg text-sm font-medium text-surface-1 bg-gold hover:bg-maroon-dark transition-colors disabled:opacity-50 min-w-[140px] flex items-center justify-center">
            {isSubmitting ? <LoadingSpinner size="sm" /> : (isEditMode ? "Simpan Perubahan" : "Buat Voucher")}
          </button>
        </div>
      </form>
    </Modal>
  );
}

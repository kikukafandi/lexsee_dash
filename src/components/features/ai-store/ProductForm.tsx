"use client";

import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiFetch } from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import { AlertTriangle } from "lucide-react";
import type { AiFeatureProduct, AiFeatureKey } from "@/types";

const FEATURE_OPTIONS: { value: AiFeatureKey; label: string }[] = [
  { value: "opinion", label: "AI Legal Opinion" },
  { value: "analyze-expert", label: "AI Analisis Pendapat Ahli" },
  { value: "compare", label: "AI Perbandingan" },
  { value: "analyze-verdict", label: "AI Analisis Putusan" },
  { value: "compliance", label: "AI Compliance Tracker" },
];

const productSchema = z.object({
  featureKey: z.enum(["opinion", "analyze-expert", "compare", "analyze-verdict", "compliance"]),
  label: z.string().min(3, "Label minimal 3 karakter"),
  quota: z.coerce.number().int().min(1, "Kuota minimal 1"),
  price: z.coerce.number().min(0, "Harga tidak boleh negatif"),
  isActive: z.boolean().default(true),
});

type ProductFormValues = z.infer<typeof productSchema>;

type ProductFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: AiFeatureProduct | null;
};

export function ProductForm({ isOpen, onClose, onSuccess, product }: ProductFormProps) {
  const [error, setError] = useState("");
  const isEditMode = !!product;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: { featureKey: "opinion", label: "", quota: 10, price: 25000, isActive: true },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        featureKey: product?.featureKey ?? "opinion",
        label: product?.label ?? "",
        quota: product?.quota ?? 10,
        price: product?.price ? Number(product.price) : 25000,
        isActive: product?.isActive ?? true,
      });
      setError("");
    }
  }, [isOpen, product, reset]);

  const onSubmit: SubmitHandler<ProductFormValues> = async (data) => {
    setError("");
    try {
      const endpoint = isEditMode ? `/api/admin/ai-products/${product!.id}` : "/api/admin/ai-products";
      await apiFetch(endpoint, { method: isEditMode ? "PUT" : "POST", body: JSON.stringify(data) });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  };

  const inputCls =
    "w-full bg-surface-2 border border-neutral-200 rounded-lg px-3 py-2 text-sm text-text-high focus:outline-none focus:border-maroon focus:ring-1 focus:ring-gold/50 transition-colors";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? "Edit Paket Kuota" : "Buat Paket Kuota"}>
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 bg-surface-1 h-full overflow-y-auto">
        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-danger/10 border border-danger/25 text-danger text-sm">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-high">Fitur</label>
            <select {...register("featureKey")} className={inputCls}>
              {FEATURE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {errors.featureKey && <p className="text-xs text-danger">{errors.featureKey.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-high">Label Paket</label>
            <input {...register("label")} className={inputCls} placeholder="e.g. Analisis Putusan 10x" />
            {errors.label && <p className="text-xs text-danger">{errors.label.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-high">Jumlah Kuota</label>
            <input type="number" {...register("quota")} className={inputCls} />
            {errors.quota && <p className="text-xs text-danger">{errors.quota.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-high">Harga (Rp)</label>
            <input type="number" {...register("price")} className={inputCls} />
            {errors.price && <p className="text-xs text-danger">{errors.price.message}</p>}
          </div>

          <label className="flex items-center gap-2 text-sm text-text-high md:col-span-2">
            <input type="checkbox" {...register("isActive")} className="accent-maroon" />
            Aktif (tampil di aplikasi)
          </label>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-neutral-200 text-text-med hover:bg-surface-2">
            Batal
          </button>
          <button type="submit" disabled={isSubmitting}
            className="px-4 py-2 text-sm rounded-lg bg-maroon text-white hover:opacity-90 disabled:opacity-50">
            {isSubmitting ? "Menyimpan..." : isEditMode ? "Simpan" : "Buat"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiFetch } from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { AlertTriangle } from "lucide-react";
import type { MembershipPlan } from "@/types";

const planSchema = z.object({
  name: z.string().min(3, "Nama plan minimal 3 karakter"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Harga tidak boleh negatif"),
  originalPrice: z.coerce.number().optional(),
  duration: z.enum(["MONTHLY", "YEARLY"]),
  isPopular: z.boolean().default(false),
  isActive: z.boolean().default(true),
  features: z.string(),
});

type PlanFormValues = z.infer<typeof planSchema>;

type PlanFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  plan?: MembershipPlan | null;
};

export function PlanForm({ isOpen, onClose, onSuccess, plan }: PlanFormProps) {
  const [error, setError] = useState("");
  const isEditMode = !!plan;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      originalPrice: undefined,
      duration: "MONTHLY",
      isPopular: false,
      isActive: true,
      features: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        name: plan?.name ?? "",
        description: plan?.description ?? "",
        price: plan?.price ? Number(plan.price) : 0,
        originalPrice: plan?.originalPrice ? Number(plan.originalPrice) : undefined,
        duration: plan?.duration ?? "MONTHLY",
        isPopular: plan?.isPopular ?? false,
        isActive: plan?.isActive ?? true,
        features: Array.isArray(plan?.features) ? plan.features.map((f: any) => typeof f === 'string' ? f : f.name).join("\n") : "",
      });
      setError("");
    }
  }, [isOpen, plan, reset]);

  const onSubmit: SubmitHandler<any> = async (data) => {
    setError("");
    try {
      const endpoint = isEditMode ? `/api/admin/membership-plans/${plan.id}` : "/api/admin/membership-plans";
      const method = isEditMode ? "PUT" : "POST";
      
      const payload = {
        ...data,
        features: data.features.split("\n").map((s: string) => s.trim()).filter(Boolean).map((name: string) => ({ name, included: true }))
      };

      await apiFetch(endpoint, {
        method,
        body: JSON.stringify(payload),
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEditMode ? "Edit Plan" : "Buat Plan Baru"}>
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 bg-surface-1 h-full overflow-y-auto">
        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-danger/10 border border-danger/25 text-danger text-sm">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-high">Nama Plan</label>
            <input 
              {...register("name")} 
              className="w-full bg-surface-2 border border-gold/15 rounded-lg px-3 py-2 text-sm text-text-high focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-colors placeholder:text-text-low/50"
              placeholder="e.g. Premium"
            />
            {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
          </div>

          {/* Duration */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-high">Durasi</label>
            <select 
              {...register("duration")} 
              className="w-full bg-surface-2 border border-gold/15 rounded-lg px-3 py-2 text-sm text-text-high focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-colors"
            >
              <option value="MONTHLY">Bulanan (Monthly)</option>
              <option value="YEARLY">Tahunan (Yearly)</option>
            </select>
          </div>

          {/* Price */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-high">Harga (Rp)</label>
            <input 
              type="number" 
              {...register("price")} 
              className="w-full bg-surface-2 border border-gold/15 rounded-lg px-3 py-2 text-sm text-text-high focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-colors placeholder:text-text-low/50"
              placeholder="0"
            />
            {errors.price && <p className="text-xs text-danger">{errors.price.message}</p>}
          </div>

          {/* Original Price */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-high">Harga Coret / Asli (Opsional)</label>
            <input 
              type="number" 
              {...register("originalPrice")} 
              className="w-full bg-surface-2 border border-gold/15 rounded-lg px-3 py-2 text-sm text-text-high focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-colors placeholder:text-text-low/50"
              placeholder="Kosongkan jika tidak ada diskon"
            />
            {errors.originalPrice && <p className="text-xs text-danger">{errors.originalPrice.message}</p>}
          </div>
        </div>

        {/* Description */}
        <div className="mt-5 flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-high">Deskripsi Singkat (Opsional)</label>
          <textarea 
            {...register("description")} 
            className="w-full bg-surface-2 border border-gold/15 rounded-lg px-3 py-2 text-sm text-text-high focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-colors placeholder:text-text-low/50 resize-none" 
            rows={2}
            placeholder="Tambahkan sedikit penjelasan mengenai plan ini..."
          ></textarea>
        </div>

        {/* Features */}
        <div className="mt-5 flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-high">Fitur (1 fitur per baris)</label>
          <textarea 
            {...register("features")} 
            className="w-full bg-surface-2 border border-gold/15 rounded-lg px-3 py-2 text-sm text-text-high focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-colors placeholder:text-text-low/50" 
            rows={5}
            placeholder="Akses semua fitur&#10;Analisis prioritas&#10;Support 24/7"
          ></textarea>
          <p className="text-xs text-text-low">Masukkan setiap fitur di baris yang baru.</p>
        </div>

        {/* Toggles */}
        <div className="mt-6 p-4 rounded-lg bg-surface-2 border border-gold/10 flex flex-col sm:flex-row gap-6">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex items-center">
              <input 
                type="checkbox" 
                {...register("isPopular")} 
                className="peer shrink-0 w-5 h-5 border-2 border-gold/30 rounded focus:outline-none focus:ring-2 focus:ring-gold/20 focus:ring-offset-0 bg-transparent checked:bg-gold checked:border-gold appearance-none transition-colors" 
              />
              <svg className="absolute left-[3px] top-[3px] w-3.5 h-3.5 text-surface-1 pointer-events-none opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-text-high group-hover:text-gold transition-colors">Tandai Populer</span>
              <span className="text-xs text-text-low">Berikan badge populer di plan ini</span>
            </div>
          </label>
          
          <div className="w-px bg-gold/10 hidden sm:block"></div>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex items-center">
              <input 
                type="checkbox" 
                {...register("isActive")} 
                className="peer shrink-0 w-5 h-5 border-2 border-gold/30 rounded focus:outline-none focus:ring-2 focus:ring-gold/20 focus:ring-offset-0 bg-transparent checked:bg-gold checked:border-gold appearance-none transition-colors" 
              />
              <svg className="absolute left-[3px] top-[3px] w-3.5 h-3.5 text-surface-1 pointer-events-none opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-text-high group-hover:text-gold transition-colors">Plan Aktif</span>
              <span className="text-xs text-text-low">Plan bisa digunakan oleh user</span>
            </div>
          </label>
        </div>

        {/* Actions */}
        <div className="mt-8 pt-4 border-t border-gold/10 flex flex-col-reverse sm:flex-row justify-end gap-3">
          <button type="button" onClick={handleClose} className="px-4 py-2 rounded-lg text-sm font-medium text-text-med bg-surface-2 border border-gold/20 hover:bg-gold/10 hover:text-gold transition-colors">
            Kembali
          </button>
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg text-sm font-medium text-surface-1 bg-gold hover:bg-gold/90 transition-colors disabled:opacity-50 min-w-[140px] flex items-center justify-center">
            {isSubmitting ? <LoadingSpinner size="sm" /> : (isEditMode ? "Simpan Perubahan" : "Buat Plan")}
          </button>
        </div>
      </form>
    </Modal>
  );
}

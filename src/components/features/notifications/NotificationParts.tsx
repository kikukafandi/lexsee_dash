"use client";

// Komponen kecil yang dipakai halaman daftar & detail notifikasi.
// Sengaja satu berkas: semuanya potongan presentasional pendek yang selalu
// dipakai bersama, dan sebagian hanya membungkus komponen UI yang sudah ada.

import { useEffect, useRef } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { metadataRows, notifMeta, type NotificationMetadata } from "@/lib/notifications";

/* ── Ikon sesuai jenis notifikasi ──────────────────────────────────────────── */

export function NotificationIcon({ type, size = "md" }: { type: string; size?: "sm" | "md" }) {
  const { icon: Icon, tone } = notifMeta(type);
  const box = size === "sm" ? "w-8 h-8 rounded-lg" : "w-11 h-11 rounded-xl";
  return (
    <span className={`${box} ${tone} flex items-center justify-center shrink-0`} aria-hidden="true">
      <Icon size={size === "sm" ? 16 : 20} />
    </span>
  );
}

/* ── Badge kategori & status baca ──────────────────────────────────────────── */

export function NotificationCategoryBadge({ type }: { type: string }) {
  const { category, tone } = notifMeta(type);
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border border-neutral-200 ${tone}`}
    >
      {category}
    </span>
  );
}

export function NotificationStatusBadge({ isRead }: { isRead: boolean }) {
  return (
    <Badge variant={isRead ? "default" : "gold"}>
      {isRead ? "Sudah dibaca" : "Belum dibaca"}
    </Badge>
  );
}

/* ── Kartu informasi terkait ───────────────────────────────────────────────── */

export type InfoRow = { label: string; value?: React.ReactNode };

/**
 * Menampilkan data terkait notifikasi: isi `metadata` dirender dinamis (label
 * diterjemahkan, nominal jadi Rupiah, tanggal jadi locale Indonesia), lalu
 * disusul baris tambahan dari `rows`. Baris kosong tidak pernah dirender, dan
 * object/array kompleks dilewati agar tidak muncul sebagai "[object Object]".
 */
export function NotificationInformationCard({
  title = "Informasi Terkait",
  metadata,
  rows = [],
}: {
  title?: string;
  metadata?: NotificationMetadata | null;
  rows?: InfoRow[];
}) {
  const fromMetadata: InfoRow[] = metadataRows(metadata).map((r) => ({
    label: r.label,
    value: r.value,
  }));
  const shown = [...fromMetadata, ...rows].filter(
    (r) => r.value !== null && r.value !== undefined && r.value !== "",
  );
  if (shown.length === 0) return null;

  return (
    <section className="bg-surface-1 border border-neutral-200 rounded-2xl p-4 sm:p-5">
      <h2 className="text-text-low text-xs font-semibold uppercase tracking-wider mb-3">{title}</h2>
      <dl className="divide-y divide-neutral-100">
        {shown.map((r, i) => (
          <div key={`${r.label}-${i}`} className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-2.5">
            <dt className="text-text-med text-sm shrink-0">{r.label}</dt>
            <dd className="text-text-high text-sm font-medium text-right break-words min-w-0">
              {r.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* ── Tombol tindakan lanjutan ──────────────────────────────────────────────── */

export function NotificationActionButton({
  label,
  href,
  variant = "primary",
}: {
  label: string;
  href: string;
  variant?: "primary" | "secondary";
}) {
  const style =
    variant === "primary"
      ? "bg-maroon text-white hover:bg-maroon-dark"
      : "bg-surface-1 border border-neutral-300 text-text-med hover:text-text-high";
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors w-full sm:w-auto ${style}`}
    >
      {label}
    </Link>
  );
}

/* ── Loading & error state ─────────────────────────────────────────────────── */

export function NotificationDetailSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Memuat notifikasi">
      <div className="bg-surface-1 border border-neutral-200 rounded-2xl p-4 sm:p-5 flex gap-4">
        <div className="w-11 h-11 rounded-xl bg-surface-3 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-32 rounded bg-surface-3" />
          <div className="h-3 w-48 rounded bg-surface-3" />
        </div>
      </div>
      <div className="bg-surface-1 border border-neutral-200 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="h-5 w-2/3 rounded bg-surface-3" />
        <div className="h-3 w-full rounded bg-surface-3" />
        <div className="h-3 w-5/6 rounded bg-surface-3" />
      </div>
      <div className="bg-surface-1 border border-neutral-200 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="h-3 w-40 rounded bg-surface-3" />
        <div className="h-3 w-full rounded bg-surface-3" />
      </div>
    </div>
  );
}

export function NotificationErrorState({
  title = "Gagal memuat notifikasi",
  description,
  onRetry,
}: {
  title?: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <div className="bg-surface-1 border border-neutral-200 rounded-2xl">
      <EmptyState
        icon={<AlertTriangle className="w-10 h-10 text-danger" />}
        title={title}
        description={description}
      />
      <div className="flex flex-col sm:flex-row justify-center gap-2 px-6 pb-8">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2.5 rounded-xl bg-maroon text-white text-sm font-semibold hover:bg-maroon-dark transition-colors"
          >
            Coba Lagi
          </button>
        )}
        <Link
          href="/notifications"
          className="px-4 py-2.5 rounded-xl border border-neutral-300 text-text-med text-sm font-semibold hover:text-text-high transition-colors text-center"
        >
          Ke Daftar Notifikasi
        </Link>
      </div>
    </div>
  );
}

/* ── Dialog konfirmasi hapus ───────────────────────────────────────────────── */

// Pakai <dialog> bawaan browser: fokus terkunci, Escape menutup, tanpa kode ekstra.
export function DeleteNotificationDialog({
  open,
  busy = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="hapus-notif-judul"
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      // Klik di area backdrop (target = dialog itu sendiri) menutup dialog.
      onClick={(e) => {
        if (e.target === ref.current) onCancel();
      }}
      className="m-auto w-full max-w-sm bg-surface-1 rounded-2xl border border-neutral-200 shadow-xl p-6 backdrop:bg-black/40"
    >
      <h2 id="hapus-notif-judul" className="text-text-high font-semibold text-lg">
        Hapus notifikasi?
      </h2>
      <p className="text-text-med text-sm mt-2">
        Notifikasi ini akan dihapus permanen dan tidak bisa dikembalikan.
      </p>
      <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <button
          onClick={onCancel}
          disabled={busy}
          className="px-4 py-2.5 rounded-xl border border-neutral-300 text-text-med text-sm font-semibold hover:text-text-high transition-colors disabled:opacity-50"
        >
          Batal
        </button>
        <button
          onClick={onConfirm}
          disabled={busy}
          className="px-4 py-2.5 rounded-xl bg-danger text-white text-sm font-semibold hover:bg-danger/90 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          {busy && <LoadingSpinner size="sm" className="border-white/40 border-t-white" />}
          Hapus
        </button>
      </div>
    </dialog>
  );
}

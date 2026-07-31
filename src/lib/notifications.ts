// src/lib/notifications.ts
// Sumber tunggal untuk tipe, metadata, dan format notifikasi admin.
// Dipakai bersama oleh bell di Topbar, halaman daftar, dan halaman detail.
//
// Prinsip: data dari backend selalu menang. Mapping di berkas ini hanya
// fallback untuk notifikasi lama (yang belum punya actionUrl/metadata) dan
// untuk kategori/ikon yang memang tidak dikirim backend.

import {
  AlertTriangle,
  Bell,
  CreditCard,
  FileText,
  Info,
  Package,
  Settings,
  ShieldAlert,
  UserCheck,
  type LucideIcon,
} from "lucide-react";

/** Detail tambahan khas tiap jenis notifikasi. Bentuknya bebas — dirender dinamis. */
export type NotificationMetadata = Record<string, unknown>;

export type AdminNotif = {
  id: string;
  type: string;
  title: string;
  body: string;
  /** Referensi generik ke entity mana pun, mis. "invoice" / "order". */
  entityType?: string | null;
  entityId?: string | null;
  metadata?: NotificationMetadata | null;
  /** Tujuan navigasi dari backend (path internal). */
  actionUrl?: string | null;
  actionLabel?: string | null;
  isRead: boolean;
  createdAt: string;
};

export type NotifFeed = { items: AdminNotif[]; unreadCount: number };

export type NotifAction = { label: string; url: string };

type NotifMeta = {
  category: string;
  icon: LucideIcon;
  /** Warna chip ikon — tetap dalam palet design system (maroon/status/netral). */
  tone: string;
  /** Fallback tindakan untuk notifikasi lama yang belum mengirim actionUrl. */
  action?: NotifAction;
};

const PAYMENTS: NotifAction = { label: "Lihat Pembayaran", url: "/payments" };
const INVOICES: NotifAction = { label: "Lihat Invoice", url: "/billing-invoices" };
const ORDERS: NotifAction = { label: "Lihat Pesanan", url: "/orders" };
const ACCOUNTS: NotifAction = { label: "Periksa Akun", url: "/users" };

// Kategori & ikon per jenis notifikasi. Tujuan navigasi di sini hanya cadangan;
// backend yang menentukan lewat actionUrl/actionLabel.
const META: Record<string, NotifMeta> = {
  EXPERT_APPLICATION: {
    category: "Pengajuan Ahli Hukum",
    icon: UserCheck,
    tone: "bg-maroon/10 text-maroon",
    action: { label: "Lihat Pengajuan", url: "/expert-applications" },
  },

  PAYMENT_RECEIVED: {
    category: "Pembayaran",
    icon: CreditCard,
    tone: "bg-success/10 text-success",
    action: PAYMENTS,
  },
  PAYMENT_FAILED: {
    category: "Pembayaran",
    icon: CreditCard,
    tone: "bg-danger/10 text-danger",
    action: PAYMENTS,
  },

  INVOICE_CREATED: {
    category: "Invoice",
    icon: FileText,
    tone: "bg-blue-500/10 text-blue-600",
    action: INVOICES,
  },
  INVOICE_PAID: {
    category: "Invoice",
    icon: FileText,
    tone: "bg-success/10 text-success",
    action: INVOICES,
  },
  INVOICE_OVERDUE: {
    category: "Invoice",
    icon: FileText,
    tone: "bg-warning/10 text-warning",
    action: INVOICES,
  },

  ORDER_CREATED: {
    category: "Pesanan",
    icon: Package,
    tone: "bg-blue-500/10 text-blue-600",
    action: ORDERS,
  },
  ORDER_UPDATED: {
    category: "Pesanan",
    icon: Package,
    tone: "bg-surface-3 text-text-med",
    action: ORDERS,
  },
  ORDER_CANCELLED: {
    category: "Pesanan",
    icon: Package,
    tone: "bg-danger/10 text-danger",
    action: ORDERS,
  },

  ACCOUNT_SECURITY: {
    category: "Keamanan",
    icon: ShieldAlert,
    tone: "bg-danger/10 text-danger",
    action: ACCOUNTS,
  },
  ACCOUNT_UPDATED: {
    category: "Informasi Akun",
    icon: Info,
    tone: "bg-blue-500/10 text-blue-600",
    action: ACCOUNTS,
  },

  SYSTEM_INFORMATION: {
    category: "Sistem",
    icon: Settings,
    tone: "bg-surface-3 text-text-med",
  },
  SYSTEM_WARNING: {
    category: "Sistem",
    icon: AlertTriangle,
    tone: "bg-warning/10 text-warning",
  },
};

/** Tipe yang belum dikenali tetap tampil rapi, tidak error. */
const FALLBACK: NotifMeta = {
  category: "Informasi",
  icon: Bell,
  tone: "bg-surface-3 text-text-med",
};

export function notifMeta(type: string): NotifMeta {
  return META[type] ?? FALLBACK;
}

/** Path internal saja — tolak URL eksternal/protocol-relative dari data lama. */
export function isSafeInternalPath(url: string): boolean {
  return /^\/(?![/\\])\S*$/.test(url);
}

/**
 * Tombol tindakan, berurutan:
 * 1. actionUrl + actionLabel dari backend
 * 2. fallback mapping berdasarkan `type`
 * 3. tidak ada tombol
 */
export function notifAction(n: AdminNotif): NotifAction | null {
  if (n.actionUrl && isSafeInternalPath(n.actionUrl)) {
    return { label: n.actionLabel?.trim() || "Buka", url: n.actionUrl };
  }
  return notifMeta(n.type).action ?? null;
}

/* ── Format nilai ──────────────────────────────────────────────────────────── */

/** "Rp5.000.000" — format Rupiah tanpa spasi & desimal, sesuai gaya aplikasi. */
export function formatRupiah(amount: number): string {
  return `Rp${Math.round(amount).toLocaleString("id-ID")}`;
}

/** Tanggal lengkap locale Indonesia, mis. "29 Juli 2026, 10.30". */
export function formatTanggal(iso: string, withTime = true): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

/** Waktu relatif singkat untuk daftar & bell. */
export function ago(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m}m lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j lalu`;
  return `${Math.floor(h / 24)}h lalu`;
}

/* ── Metadata dinamis ──────────────────────────────────────────────────────── */

// Label untuk key yang sudah dikenal. Key lain di-humanize, bukan ditampilkan mentah.
const METADATA_LABELS: Record<string, string> = {
  invoiceNumber: "Nomor Invoice",
  orderNumber: "Nomor Pesanan",
  referenceNumber: "Nomor Referensi",
  projectName: "Proyek",
  customerName: "Pelanggan",
  expertName: "Nama Pemohon",
  specialization: "Spesialisasi",
  applicationStatus: "Status Pengajuan",
  status: "Status",
  amount: "Nominal",
  total: "Total",
  paymentDate: "Tanggal Pembayaran",
  dueDate: "Jatuh Tempo",
  createdAt: "Dibuat",
  updatedAt: "Diperbarui",
  reason: "Alasan",
  method: "Metode",
  email: "Email",
};

/** Ubah camelCase/snake_case jadi label berspasi berhuruf kapital di awal kata. */
function humanize(key: string): string {
  const words = key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim()
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function getMetadataLabel(key: string): string {
  return METADATA_LABELS[key] ?? humanize(key);
}

const MONEY_KEY = /(amount|price|total|nominal)/i;
const DATE_KEY = /(date|createdat|updatedat|paidat|expiresat)/i;

/**
 * Format satu nilai metadata sesuai namanya.
 * Mengembalikan string kosong bila nilai tidak layak ditampilkan (kosong,
 * object/array kompleks) — pemanggil melewati baris tersebut.
 */
export function formatMetadataValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";

  if (typeof value === "number" || typeof value === "string") {
    const raw = String(value).trim();
    if (raw === "") return "";

    if (MONEY_KEY.test(key)) {
      const num = typeof value === "number" ? value : Number(raw);
      if (Number.isFinite(num)) return formatRupiah(num);
    }
    if (DATE_KEY.test(key)) {
      const d = new Date(raw);
      // Angka murni (mis. "2026") bukan tanggal — biarkan apa adanya.
      if (!Number.isNaN(d.getTime()) && /[-/:T]/.test(raw)) {
        return formatTanggal(raw, /[T:]/.test(raw));
      }
    }
    return raw;
  }

  // Array sederhana masih terbaca; object/array kompleks dilewati agar tidak
  // pernah muncul sebagai "[object Object]".
  if (Array.isArray(value)) {
    const flat = value.filter(
      (v) => typeof v === "string" || typeof v === "number" || typeof v === "boolean",
    );
    return flat.length === value.length && flat.length > 0 ? flat.join(", ") : "";
  }
  return "";
}

/** Batas baris agar metadata besar tidak merusak tata letak halaman. */
export const METADATA_ROW_LIMIT = 12;

export type MetadataRow = { key: string; label: string; value: string };

/** Ubah metadata jadi baris siap render: sudah diberi label, diformat, dan disaring. */
export function metadataRows(metadata?: NotificationMetadata | null): MetadataRow[] {
  if (!metadata || typeof metadata !== "object") return [];
  const rows: MetadataRow[] = [];
  for (const [key, raw] of Object.entries(metadata)) {
    const value = formatMetadataValue(key, raw);
    if (value === "") continue;
    rows.push({ key, label: getMetadataLabel(key), value });
    if (rows.length === METADATA_ROW_LIMIT) break;
  }
  return rows;
}

/* ── Sinkronisasi antar halaman ────────────────────────────────────────────── */

// Pesan toast yang "dititipkan" ke halaman berikutnya (mis. hapus di detail →
// toast muncul di daftar). Cukup variabel modul: hidup selama navigasi client.
let pendingToast: string | null = null;
export function setPendingToast(message: string) {
  pendingToast = message;
}
export function takePendingToast(): string | null {
  const m = pendingToast;
  pendingToast = null;
  return m;
}

/** Beri tahu bell di Topbar agar menyegarkan jumlah belum dibaca tanpa menunggu polling. */
export const NOTIF_REFRESH_EVENT = "lexsee:notif-refresh";
export function refreshNotifBell() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NOTIF_REFRESH_EVENT));
  }
}

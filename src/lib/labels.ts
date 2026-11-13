// Satu-satunya tempat menerjemahkan kode dari backend ke kata-kata untuk admin.
// Halaman tidak boleh menampilkan kode enum mentah; pakai `label(kelompok, kode)`.

export type LabelGroup =
  | "withdrawal"
  | "payment"
  | "paymentType"
  | "order"
  | "role"
  | "tier"
  | "expertApplication"
  | "consultation"
  | "consultationTopic"
  | "docType";

export const LABELS: Record<LabelGroup, Record<string, string>> = {
  withdrawal: {
    PENDING: "Menunggu persetujuan",
    APPROVED: "Disetujui, belum ditransfer",
    TRANSFERRED: "Sudah ditransfer",
    REJECTED: "Ditolak",
  },
  payment: {
    PENDING: "Menunggu pembayaran",
    SUCCESS: "Berhasil",
    FAILED: "Gagal",
  },
  paymentType: {
    MEMBERSHIP: "Keanggotaan",
    BOOK: "Buku",
    WEBINAR: "Webinar",
  },
  order: {
    PENDING: "Belum dibayar",
    PAID: "Dibayar",
    PROCESSING: "Diproses",
    SHIPPED: "Dikirim",
    DELIVERED: "Diterima",
    CANCELLED: "Dibatalkan",
  },
  role: {
    USER: "Pengguna",
    PREMIUM: "Premium",
    ADMIN: "Admin",
    SALES: "Sales",
    EXPERT_HUKUM: "Ahli Hukum",
  },
  tier: {
    FREE: "Gratis",
    SILVER: "Silver",
    GOLD: "Gold",
    PLATINUM: "Platinum",
  },
  expertApplication: {
    PENDING: "Menunggu tinjauan",
    APPROVED: "Disetujui",
    REJECTED: "Ditolak",
  },
  consultation: {
    PENDING_PAYMENT: "Belum dibayar",
    AWAITING_EXPERT: "Menunggu jawaban",
    ANSWERED: "Dijawab",
    EXPIRED: "Lewat batas waktu, perlu refund",
    REFUNDED: "Sudah direfund",
    CANCELLED: "Dibatalkan",
  },
  consultationTopic: {
    KONSULTASI_HUKUM: "Konsultasi Hukum",
    BANTUAN_HUKUM: "Bantuan Hukum",
    PENDAMPINGAN_SKRIPSI: "Pendampingan Skripsi",
  },
  docType: {
    UU: "Undang-Undang (UU)",
    PERPU: "PERPU",
    PP: "Peraturan Pemerintah (PP)",
    PUTUSAN: "Putusan Pengadilan",
    JURNAL: "Jurnal Hukum",
    LAINNYA: "Lainnya",
  },
};

export function label(
  kelompok: LabelGroup,
  kode: string | null | undefined,
): string {
  if (!kode) return "—";
  return LABELS[kelompok][kode] ?? `Status tidak dikenal (${kode})`;
}

/** Nama menu per path, dipakai Sidebar dan Topbar. */
export const NAV_LABEL: Record<string, string> = {
  "/inbox": "Perlu Ditindak",
  "/overview": "Beranda",
  "/users": "Pengguna",
  "/membership": "Paket Keanggotaan",
  "/orders": "Pesanan Buku",
  "/payments": "Pembayaran",
  "/webinars": "Webinar",
  "/consultations": "Konsultasi Ahli",
  "/expert-applications": "Pengajuan Ahli Hukum",
  "/withdrawals": "Penarikan Saldo",
  "/legal-catalog": "Katalog Peraturan",
  "/knowledge-base": "Basis Pengetahuan AI",
  "/ai-store": "Kuota AI",
  "/vouchers": "Voucher",
  "/settings": "Pengaturan Harga",
  "/testing": "Uji Fitur",
  "/notifications": "Notifikasi",
};

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
    AI_FEATURE: "Kuota AI",
    CONSULTATION: "Konsultasi ahli",
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

/**
 * Pesan galat untuk admin dari error apa pun (ApiError, gagal jaringan, timeout).
 * `aksi` adalah kata kerja, mis. "menyimpan paket", dipakai saat pesan server
 * tidak layak ditampilkan.
 */
export function pesanGalat(err: unknown, aksi: string): string {
  const e = err as { name?: string; message?: unknown; status?: number } | null;
  if (e?.name === "AbortError" || e?.name === "TypeError") {
    return "Server tidak terjangkau. Periksa koneksi lalu coba lagi.";
  }
  const status = typeof e?.status === "number" ? e.status : undefined;
  const pesan = typeof e?.message === "string" ? e.message.trim() : "";
  const teknis = !pesan || /^Request failed|Internal server error/i.test(pesan);

  if (status === 401) return "Sesi berakhir, silakan masuk lagi.";
  if (status !== undefined && status >= 500) {
    return `Gagal ${aksi}. Server sedang bermasalah, coba lagi sebentar lagi.`;
  }
  if (status === 404 && teknis) return `Gagal ${aksi}. Data tidak ditemukan.`;
  if (status === 403 && teknis) return "Anda tidak punya akses untuk aksi ini.";
  if (!teknis) return pesan;
  return `Gagal ${aksi}. Coba lagi.`;
}

/** Tombol aksi admin untuk pesanan buku per status; sama dengan alur di backend. */
export function aksiPesanan(status: string): { ke: string; tombol: string }[] {
  switch (status) {
    case "PAID":
      return [
        { ke: "PROCESSING", tombol: "Proses" },
        { ke: "CANCELLED", tombol: "Batalkan" },
      ];
    case "PROCESSING":
      return [
        { ke: "SHIPPED", tombol: "Kirim" },
        { ke: "CANCELLED", tombol: "Batalkan" },
      ];
    case "SHIPPED":
      return [{ ke: "DELIVERED", tombol: "Tandai diterima" }];
    default:
      return [];
  }
}

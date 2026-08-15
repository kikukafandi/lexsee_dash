// src/types/index.ts
// TypeScript types matching the Lexsee NestJS backend Prisma models.
// Keep in sync with legal-backend/prisma/schema.prisma.

// ─── Enums ─────────────────────────────────────────────────────────────────

export type Role = "USER" | "PREMIUM" | "ADMIN";
export type DocType =
  | "UU"
  | "PERPU"
  | "PP"
  | "PERPRES"
  | "PERMEN"
  | "KEPRES"
  | "KEPMENKO"
  | "KEPPRES"
  | "PUTUSAN"
  | "JURNAL"
  | "LAINNYA";
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";
export type PaymentType = "MEMBERSHIP" | "BOOK" | "WEBINAR" | "AI_FEATURE";

// Harus sama persis dengan PAY_PER_USE_FEATURES di backend. Kunci yang hilang
// di sini bukan sekadar type error: paketnya tidak bisa dibuat sama sekali
// dari dashboard, jadi fiturnya tak pernah punya kuota untuk dijual.
export type AiFeatureKey =
  | "opinion"
  | "analyze-expert"
  | "compare"
  | "analyze-verdict"
  | "compliance"
  | "plagiarism"
  | "lit-kuasa"
  | "lit-gugatan"
  | "lit-jawaban"
  | "lit-replik"
  | "lit-duplik"
  | "lit-kesimpulan";

export type AiFeatureProduct = {
  id: string;
  featureKey: AiFeatureKey;
  label: string;
  quota: number;
  price: string; // Prisma Decimal serialized as string
  /** Modal paket (Rp). Terisi = harga jual dihitung, bukan diketik. */
  costPrice?: string | null;
  /** Keuntungan khusus paket ini (0.3 = 30%); null = ikut pengaturan global. */
  marginRate?: string | null;
  /** Harga jual efektif hasil hitungan backend — ini yang ditagih. */
  effectivePrice?: number;
  isActive: boolean;
  createdAt: string;
};
export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";
export type MessageRole = "USER" | "ASSISTANT";
export type PlanDuration = "MONTHLY" | "YEARLY";

// ─── Core Models ───────────────────────────────────────────────────────────

export type User = {
  id: string;
  email: string;
  name: string;
  bio?: string;
  phone?: string;
  photoUrl?: string;
  address?: string;
  cityId?: string;
  role: Role;
  interests: string[];
  createdAt: string;
  updatedAt: string;
};

export type Peraturan = {
  id: string;
  idperaturan: string;
  judul: string;
  jenis: string;
  jenisCode: string;
  nomor?: string;
  tahun?: string;
  pdfPath?: string;
  createdAt: string;
};

export type LegalDocument = {
  id: string;
  title: string;
  type: DocType;
  sourceUrl?: string;
  publishedAt?: string;
  uploadedBy?: string;
  isActive: boolean;
  createdAt: string;
  _count?: { chunks: number };
};

export type Payment = {
  id: string;
  userId: string;
  amount: string;
  status: PaymentStatus;
  type: PaymentType;
  midtransId?: string;
  orderId?: string;
  itemDetails?: unknown;
  createdAt: string;
};

export type OrderItem = {
  id: string;
  orderId: string;
  bookId: string;
  quantity: number;
  price: string;
  book?: Book;
};

export type Order = {
  id: string;
  userId: string;
  status: OrderStatus;
  totalAmount: string;
  shippingCost: string;
  courierName?: string;
  courierService?: string;
  recipientName: string;
  phone: string;
  address: string;
  cityId: string;
  postalCode?: string;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
};

export type Book = {
  id: string;
  title: string;
  author?: string;
  price: string;
  weight: number;
  stock: number;
  description?: string;
  coverUrl?: string;
  isbn?: string;
  createdAt: string;
  updatedAt: string;
};

export type MembershipPlan = {
  id: string;
  name: string;
  description?: string;
  duration: PlanDuration;
  price: string;
  originalPrice?: string;
  isPopular: boolean;
  isActive: boolean;
  features?: unknown;
  createdAt: string;
  updatedAt: string;
};

export type ChatSession = {
  id: string;
  userId?: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessage[];
};

export type ChatMessage = {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  sources?: unknown;
  createdAt: string;
};

// ─── API Response Shapes ───────────────────────────────────────────────────

/** Shape returned by GET /api/legal/admin/stats */
export type KbStats = {
  documents: { active: number; total: number };
  chunks: number;
  sessions: number;
  feedback: { helpful: number; notHelpful: number };
};

/** Shape returned by GET /api/legal/peraturan */
export type PeraturanListResponse = {
  data: Peraturan[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

/** Shape returned by GET /api/legal/admin/documents */
export type DocumentListResponse = {
  data: LegalDocument[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

/** Shape returned by POST /api/auth/login */
export type LoginResponse = {
  message: string;
  user: User;
  token: string;
  access_token?: string;
};

/** Shape returned by POST /api/legal/chat */
export type ChatResponse = {
  answer: string;
  sources: Array<{ title: string; excerpt: string; sourceUrl?: string; relevanceScore: number; publishedAt?: string }>;
  messageId?: string;
  retrievedDocs: number;
  sessionId?: string;
};

/** Membership tier from GET /api/payment/tiers */
export type MembershipTier = {
  tier: string;
  label: string;
  amount: number;
  durationDays: number;
};

/** Single user entry from GET /api/admin/users */
export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
  membershipTier: "FREE" | "SILVER" | "GOLD" | "PLATINUM";
  lastPaymentAt: string | null;
};

/** Full response from GET /api/admin/users */
export type AdminUsersResponse = {
  users: AdminUser[];
  summary: {
    total: number;
    byMembership: Record<string, number>;
  };
};

/** Ringkasan satu sumber scraping dari GET /api/legal/admin/scrape/sources */
export type ScrapeSource = {
  key: string;
  label: string;
  available: boolean;
  total: number;
  downloaded: number;
  pendingDownload: number;
  embedPending: number;
  embedDone: number;
  embedFailed: number;
};

/** Satu baris log scraping (via SSE atau snapshot job) */
export type ScrapeLogLine = {
  seq: number;
  level: "info" | "warn" | "error" | "success";
  message: string;
};

/** Hitungan progres job scraping */
export type ScrapeCounts = {
  total: number;
  processed: number;
  ingested: number;
  skipped: number;
  failed: number;
};

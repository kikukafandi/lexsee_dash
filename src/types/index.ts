export type AdminStats = {
    documents?: { active?: number };
    sessions?: number;
    chunks?: number;
    feedback?: { helpful?: number; notHelpful?: number };
};

export type PeraturanItem = {
    id?: string;
    judul?: string;
    jenis?: string;
    nomor?: string;
    tahun?: number;
    pdfUrl?: string;
};

export type PaymentHistoryItem = {
    id?: string;
    amount?: number;
    status?: string;
    createdAt?: string;
};

export type MembershipTier = {
    id?: string;
    name?: string;
    price?: number;
    benefits?: string[];
};

export type OrderItem = {
    id?: string;
    status?: string;
    createdAt?: string;
    items?: Array<{ title?: string; qty?: number }>;
};

export type BookItem = {
    id?: string;
    title?: string;
    stock?: number;
    price?: number;
};

export type DocumentItem = {
    id?: string;
    title?: string;
    type?: string;
    chunks?: number;
    status?: string;
    createdAt?: string;
};

export type AdminUser = {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: string;
    membershipTier: string;
    lastPaymentAt: string | null;
};

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Lang = "id" | "en";

const dictionary = {
  en: {
    appTitle: "Lexsee Admin Console",
    workspace: "Workspace",
    operations: "Operations",
    administration: "Administration",
    overview: "Overview",
    matters: "Matters",
    clients: "Clients",
    documents: "Documents",
    billingInvoices: "Billing & Invoices",
    reports: "Reports",
    auditLog: "Audit Log",
    usersRoles: "Users & Roles",
    settings: "Settings",
    searchPlaceholder: "Search matters, client",
    dateRange: "Apr 1 – Apr 30, 2026",
    export: "Export",
    newMatter: "New matter",
    greetingMorning: "Good morning",
    greetingAfternoon: "Good afternoon",
    greetingEvening: "Good evening",
    performanceNote:
      "Firm-wide performance is up +8.2% month-over-month. Three matters need your attention before Friday.",
    systemsNormal: "All systems normal · last sync 12m",
    activeMatters: "Active documents",
    billableHours: "Chat sessions",
    outstandingAR: "Vector chunks",
    realizationRate: "Helpful rate",
    financialPerformance: "Financial performance",
    billingsCollections: "Billings vs. Collections",
    liveActivity: "Live activity",
    acrossFirm: "Across the firm",
    storage: "Storage",
    loginTitle: "Admin Login",
    loginSubtitle: "Sign in to manage the dashboard.",
    email: "Email",
    password: "Password",
    login: "Login",
    processing: "Processing...",
  },
  id: {
    appTitle: "Konsol Admin Lexsee",
    workspace: "Ruang kerja",
    operations: "Operasional",
    administration: "Administrasi",
    overview: "Ringkasan",
    matters: "Perkara",
    clients: "Klien",
    documents: "Dokumen",
    billingInvoices: "Penagihan & Faktur",
    reports: "Laporan",
    auditLog: "Log Audit",
    usersRoles: "Pengguna & Peran",
    settings: "Pengaturan",
    searchPlaceholder: "Cari perkara, klien",
    dateRange: "1 Apr – 30 Apr 2026",
    export: "Ekspor",
    newMatter: "Perkara baru",
    greetingMorning: "Selamat pagi",
    greetingAfternoon: "Selamat siang",
    greetingEvening: "Selamat malam",
    performanceNote:
      "Performa firma naik +8,2% dibanding bulan lalu. Tiga perkara butuh perhatian sebelum Jumat.",
    systemsNormal: "Semua sistem normal · sinkron 12m",
    activeMatters: "Dokumen aktif",
    billableHours: "Sesi chat",
    outstandingAR: "Chunk vektor",
    realizationRate: "Rasio membantu",
    financialPerformance: "Performa finansial",
    billingsCollections: "Tagihan vs. Penagihan",
    liveActivity: "Aktivitas live",
    acrossFirm: "Di seluruh firma",
    storage: "Penyimpanan",
    loginTitle: "Login Admin",
    loginSubtitle: "Masuk untuk mengelola dashboard.",
    email: "Email",
    password: "Kata sandi",
    login: "Masuk",
    processing: "Memproses...",
  },
} as const;

const LanguageContext = createContext<{
  lang: Lang;
  setLang: (value: Lang) => void;
  t: (key: keyof typeof dictionary.en) => string;
} | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("id");

  useEffect(() => {
    const stored = window.localStorage.getItem("lexsee_lang") as Lang | null;
    if (stored) setLang(stored);
  }, []);

  const updateLang = useCallback((value: Lang) => {
    setLang(value);
    window.localStorage.setItem("lexsee_lang", value);
  }, []);

  const t = useCallback(
    (key: keyof typeof dictionary.en) => dictionary[lang][key],
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang: updateLang, t }), [lang, updateLang, t]);

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useI18n must be used within LanguageProvider");
  }
  return context;
}

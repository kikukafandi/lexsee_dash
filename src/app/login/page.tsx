"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getProfile, getToken, removeToken, setToken } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { lang, setLang, t } = useI18n();

  useEffect(() => {
    if (getToken()) {
      router.replace("/overview");
    }
  }, [router]);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "access") {
      setError("Access denied. Admin role required.");
    }
  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiFetch<{ access_token?: string; token?: string }>(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
          auth: false,
        },
      );

      const token = data.access_token || data.token || "";
      if (!token) {
        throw new Error("Token tidak ditemukan dari server.");
      }

      setToken(token);
      const profile = await getProfile();
      if (profile?.role !== "ADMIN") {
        removeToken();
        setError("Access denied. Admin role required.");
        return;
      }

      router.replace("/overview");
    } catch (err: any) {
      const message = err?.data?.message || err?.message || "Login gagal";
      setError(message);
      removeToken();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="lux-card w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <div className="text-gold text-sm tracking-[0.3em]">LEXSEE</div>
          <h1 className="mt-2 text-2xl text-textHigh">{t("loginTitle")}</h1>
          <p className="mt-2 text-sm text-textMed">{t("loginSubtitle")}</p>
        </div>
        <div className="mb-6 flex justify-center">
          <button
            className="rounded-lg border border-dividerGold bg-white px-3 py-1 text-xs text-textMed"
            onClick={() => setLang(lang === "id" ? "en" : "id")}
          >
            {lang.toUpperCase()}
          </button>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs uppercase tracking-widest text-textLow">
              {t("email")}
            </label>
            <input
              className="mt-2 w-full rounded-lg border border-borderGold bg-surface2 px-3 py-2 text-textHigh focus:border-gold focus:outline-none"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@lexsee.id"
              required
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-textLow">
              {t("password")}
            </label>
            <input
              className="mt-2 w-full rounded-lg border border-borderGold bg-surface2 px-3 py-2 text-textHigh focus:border-gold focus:outline-none"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && (
            <div className="rounded-lg border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-white transition hover:bg-goldLight disabled:opacity-60"
          >
            {loading ? t("processing") : t("login")}
          </button>
        </form>
      </div>
    </div>
  );
}

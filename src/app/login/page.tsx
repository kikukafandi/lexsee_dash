"use client";

// Login page — entry point for the Admin Console.
// Only users with role ADMIN can proceed past login.
// On mount: if a token already exists, skip login and go to /overview.

import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";

import { useRouter } from "next/navigation";
import { login, getToken, getProfile } from "@/lib/auth";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    // Read URL params manually — avoids needing useSearchParams() + Suspense
    const params = new URLSearchParams(window.location.search);
    setAccessDenied(params.get("error") === "access-denied");

    // If already logged in, go straight to the dashboard
    if (getToken()) {
      router.replace("/overview");
    }
  }, [router]);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // login() calls POST /api/auth/login and saves the JWT to localStorage
      await login(email, password);

      // Fetch the full profile to verify the ADMIN role
      const profile = await getProfile();

      if (profile.role !== "ADMIN") {
        // Clear the token — non-admin users cannot access this dashboard
        import("@/lib/auth").then(({ removeToken }) => removeToken());
        setError("Akses ditolak. Hanya Admin yang diizinkan masuk ke Admin Console.");
        setLoading(false);
        return;
      }

      // All good — go to the dashboard
      router.push("/overview");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login gagal. Periksa email dan password.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        {/* ── Brand header ─────────────────────────────────────────── */}
        <div className="text-center mb-8">
          {/* "L" logo — solid merah (tanpa gradient) */}
          <div className="w-16 h-16 rounded-2xl bg-maroon flex items-center justify-center mx-auto mb-4 shadow-lg shadow-maroon/20">
            <span className="text-white font-bold text-2xl font-serif">L</span>
          </div>
          <h1 className="text-3xl font-serif text-gold tracking-wide">LEXSEE</h1>
          <p className="text-text-low text-xs tracking-widest uppercase mt-1">
            Admin Console
          </p>
        </div>

        {/* ── Login card ───────────────────────────────────────────── */}
        <div className="bg-surface-1 border border-neutral-200 rounded-2xl p-8 shadow-xl shadow-black/10">
          <h2 className="text-text-high font-serif text-xl mb-1">
            Selamat datang kembali
          </h2>
          <p className="text-text-low text-sm mb-6">
            Masuk ke panel administrasi Lexsee
          </p>

          {/* Access denied notice (when redirected from dashboard) */}
          {accessDenied && (
            <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/25 text-danger text-sm">
              <AlertTriangle size={16} className="inline shrink-0" /> Sesi berakhir atau akses tidak diizinkan. Silakan masuk kembali.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email field */}
            <div>
              <label className="block text-text-med text-xs font-semibold uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-surface-2 border border-neutral-200 rounded-lg px-4 py-2.5 text-text-high text-sm placeholder-text-low focus:outline-none focus:border-maroon focus:bg-surface-2 transition-colors"
                placeholder="email@perusahaan.id"
              />
            </div>

            {/* Password field */}
            <div>
              <label className="block text-text-med text-xs font-semibold uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-surface-2 border border-neutral-200 rounded-lg px-4 py-2.5 text-text-high text-sm placeholder-text-low focus:outline-none focus:border-maroon transition-colors"
                placeholder="••••••••"
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3 rounded-lg bg-danger/10 border border-danger/25 text-danger text-sm">
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-gold text-white font-bold text-sm hover:bg-gold-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                "Masuk ke Dashboard"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

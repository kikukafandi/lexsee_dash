"use client";

// Dashboard Layout — wraps all protected admin pages.
// On mount: checks JWT → fetches profile → verifies ADMIN role.
// If check fails: redirects to /login.
// If check passes: renders Sidebar + Topbar + page content.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, getProfile, removeToken } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import type { User } from "@/types";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  // Show loader while we verify auth — prevents a flash of protected content
  const [checking, setChecking] = useState(true);
  // Drawer sidebar untuk layar kecil (mobile/tablet)
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Backend tak terjangkau — beda dari "token tidak valid", jadi sesi dipertahankan
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Safety net: kalau verifikasi tak selesai dalam 8 detik, tampilkan error —
    // JANGAN hapus token. Backend lambat/mati bukan bukti sesi tidak sah.
    const safetyTimer = setTimeout(() => {
      setAuthError("Server tidak merespons. Periksa koneksi, lalu coba lagi.");
      setChecking(false);
    }, 8000);

    async function checkAuth() {
      try {
        // Step 1: Is there a token at all?
        const token = getToken();
        if (!token) {
          router.push("/login");
          return;
        }

        // Step 2: Fetch the user's profile to verify token is valid
        const profile = await getProfile();

        // Step 3: Only ADMIN role is allowed in this dashboard
        if (profile.role !== "ADMIN") {
          removeToken();
          router.push("/login?error=access-denied");
          return;
        }

        setUser(profile);
      } catch (err) {
        // [SEC/UX] Hanya 401/403 yang berarti sesi tidak sah. Sebelumnya SEMUA
        // error — termasuk backend mati atau wifi putus — menghapus token, jadi
        // admin ter-logout tiap kali jaringan tersendat (temuan WEB-04).
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          removeToken();
          router.push("/login");
          return;
        }
        setAuthError(
          err instanceof Error && err.message
            ? `Gagal memverifikasi sesi: ${err.message}`
            : "Gagal memverifikasi sesi. Coba lagi.",
        );
      } finally {
        clearTimeout(safetyTimer);
        setChecking(false);
      }
    }

    checkAuth();
    return () => clearTimeout(safetyTimer);
  }, [router]);

  // Gagal karena jaringan/server: tawarkan coba-lagi, jangan paksa login ulang.
  if (authError) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-bg p-6 text-center">
        <p className="max-w-md text-sm text-textMed">{authError}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-md bg-maroon px-4 py-2 text-sm font-semibold text-white"
        >
          Coba lagi
        </button>
        <button
          type="button"
          onClick={() => {
            removeToken();
            router.push("/login");
          }}
          className="text-xs text-textLow underline"
        >
          Keluar dan login ulang
        </button>
      </div>
    );
  }

  // Show spinner while checking — avoids flash of protected UI
  // Also show spinner if user is null (redirect to /login is in progress)
  if (checking || !user) {
    return <PageLoader />;
  }

  const handleLogout = () => {
    removeToken();
    router.push("/login");
  };

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      {/* Sidebar: statis di desktop, drawer di layar kecil */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Right side: topbar + scrollable main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar
          user={user}
          onLogout={handleLogout}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

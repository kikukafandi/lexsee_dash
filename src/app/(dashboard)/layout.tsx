"use client";

// Dashboard Layout — wraps all protected admin pages.
// On mount: checks JWT → fetches profile → verifies ADMIN role.
// If check fails: redirects to /login.
// If check passes: renders Sidebar + Topbar + page content.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, getProfile, removeToken } from "@/lib/auth";
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

  useEffect(() => {
    // Safety net: if auth takes more than 8 seconds, redirect to login
    const safetyTimer = setTimeout(() => {
      removeToken();
      router.push("/login");
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
      } catch {
        // Token invalid or network error — clear and redirect
        removeToken();
        router.push("/login");
      } finally {
        clearTimeout(safetyTimer);
        setChecking(false);
      }
    }

    checkAuth();
    return () => clearTimeout(safetyTimer);
  }, [router]);

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
      {/* Fixed sidebar on the left */}
      <Sidebar />

      {/* Right side: topbar + scrollable main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar user={user} onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

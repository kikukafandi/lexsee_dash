"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { getProfile, getToken, removeToken } from "@/lib/auth";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import type { Profile } from "@/lib/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    getProfile()
      .then((data) => {
        if (data?.role !== "ADMIN") {
          removeToken();
          router.replace("/login?error=access");
          return;
        }
        setProfile(data);
      })
      .catch(() => {
        removeToken();
        router.replace("/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner label="Authenticating" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-bg">
      <Sidebar activePath={pathname} profile={profile} />
      <div className="flex flex-1 flex-col">
        <Topbar profile={profile} />
        <main className="flex-1 overflow-y-auto px-8 py-6">{children}</main>
      </div>
    </div>
  );
}

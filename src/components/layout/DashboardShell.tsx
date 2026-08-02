"use client";

// Kerangka UI dashboard: sidebar/topbar dan state drawer.
// Auth sudah diputuskan di server (lihat app/(dashboard)/layout.tsx) — komponen
// ini hanya menerima user yang sudah terverifikasi.

import { useState } from "react";
import { useRouter } from "next/navigation";

import { logout } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import type { User } from "@/types";

export function DashboardShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      // Cookie dihapus server; refresh agar server component tidak memakai
      // hasil render lama yang masih memuat data admin.
      router.replace("/login");
      router.refresh();
    }
  };

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      {/* Sidebar: statis di desktop, drawer di layar kecil */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Right side: topbar + scrollable main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar
          user={user}
          onLogout={() => void handleLogout()}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

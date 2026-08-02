// Dashboard layout — gerbang seluruh halaman admin.
//
// WEB-03: verifikasi sesi dan role terjadi di server sebelum satu byte pun HTML
// terkirim. Sebelumnya cek berjalan di browser setelah hydration, sehingga isi
// halaman sudah dikirim ke siapa pun yang memegang URL-nya.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { BACKEND_URL, SESSION_COOKIE } from "@/lib/session";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { RetryScreen } from "@/components/layout/RetryScreen";
import type { User } from "@/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) redirect("/login");

  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    // WEB-04: backend mati bukan bukti sesi tidak sah — jangan paksa login ulang.
    return (
      <RetryScreen message="Server tidak merespons. Periksa koneksi, lalu coba lagi." />
    );
  }

  if (response.status === 401 || response.status === 403) {
    redirect("/login?error=access-denied");
  }
  if (!response.ok) {
    return <RetryScreen message="Gagal memverifikasi sesi. Coba lagi." />;
  }

  const user = (await response.json()) as User;
  if (user.role !== "ADMIN") {
    redirect("/login?error=access-denied");
  }

  return <DashboardShell user={user}>{children}</DashboardShell>;
}

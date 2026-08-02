"use client";

// Layar "backend tak terjangkau" (WEB-04): tawarkan coba-lagi dan keluar manual,
// jangan hapus sesi hanya karena jaringan tersendat.

import { useRouter } from "next/navigation";

import { logout } from "@/lib/auth";

export function RetryScreen({ message }: { message: string }) {
  const router = useRouter();

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-bg p-6 text-center">
      <p className="max-w-md text-sm text-textMed">{message}</p>
      <button
        type="button"
        onClick={() => router.refresh()}
        className="rounded-md bg-maroon px-4 py-2 text-sm font-semibold text-white"
      >
        Coba lagi
      </button>
      <button
        type="button"
        onClick={() => {
          void logout().finally(() => router.replace("/login"));
        }}
        className="text-xs text-textLow underline"
      >
        Keluar dan login ulang
      </button>
    </div>
  );
}

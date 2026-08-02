// src/lib/auth.ts
// Helper auth sisi client. Tidak ada token di sini: sejak WEB-01, JWT hidup di
// cookie HttpOnly yang dipasang route handler /auth/login dan dilampirkan ke
// backend oleh src/proxy.ts. Browser tidak pernah memegang tokennya.

import { apiFetch } from "./api";
import type { User } from "@/types";

/**
 * Login lewat route handler Next (server-side), bukan langsung ke backend.
 * Server yang memverifikasi role ADMIN dan menerbitkan cookie sesi.
 * Melempar ApiError bila kredensial salah, role bukan admin, atau backend mati.
 */
export async function login(email: string, password: string): Promise<User> {
  const data = await apiFetch<{ user: User }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return data.user;
}

/** Profil user yang sedang login (cookie dilampirkan otomatis oleh proxy). */
export async function getProfile(): Promise<User> {
  return apiFetch<User>("/api/profile");
}

/** Logout: server menghapus cookie sesi. */
export async function logout(): Promise<void> {
  await apiFetch("/auth/logout", { method: "POST" });
}

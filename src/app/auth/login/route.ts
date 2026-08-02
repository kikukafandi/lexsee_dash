import { NextResponse, type NextRequest } from "next/server";

import {
  BACKEND_URL,
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
} from "@/lib/session";
import type { User } from "@/types";

// Login berjalan di server: token dari backend tidak pernah sampai ke browser,
// ia hanya dipasang sebagai cookie HttpOnly (WEB-01).

function backendHeaders(request: NextRequest): HeadersInit {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  // Rate limit auth di backend dihitung per IP; tanpa ini seluruh admin
  // terhitung sebagai satu IP (IP server Next).
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) headers["x-forwarded-for"] = forwarded;
  return headers;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    email?: string;
    password?: string;
  } | null;

  if (!body?.email || !body?.password) {
    return NextResponse.json(
      { message: "Email dan password wajib diisi." },
      { status: 400 },
    );
  }

  let loginRes: Response;
  try {
    loginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: backendHeaders(request),
      body: JSON.stringify({ email: body.email, password: body.password }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return NextResponse.json(
      { message: "Server tidak merespons. Coba lagi." },
      { status: 502 },
    );
  }

  const loginBody = (await loginRes.json().catch(() => ({}))) as {
    message?: string;
    token?: string;
    access_token?: string;
  };

  if (!loginRes.ok) {
    return NextResponse.json(
      { message: loginBody.message ?? "Login gagal. Periksa email dan password." },
      // 401/429 dsb diteruskan apa adanya supaya UI bisa membedakannya.
      { status: loginRes.status },
    );
  }

  const token = loginBody.token ?? loginBody.access_token;
  if (!token) {
    return NextResponse.json(
      { message: "Backend tidak mengembalikan token." },
      { status: 502 },
    );
  }

  // Role diverifikasi di sini, bukan di browser: cookie hanya terbit untuk ADMIN.
  const profileRes = await fetch(`${BACKEND_URL}/api/profile`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);

  if (!profileRes?.ok) {
    return NextResponse.json(
      { message: "Gagal memverifikasi profil. Coba lagi." },
      { status: 502 },
    );
  }

  const user = (await profileRes.json()) as User;
  if (user.role !== "ADMIN") {
    return NextResponse.json(
      {
        message:
          "Akses ditolak. Hanya Admin yang diizinkan masuk ke Admin Console.",
      },
      { status: 403 },
    );
  }

  const response = NextResponse.json({ user });
  response.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
  return response;
}

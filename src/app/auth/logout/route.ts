import { NextResponse } from "next/server";

import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/session";

export function POST() {
  const response = NextResponse.json({ ok: true });
  // maxAge 0 dengan atribut yang sama seperti saat dipasang — kalau path/secure
  // berbeda, browser menyimpan cookie lama dan logout tidak terjadi.
  response.cookies.set(SESSION_COOKIE, "", {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: 0,
  });
  return response;
}

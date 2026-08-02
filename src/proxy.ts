import { NextResponse, type NextRequest } from "next/server";

// Import relatif (bukan alias @/) supaya proxy.test.mjs bisa memuatnya langsung
// dengan `node --test` tanpa resolver alias.
import { SESSION_COOKIE } from "./lib/session";

// WEB-01/WEB-03 — batas auth ada di server, bukan di browser.
//
// JWT admin hidup di cookie HttpOnly, jadi tidak terbaca JavaScript sama sekali.
// Konsekuensinya `fetch` di client tidak bisa memasang Authorization sendiri:
// proxy inilah yang menyalin token dari cookie ke header sebelum request
// diteruskan ke NestJS lewat rewrite di next.config.ts.
//
// Sekaligus: gerbang halaman (redirect ke /login tanpa cookie) dan nonce CSP.

const isDev = process.env.NODE_ENV === "development";

/** Halaman yang boleh diakses tanpa sesi. Sisanya = halaman dashboard. */
const PUBLIC_PATHS = new Set(["/", "/login"]);

function cspHeader(nonce: string): string {
  return [
    "default-src 'self'",
    // WEB-02 lanjutan: 'unsafe-inline' hilang dari script-src. Script hanya jalan
    // bila membawa nonce request ini, jadi <script> hasil injeksi tidak dieksekusi.
    // 'strict-dynamic' dibutuhkan karena bundle Next memuat chunk lain secara dinamis.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // ponytail: style tetap 'unsafe-inline' — React menulis style lewat CSSOM dan
    // Next menyisipkan <style> saat hydration; nonce di sini tidak menambah proteksi
    // terhadap eksekusi kode, hanya memecah tampilan.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    `connect-src 'self'${isDev ? " ws: http://localhost:*" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const { pathname } = request.nextUrl;

  // Panggilan API: teruskan token sebagai bearer ke backend. Rewrite di
  // next.config.ts berjalan setelah proxy, jadi header ini ikut ke NestJS.
  if (pathname.startsWith("/api/") || pathname.startsWith("/static/")) {
    const headers = new Headers(request.headers);
    // Jangan percaya Authorization kiriman client — cookie satu-satunya sumber.
    headers.delete("authorization");
    if (token) headers.set("authorization", `Bearer ${token}`);
    return NextResponse.next({ request: { headers } });
  }

  // Route handler sesi (/auth/login, /auth/logout): justru merekalah yang
  // menerbitkan dan menghapus cookie, jadi tidak boleh ikut digerbangi.
  if (pathname.startsWith("/auth/")) {
    return NextResponse.next();
  }

  if (!token && !PUBLIC_PATHS.has(pathname)) {
    const login = new URL("/login", request.url);
    return NextResponse.redirect(login);
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = cspHeader(nonce);
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  // Next membaca header ini saat render untuk menempelkan nonce ke tiap <script>.
  headers.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    // Aset statis tidak butuh nonce maupun bearer.
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

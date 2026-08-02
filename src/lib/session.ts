// Sesi admin dashboard — satu-satunya tempat JWT disimpan (WEB-01).
//
// Cookie HttpOnly: tidak terbaca `document.cookie` maupun script apa pun, jadi
// XSS tidak lagi bisa mencuri sesi admin seperti saat token ada di localStorage.

export const SESSION_COOKIE = "lexsee_admin_session";

/** JWT backend berumur 30 hari (`auth.module.ts`); cookie mengikuti. */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  // SameSite=lax memblokir cookie pada request lintas situs non-GET, sehingga
  // form POST dari situs penyerang tidak membawa sesi admin (CSRF).
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE,
} as const;

/** Backend NestJS. Sama dengan yang dipakai rewrite di next.config.ts. */
export const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3000";

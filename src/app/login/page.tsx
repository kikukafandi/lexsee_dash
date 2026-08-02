import { connection } from "next/server";

import { LoginForm } from "./LoginForm";

// Nonce CSP hanya bisa ditempelkan saat render per-request. Halaman yang
// di-prerender saat build tidak punya nonce sama sekali, sehingga SELURUH
// script-nya diblokir browser dan halamannya mati — dan itu tidak terlihat
// oleh test berbasis curl, karena HTML-nya tetap terkirim utuh.
//
// `export const dynamic = "force-dynamic"` sempat dipakai di sini dan TIDAK
// bekerja: file ini dulu berpanji "use client", dan konfigurasi segmen tidak
// berlaku untuk halaman client. Karena itu formulirnya dipindah ke LoginForm
// dan halamannya jadi server component yang menunggu request lewat
// `connection()` — cara yang memang dianjurkan dokumentasi Next.
//
// Halaman dashboard tidak butuh ini: membaca cookie sudah membuatnya dinamis.
export default async function LoginPage() {
  await connection();
  return <LoginForm />;
}

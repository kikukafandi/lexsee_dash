// Root page — arahkan ke /overview bila ada sesi, selain itu ke /login.
// Keputusannya di server (cookie HttpOnly tidak terbaca dari browser).

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE } from "@/lib/session";

export default async function RootPage() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  redirect(token ? "/overview" : "/login");
}

import { getToken } from "./auth";

type ApiFetchOptions = RequestInit & { auth?: boolean };

export async function apiFetch<T = unknown>(
    path: string,
    options: ApiFetchOptions = {},
) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const url = path.startsWith("http") ? path : `${baseUrl}${path}`;
    const headers = new Headers(options.headers || {});

    if (options.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    if (options.auth !== false) {
        const token = getToken();
        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }
    }

    const res = await fetch(url, { ...options, headers });
    const contentType = res.headers.get("content-type") || "";

    let data: unknown = null;
    if (contentType.includes("application/json")) {
        data = await res.json().catch(() => null);
    } else {
        data = await res.text().catch(() => null);
    }

    if (!res.ok) {
        throw { status: res.status, data };
    }

    return data as T;
}

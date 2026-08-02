// src/lib/api.ts
// Central API fetch utility for the Lexsee Admin Dashboard.
// All requests go through Next.js rewrites (proxy), so no base URL is needed.
// The proxy is configured in next.config.ts: /api/* → NestJS backend.

/** Error request yang membawa status HTTP, agar pemanggil bisa membedakan 404 dsb. */
export class ApiError extends Error {
    constructor(message: string, readonly status: number) {
        super(message);
        this.name = "ApiError";
    }
}

/**
 * A generic fetch wrapper that:
 * 1. Sets Content-Type: application/json
 * 2. Throws a descriptive error if the response is not OK
 *
 * Autentikasi tidak diurus di sini: cookie sesi HttpOnly ikut otomatis pada
 * request same-origin, dan `src/proxy.ts` yang mengubahnya jadi bearer token
 * untuk backend (WEB-01).
 *
 * @param endpoint - The API path, e.g. "/api/legal/admin/stats"
 * @param options  - Standard fetch options (method, body, etc.)
 * @returns Parsed JSON response typed as T
 */
export async function apiFetch<T>(
    endpoint: string,
    options: RequestInit & { timeoutMs?: number } = {}
): Promise<T> {
    const { timeoutMs = 10_000, ...fetchOptions } = options;

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(fetchOptions.headers as Record<string, string>),
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(endpoint, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
        // Try to extract a meaningful error message from the response body
        const errorBody = await response.json().catch(() => ({}));
        const message =
            errorBody.message ?? `Request failed with status ${response.status}`;
        throw new ApiError(message, response.status);
    }

    // 204 No Content (dan response tanpa body JSON) tidak punya apa pun untuk
    // di-parse: response.json() melempar SyntaxError, sehingga DELETE yang
    // sebenarnya berhasil tampak gagal di UI.
    if (response.status === 204 || response.headers.get("content-length") === "0") {
        return undefined as T;
    }
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("json")) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}

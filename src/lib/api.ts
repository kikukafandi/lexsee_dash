// src/lib/api.ts
// Central API fetch utility for the Lexsee Admin Dashboard.
// All requests go through Next.js rewrites (proxy), so no base URL is needed.
// The proxy is configured in next.config.ts: /api/* → NestJS backend.

const TOKEN_KEY = "lexsee_admin_token";

/** Error request yang membawa status HTTP, agar pemanggil bisa membedakan 404 dsb. */
export class ApiError extends Error {
    constructor(message: string, readonly status: number) {
        super(message);
        this.name = "ApiError";
    }
}

/**
 * A generic fetch wrapper that:
 * 1. Automatically attaches the JWT token from localStorage
 * 2. Sets Content-Type: application/json
 * 3. Throws a descriptive error if the response is not OK
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

    // Read the JWT from localStorage (only available in the browser)
    const token =
        typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(fetchOptions.headers as Record<string, string>),
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

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

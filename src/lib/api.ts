// src/lib/api.ts
// Central API fetch utility for the Lexsee Admin Dashboard.
// All requests go through Next.js rewrites (proxy), so no base URL is needed.
// The proxy is configured in next.config.ts: /api/* → NestJS backend.

const TOKEN_KEY = "lexsee_admin_token";

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
        throw new Error(message);
    }

    return response.json() as Promise<T>;
}

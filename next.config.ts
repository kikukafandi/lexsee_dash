import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:3000";

// Allow LAN access. Next.js only accepts exact IPs (no CIDR).
// Add any other LAN device IPs here as needed.
const allowedDevOrigins = [
  "192.168.11.158",
  
];

const isDev = process.env.NODE_ENV === "development";

// WEB-02 — baseline security headers.
// Content-Security-Policy TIDAK di sini: sejak WEB-01/WEB-03 ia dibangun
// per-request di `src/proxy.ts` karena memuat nonce, dan nonce harus baru tiap
// request. Header statis di bawah ini tidak bergantung request, jadi tetap di sini.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  // HSTS hanya relevan di HTTPS; dev jalan di http://localhost.
  ...(isDev
    ? []
    : [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains",
        },
      ]),
];

const nextConfig: NextConfig = {
  allowedDevOrigins,
  // Jangan bocorkan versi framework.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  async rewrites() {
    return [
      // Proxy all /api/* calls to the NestJS backend
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      // Proxy static PDF files from the backend
      {
        source: "/static/:path*",
        destination: `${backendUrl}/static/:path*`,
      },
    ];
  },
};

export default nextConfig;

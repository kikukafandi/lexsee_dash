import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:3000";

// Allow LAN access. Next.js only accepts exact IPs (no CIDR).
// Add any other LAN device IPs here as needed.
const allowedDevOrigins = [
  "192.168.11.158",
  
];

const isDev = process.env.NODE_ENV === "development";

// WEB-02 — CSP + baseline security headers.
// ponytail: script-src pakai 'unsafe-inline' (bukan nonce), jadi CSP ini TIDAK
// memblokir eksekusi script injeksi. Yang diblokirnya adalah jalur eksfiltrasinya:
// connect-src/img-src/form-action 'self' berarti token di localStorage (WEB-01)
// tidak bisa dikirim ke origin penyerang, dan object-src/base-uri/frame-ancestors
// menutup plugin, base-tag hijack, serta clickjacking.
// Upgrade ke nonce CSP (proxy.ts, lihat node_modules/next/dist/docs/01-app/02-guides/
// content-security-policy.md) saat WEB-03 dikerjakan — nonce memaksa dynamic
// rendering, jadi lakukan bersamaan dengan pemindahan auth ke server.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  // Dev butuh websocket HMR; produksi hanya same-origin (API lewat rewrite).
  `connect-src 'self'${isDev ? " ws: http://localhost:*" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
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

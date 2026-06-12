import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:3000";

// Allow LAN access. Next.js only accepts exact IPs (no CIDR).
// Add any other LAN device IPs here as needed.
const allowedDevOrigins = [
  "192.168.11.158",
  
];

const nextConfig: NextConfig = {
  allowedDevOrigins,
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

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@taskflow/shared"],
  async rewrites() {
    // If BACKEND_URL or NEXT_PUBLIC_API_URL is provided, proxy /api/v1 through Next.js
    const backendUrl =
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, "") ||
      "http://localhost:5000";

    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;

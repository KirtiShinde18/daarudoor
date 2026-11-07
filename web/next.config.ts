import type { NextConfig } from "next";

const getBackendUrl = () => {
  // 1. Explicit full API URL if set
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "");
  }

  // 2. Based on NEXT_PUBLIC_ENV toggle
  if (process.env.NEXT_PUBLIC_ENV === "production" && process.env.NEXT_PUBLIC_API_LIVE) {
    return process.env.NEXT_PUBLIC_API_LIVE.replace(/\/+$/, "");
  }
  if (process.env.NEXT_PUBLIC_ENV === "development" && process.env.NEXT_PUBLIC_API_LOCAL) {
    return process.env.NEXT_PUBLIC_API_LOCAL.replace(/\/+$/, "");
  }

  // 3. Fallbacks based on build mode
  if (process.env.NODE_ENV === "production") {
    return (process.env.NEXT_PUBLIC_API_LIVE || "https://daarudoor.vercel.app").replace(/\/+$/, "");
  }

  return (process.env.NEXT_PUBLIC_API_LOCAL || "http://127.0.0.1:5500").replace(/\/+$/, "");
};

const backendUrl = getBackendUrl();

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

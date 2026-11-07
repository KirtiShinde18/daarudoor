import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // 1. In Local Development: Proxy /api requests to local Express backend on port 5500
    if (process.env.NODE_ENV !== "production") {
      const localBackend =
        process.env.NEXT_PUBLIC_API_LOCAL || "http://127.0.0.1:5500";
      return [
        {
          source: "/api/:path*",
          destination: `${localBackend.replace(/\/+$/, "")}/api/:path*`,
        },
      ];
    }

    // 2. In Production: Proxy to the live backend server
    const liveBackend = (
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_API_LIVE ||
      "https://daarudoor-server.vercel.app"
    ).replace(/\/+$/, "");

    return [
      {
        source: "/api/:path*",
        destination: `${liveBackend}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

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

    // 2. In Production:
    // If a dedicated separate backend domain is explicitly provided (e.g., https://api.daarudoor.com or https://daarudoor-api.vercel.app)
    const liveBackend = (
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NEXT_PUBLIC_ENV === "production"
        ? process.env.NEXT_PUBLIC_API_LIVE
        : "")
    )?.replace(/\/+$/, "");

    // IMPORTANT: Avoid self-proxy infinite loops!
    // If liveBackend is empty OR matches the current Vercel domain, DO NOT rewrite internally in Next.js.
    // Instead, root vercel.json routes /api directly to the backend service.
    if (
      liveBackend &&
      !liveBackend.includes("daarudoor.vercel.app") &&
      !liveBackend.startsWith("/")
    ) {
      return [
        {
          source: "/api/:path*",
          destination: `${liveBackend}/api/:path*`,
        },
      ];
    }

    return [];
  },
};

export default nextConfig;

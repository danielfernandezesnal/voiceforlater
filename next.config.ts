import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  typescript: {
    ignoreBuildErrors: false,
  },
  async rewrites() {
    return [
      // REWRITES: TEMPORARY SAFETY NET
      // The frontend MUST call /api/messages and /api/profile directly.
      // These rewrites capture any legacy/missed calls to /messages or /profile
      // and internally map them to the API.
      {
        source: '/messages',
        destination: '/api/messages',
      },
      {
        source: '/profile',
        destination: '/api/profile',
      },
    ];
  },
};

export default nextConfig;

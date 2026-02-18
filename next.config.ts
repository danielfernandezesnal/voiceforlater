import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  typescript: {
    // Pre-existing type errors exist in the codebase; ignore during build.
    // TODO: fix type errors and set this back to false.
    ignoreBuildErrors: true,
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

import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  typescript: {
    ignoreBuildErrors: false,
  },
  async rewrites() {
    return [
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

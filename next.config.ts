import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    const supabaseUrl = "https://nrbnmuqjzyghwqlzbxts.supabase.co";

    // Content Security Policy (Report Only)
    // We include 'unsafe-inline' and 'unsafe-eval' for Next.js compatibility in this initial step.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
      `connect-src 'self' ${supabaseUrl} https://api.stripe.com`,
      `img-src 'self' blob: data: ${supabaseUrl}`,
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "frame-src https://js.stripe.com",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy-Report-Only',
            value: csp,
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ];
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

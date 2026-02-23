import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    // 1) Variables para CSP
    // Usamos el origen genérico *.supabase.co para abarcar cualquier entorno local o productivo, 
    // y extraemos el de la variable si existe para mayor solidez. 
    const supabaseUrls = `${process.env.NEXT_PUBLIC_SUPABASE_URL || ''} https://*.supabase.co`.trim();

    // Stripe
    const stripeApi = "https://api.stripe.com https://hooks.stripe.com";
    const stripeJs = "https://js.stripe.com";

    // 2) Content Security Policy (Report Only mode para no romper producción)
    // - Eliminamos 'unsafe-eval'. Si tu proyecto usa React puro Next.js puede necesitarlo en dev, 
    //   pero en producción (App Router) por lo general es seguro quitarlo.
    // - Eliminamos dominios *.vercel.app genéricos por seguridad.
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' ${stripeJs}`,
      `style-src 'self' 'unsafe-inline'`,
      `img-src 'self' blob: data: ${supabaseUrls}`,
      `connect-src 'self' ${supabaseUrls} ${stripeApi}`,
      "font-src 'self' data:",
      "object-src 'none'",
      "base-uri 'self'",
      `frame-src ${stripeJs} https://hooks.stripe.com`,
      "frame-ancestors 'none'",
      "form-action 'self'"
    ].join('; ');

    return [
      {
        // Aplica a todas las rutas
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
          }
          // Nota: Omitimos X-Frame-Options porque CSP frame-ancestors lo reemplaza y es más flexible si a futuro requieres un origen específico.
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

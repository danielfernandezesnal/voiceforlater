import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { resolveLocale } from "@/lib/i18n/locale";

export async function middleware(request: NextRequest) {
    // PROACTIVE LOGGING FOR DEBUGGING
    if (request.nextUrl.pathname === '/messages' || request.nextUrl.pathname === '/profile') {
        console.warn(`[MIDDLEWARE WARNING: DEPRECATED ENDPOINT] usage detected: ${request.nextUrl.pathname}`);
        console.warn('Frontend must call /api/messages or /api/profile directly.');
    }

    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => {
                        request.cookies.set(name, value);
                    });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    // API routes: only needed session refresh (done above), skip locale logic
    if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.includes('.')) {
        return response;
    }

    const locales = ['en', 'es'];
    const parts = pathname.split("/").filter(Boolean);
    const firstPart = parts[0];

    const pathnameHasLocale = locales.includes(firstPart);
    const locale = pathnameHasLocale ? firstPart : resolveLocale(request);

    // If missing locale in path, redirect
    if (!pathnameHasLocale) {
        request.nextUrl.pathname = `/${locale}${pathname}`;
        return NextResponse.redirect(request.nextUrl);
    }

    // --- Admin / Dashboard Access Control Logic ---

    // Check if we are on dashboard (e.g. /en/dashboard)
    const isLocaleDashboard = parts.length >= 2 && parts[1] === "dashboard";

    // Check if we are on admin (e.g. /en/admin)
    const isLocaleAdmin = parts.length >= 2 && parts[1] === "admin";

    // Check Role
    let isPrivileged = false;
    if (user) {
        const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        if (roleData && (roleData.role === 'owner' || roleData.role === 'admin')) {
            isPrivileged = true;
        }
    }

    // 1. Admin never stays on dashboard -> go to /admin
    if (isPrivileged && isLocaleDashboard) {
        const url = request.nextUrl.clone();
        url.pathname = `/${locale}/admin`;
        url.search = "";
        return NextResponse.redirect(url);
    }

    // 2. Non-admin cannot enter /admin -> go to /dashboard
    if (isLocaleAdmin && !isPrivileged) {
        const url = request.nextUrl.clone();
        url.pathname = `/${locale}/dashboard`;
        url.search = "";
        return NextResponse.redirect(url);
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder (assets, etc)
         * - api (api routes should not be localized typically)
         *   EXCEPT /api/trusted-contact(s) which need session refresh
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/).*)',
        '/api/trusted-contact',
        '/api/trusted-contacts',
        '/api/profile',
    ],
};

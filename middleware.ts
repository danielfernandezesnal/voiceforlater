import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
    // PROACTIVE LOGGING FOR DEBUGGING
    if (request.nextUrl.pathname === '/messages' || request.nextUrl.pathname === '/profile') {
        console.warn(`[MIDDLEWARE WARNING: DEPRECATED ENDPOINT] usage detected: ${request.nextUrl.pathname}`);
        console.warn('Frontend must call /api/messages or /api/profile directly.');
        console.log(`Method: ${request.method}`);
        console.log(`Referer: ${request.headers.get('referer') || 'None'}`);
        console.log(`User-Agent: ${request.headers.get('user-agent') || 'None'}`);
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

    const parts = pathname.split("/").filter(Boolean);
    const locale = parts[0] || "en";

    // Check if we are on dashboard (e.g. /en/dashboard)
    // parts[0] is locale, parts[1] is dashboard
    const isLocaleDashboard =
        parts.length >= 2 && parts[1] === "dashboard";

    // Check if we are on admin (e.g. /en/admin)
    // parts[0] is locale, parts[1] is admin
    const isLocaleAdmin =
        parts.length >= 2 && parts[1] === "admin";

    // Check Role
    let isPrivileged = false;
    if (user) {
        // Check DB role only (Removed ADMIN_EMAIL fallback)
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

    // Localization logic needs to be preserved
    // The previous middleware DID have localization logic.
    // The user prompt middleware DID NOT.
    // However, the prompt middleware expects to run on `/:locale/dashboard`.
    // If I overwrite middleware completely, I lose the locale detection/redirection for root `/`.
    // BUT the prompt said "Código completo a usar".
    // AND "No romper nada del flujo actual".
    // The previous middleware was ALL about locale redirection.
    // If I remove it, `/` will not redirect to `/en`.

    // I must MERGE the localization logic.
    // Previous middleware structure:
    // 1. Check if locale present. If so, updateSession (auth).
    // 2. If not, redirect to default locale.

    // My "updateSession" logic above IS the auth check.
    // So I should:
    // 1. Check locale.
    // 2. If missing, redirect.
    // 3. If present, do auth logic + admin checks.

    // MERGED Implementation:

    const locales = ['en', 'es'];
    const defaultLocale = 'en';

    // API routes: only needed session refresh (done above), skip locale logic
    if (pathname.startsWith('/api/')) {
        return response;
    }

    const pathnameHasLocale = locales.some(
        (loc) => pathname.startsWith(`/${loc}/`) || pathname === `/${loc}`
    )

    if (pathnameHasLocale) {
        // User is on a localized path.
        // Already did auth check above.
        // Did admin check above.
        return response;
    }

    // Redirect if no locale (and not filtered by config matcher)
    request.nextUrl.pathname = `/${defaultLocale}${pathname}`
    return NextResponse.redirect(request.nextUrl)
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

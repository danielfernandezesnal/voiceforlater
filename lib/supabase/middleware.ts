import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Refresh session if expired - important for Server Components
    const { data: { user } } = await supabase.auth.getUser()

    // PROTECT ADMIN ROUTES
    const path = request.nextUrl.pathname;
    const segments = path.split('/');
    // segments: ['', 'locale', 'admin', ...]
    const isAdminRoute = segments[2] === 'admin';

    if (isAdminRoute) {
        const locale = segments[1] || 'en';

        if (!user) {
            const url = request.nextUrl.clone()
            url.pathname = `/${locale}/auth/login`
            return NextResponse.redirect(url)
        }

        const { isAdminEmail } = await import('@/lib/admin');
        if (!isAdminEmail(user)) {
            const url = request.nextUrl.clone()
            url.pathname = `/${locale}/dashboard`
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}

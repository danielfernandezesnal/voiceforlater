import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as 'magiclink' | 'signup' | 'invite' | 'recovery' | 'email_change' | null
    const locale = request.nextUrl.pathname.split('/')[1] || 'en'

    // Determine the origin for redirection
    const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const cleanOrigin = origin.replace(/\/$/, '');

    const supabase = await createClient()

    let errorDetails = '';

    if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({ token_hash, type })
        if (!error) {
            return NextResponse.redirect(`${cleanOrigin}/${locale}/dashboard`)
        }
        errorDetails = error.message;
    } else if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            return NextResponse.redirect(`${cleanOrigin}/${locale}/dashboard`)
        }
        errorDetails = error.message;
    }

    // Return to login page on error
    return NextResponse.redirect(`${cleanOrigin}/${locale}/auth/login?error=auth&message=${encodeURIComponent(errorDetails)}`)
}

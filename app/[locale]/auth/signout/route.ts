import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    const locale = request.nextUrl.pathname.split('/')[1] || 'en'
    const supabase = await createClient()

    await supabase.auth.signOut()

    return NextResponse.redirect(new URL(`/${locale}`, request.url), {
        status: 303,
    })
}

export async function GET(request: NextRequest) {
    return POST(request)
}

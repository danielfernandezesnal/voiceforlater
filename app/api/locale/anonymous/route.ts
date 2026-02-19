
import { NextRequest, NextResponse } from "next/server";
import { LOCALE_COOKIE, isValidLocale, Locale } from "@/lib/i18n/locale";

/**
 * POST /api/locale/anonymous
 * Sets the locale cookie for unauthenticated users.
 */
export async function POST(request: NextRequest) {
    try {
        const { locale } = await request.json();

        if (!locale || !isValidLocale(locale)) {
            return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
        }

        const response = NextResponse.json({ success: true, locale });

        response.cookies.set(LOCALE_COOKIE, locale, {
            path: '/',
            maxAge: 60 * 60 * 24 * 365, // 1 year
            // secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });

        return response;

    } catch (e) {
        console.error("Anonymous locale error:", e);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

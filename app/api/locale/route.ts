
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { LOCALE_COOKIE, isValidLocale, Locale } from "@/lib/i18n/locale";

/**
 * POST /api/locale
 * Updates authenticated user's profile and sets the cookie.
 */
export async function POST(request: NextRequest) {
    try {
        const { locale } = await request.json();

        if (!locale || !isValidLocale(locale)) {
            return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Update DB
        const { error } = await supabase
            .from("profiles")
            .update({ locale })
            .eq("id", user.id);

        if (error) {
            console.error("Error updating profile locale:", error);
            // Even if DB fails, should we set cookie? Probably, but risk drift. 
            // Better to fail unless it's just cookie sync.
            // Let's allow drift on DB failure -> fail request to inform client.
            return NextResponse.json({ error: "Database error" }, { status: 500 });
        }

        // Set Cookie
        const response = NextResponse.json({ success: true, locale });
        response.cookies.set(LOCALE_COOKIE, locale, {
            path: '/',
            maxAge: 60 * 60 * 24 * 365, // 1 year
            // secure: process.env.NODE_ENV === 'production', // Vercel sets this automatically usually
            sameSite: 'lax'
        });

        return response;

    } catch (e) {
        console.error("Profile locale error:", e);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

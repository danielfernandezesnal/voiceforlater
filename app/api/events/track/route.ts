import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { trackServerEvent } from "@/lib/analytics/trackEvent";

export const runtime = 'nodejs';

// Simple rate limiter for events: 10 per 10s per user?
// Or global per IP?
// Prompt says "Lightweight rate protection".
// Since this is authenticated (mostly), we can trust auth.
// But prompt mention "user_id if anonymous allowed".
// Let's use IP-based limit from admin utils but with different KEY.
// Actually, `checkRateLimit` is for admin. We should make a generic one or duplicate simple logic.
// Let's make a simple per-IP limit here.

const clients = new Map<string, { count: number, reset: number }>();

function checkEventRate(ip: string): boolean {
    const now = Date.now();
    const record = clients.get(ip);

    if (record && now > record.reset) {
        clients.delete(ip);
    }

    if (!clients.has(ip)) {
        clients.set(ip, { count: 1, reset: now + 60000 }); // 60s window
        return true;
    }

    const current = clients.get(ip)!;
    if (current.count > 100) return false; // 100 events/min seems reasonable for legitimate use

    current.count++;
    return true;
}

export async function POST(request: NextRequest) {
    try {
        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        if (!checkEventRate(ip)) {
            return NextResponse.json({ error: "Too many requests" }, { status: 429 });
        }

        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;

        // Prompt: "Validate authenticated session (optional user_id if anonymous allowed)"
        // If we allow anonymous tracking (e.g. landing page views), we'd need a fingerprint or cookie session.
        // But prompt says "After signup success", "After first message creation". These are authenticated.
        // "When FREE user attempts video" -> Authenticated (in app).
        // "When checkout starts" -> Authenticated.
        // So let's require auth for now unless explicitly needed for landing page.
        // Wait, "Checkout could start" for anonymous via pricing page?
        // But for "product analytics", usually we track user behavior.

        let userId = user?.id;

        const body = await request.json();
        const { event, metadata } = body;

        if (!event) {
            return NextResponse.json({ error: "Event name required" }, { status: 400 });
        }

        // Fire and forget (await for safety in serverless unless verified async works post-response)
        // In Vercel, await is safer to ensure execution before freeze.
        await trackServerEvent({
            event,
            userId,
            metadata: {
                ...metadata,
                ip,
                userAgent: request.headers.get('user-agent')
            }
        });

        return NextResponse.json({ ok: true });
    } catch (e) {
        console.error("Tracking API Error:", e);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/requireAdmin";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, logAdminAction } from "@/lib/admin/utils";

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    const start = Date.now();
    let status = 200;
    let errorMsg = null;
    let userId = null;

    try {
        const ip = request.headers.get('x-forwarded-for') || 'unknown';

        // 1. Rate Limit
        if (!checkRateLimit(ip)) {
            status = 429;
            errorMsg = "Too many requests";
            return NextResponse.json({ error: errorMsg }, { status });
        }

        // 2. Auth & Admin Check
        const { user } = await requireAdmin(); // Ensures auth + admin check
        userId = user.id;

        return NextResponse.json({
            ok: true,
            isAdmin: true,
            user_id: user.id
        });

    } catch (error: any) {
        status = 403;
        errorMsg = error.message || "Forbidden";
        return NextResponse.json(
            { error: errorMsg },
            { status }
        );
    } finally {
        // 3. Audit Log
        if (status !== 429) { // Don't audit rate limit hits to avoid spamming DB? Or audit them with null user?
            // User prompt says "admin_audit_log... admin_user_id... action checked before auth (e.g. rate limit, though we might not log that here)"
            // I'll log requests that passed rate limit.
            // If 403, userId might be null.
            const duration = Date.now() - start;
            await logAdminAction({
                admin_user_id: userId,
                action: 'admin.check',
                meta: { status, error: errorMsg, duration_ms: duration },
                req: request
            });
        }
    }
}

import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/server/requireAdmin";
import { checkRateLimit, logAdminAction } from "@/lib/admin/utils";
import { getErrorMessage } from "@/lib/errors";

export const runtime = 'nodejs';

/**
 * GET /api/admin/kpis/delivery
 * Returns delivery health metrics from telemetry events.
 * Sourced from RPC: public.admin_delivery_metrics
 */
export async function GET(request: NextRequest) {
    const start = Date.now();
    let status = 200;
    let errorMsg = null;
    let userId: string | null = null;

    try {
        const ip = request.headers.get('x-forwarded-for') || 'unknown';

        if (!checkRateLimit(ip)) {
            status = 429;
            errorMsg = "Too many requests";
            return NextResponse.json({ error: errorMsg }, { status });
        }

        // SECURITY: requirement for owner-only access as per admin KPI pattern
        const { supabase, user } = await requireOwner();
        userId = user.id;

        const searchParams = request.nextUrl.searchParams;
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        // Call the SECURITY DEFINER aggregated metrics function
        const { data: metrics, error: rpcError } = await supabase
            .rpc('admin_delivery_metrics', {
                p_date_from: from || null,
                p_date_to: to || null
            });

        if (rpcError) throw rpcError;

        return NextResponse.json(metrics || {});

    } catch (error: unknown) {
        const msg = getErrorMessage(error);
        console.error("Delivery Metrics KPI Error:", error);
        status = msg.includes("Forbidden") ? 403 : 500;
        errorMsg = msg;
        return NextResponse.json(
            { error: errorMsg },
            { status }
        );
    } finally {
        if (status !== 429) {
            const duration = Date.now() - start;
            void logAdminAction({
                admin_user_id: userId,
                action: 'admin.kpi.delivery',
                meta: { status, error: errorMsg, duration_ms: duration },
                req: request
            });
        }
    }
}

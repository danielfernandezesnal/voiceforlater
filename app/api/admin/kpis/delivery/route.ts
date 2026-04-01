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

        // Separate exact 24h query for stall detection
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const { data: stallMetrics, error: stallError } = await supabase
            .rpc('admin_delivery_metrics', {
                p_date_from: last24h.toISOString(),
                p_date_to: now.toISOString()
            });

        if (stallError) throw stallError;

        // Alert computation logic
        const alerts: Array<{ type: string, severity: string, value: number | null }> = [];
        
        // 1. System Stall (evaluates always on real 24h window)
        if (stallMetrics && stallMetrics.total && stallMetrics.total.processed_count === 0) {
            alerts.push({
                 type: "system_stall",
                 severity: "critical",
                 value: 0
            });
        }

        if (metrics && metrics.total) {
            const { processed_count, success_rate, finalize_failed_count, stale_reclaim_count } = metrics.total;

            // 2. Low Success Rate
            if (processed_count > 0 && success_rate < 95) {
                alerts.push({
                    type: "low_success_rate",
                    severity: success_rate < 90 ? "critical" : "warning",
                    value: success_rate
                });
            }

            // 3. Hard Failure
            if (finalize_failed_count > 0) {
                alerts.push({
                    type: "finalize_failure",
                    severity: "critical",
                    value: finalize_failed_count
                });
            }

            // 4. Excessive Reclaims
            if (stale_reclaim_count > 0) {
                alerts.push({
                    type: "reclaim_detected",
                    severity: "warning",
                    value: stale_reclaim_count
                });
            }
        }

        // Derive health status strictly from exhaustive evaluation of computed alerts
        let health_status: 'healthy' | 'warning' | 'critical' = 'healthy';
        const hasCritical = alerts.some(a => a.severity === 'critical');
        if (hasCritical) {
            health_status = 'critical';
        } else if (alerts.length > 0) {
            health_status = 'warning';
        }

        const metricsResponse = {
            ...(metrics || {}),
            alerts,
            health_status
        };

        return NextResponse.json(metricsResponse);

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

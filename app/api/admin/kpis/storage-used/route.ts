import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/server/requireAdmin";
import { checkRateLimit, logAdminAction } from "@/lib/admin/utils";

export const runtime = 'nodejs';

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

        // SECURITY: requirement for owner-only
        const { supabase, user } = await requireOwner();
        userId = user.id;

        const searchParams = request.nextUrl.searchParams;
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        // Call the SECURITY DEFINER SQL function using session client
        const { data: storageMB, error: rpcError } = await supabase
            .rpc('admin_total_storage_mb', {
                start_date: from || null,
                end_date: to || null
            });

        if (rpcError) throw rpcError;

        return NextResponse.json({ storageMB: Number(storageMB) });

    } catch (error: any) {
        console.error("Storage KPI Error:", error);
        status = error.message?.includes("Forbidden") ? 403 : 500;
        errorMsg = error.message || "Internal Server Error";
        return NextResponse.json(
            { error: errorMsg },
            { status }
        );
    } finally {
        if (status !== 429) {
            const duration = Date.now() - start;
            await logAdminAction({
                admin_user_id: userId,
                action: 'admin.kpi.storage_used',
                meta: { status, error: errorMsg, duration_ms: duration },
                req: request
            });
        }
    }
}

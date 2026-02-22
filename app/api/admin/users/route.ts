import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/requireAdmin";
import { checkRateLimit, logAdminAction } from "@/lib/admin/utils";

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    const start = Date.now();
    let status = 200;
    let errorMsg = null;
    let userId: string | null = null;
    let resultCount = 0;

    try {
        const ip = request.headers.get('x-forwarded-for') || 'unknown';

        if (!checkRateLimit(ip)) {
            status = 429;
            errorMsg = "Too many requests";
            return NextResponse.json({ error: errorMsg }, { status });
        }

        const { supabase, user } = await requireAdmin();
        userId = user.id;

        const searchParams = request.nextUrl.searchParams;
        let page = parseInt(searchParams.get('page') || '1', 10);
        if (isNaN(page) || page < 1) page = 1;

        const limit = parseInt(searchParams.get('limit') || '50', 10);
        const search = searchParams.get('search') || '';
        const from = searchParams.get('from') || null;
        const to = searchParams.get('to') || null;

        // Use the highly optimized SECURITY DEFINER RPC
        const { data: users, error: rpcError } = await supabase.rpc('admin_list_users', {
            p_date_from: from,
            p_date_to: to,
            p_page: page,
            p_limit: limit,
            p_search: search || null
        });

        if (rpcError) throw rpcError;

        resultCount = users?.length || 0;
        return NextResponse.json(users || []);

    } catch (err: unknown) {
        console.error("User List Error:", err);
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
        status = errorMessage.includes("Forbidden") ? 403 : 500;
        errorMsg = errorMessage;
        return NextResponse.json(
            { error: errorMsg },
            { status }
        );
    } finally {
        if (status !== 429) {
            const duration = Date.now() - start;
            await logAdminAction({
                admin_user_id: userId,
                action: 'admin.users',
                meta: { status, error: errorMsg, duration_ms: duration, result_count: resultCount },
                req: request
            });
        }
    }
}

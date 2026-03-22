import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/requireAdmin";
import { checkRateLimit, logAdminAction } from "@/lib/admin/utils";

export const runtime = 'nodejs';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const start = Date.now();
    let status = 200;
    let errorMsg = null;
    let adminUserId: string | null = null;

    try {
        const xForwardedFor = request.headers.get('x-forwarded-for');
        const ip = xForwardedFor ? xForwardedFor.split(',')[0].trim() : 'unknown';

        if (!checkRateLimit(ip)) {
            status = 429;
            return NextResponse.json({ error: "RATE_LIMIT" }, { status });
        }

        const { adminClient, user: adminUser } = await requireAdmin();
        adminUserId = adminUser.id;

        const body = await request.json();
        const plan = body.plan; // 'free', 'pro', or null to remove

        if (plan !== null && plan !== 'free' && plan !== 'pro') {
            status = 400;
            errorMsg = "INVALID_PLAN";
            return NextResponse.json({ error: errorMsg }, { status });
        }

        if (plan === null) {
            // Remove override
            const { error } = await adminClient
                .from('admin_overrides')
                .delete()
                .eq('user_id', id);

            if (error) throw error;
        } else {
            // Set/Update override
            const { error } = await adminClient
                .from('admin_overrides')
                .upsert({
                    user_id: id,
                    plan_override: plan,
                    updated_at: new Date().toISOString(),
                    updated_by: adminUserId
                });

            if (error) throw error;
        }

        await logAdminAction({
            admin_user_id: adminUserId,
            action: plan === null ? 'admin.users.override_remove' : 'admin.users.override_set',
            meta: { target_user_id: id, plan, duration_ms: Date.now() - start },
            req: request
        });

        return NextResponse.json({ success: true });

    } catch (err: unknown) {
        console.error("Admin Override Error:", err);
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
        const isAuthError = errorMessage.includes("Forbidden") || errorMessage.includes("Unauthorized");
        status = isAuthError ? 403 : 500;
        const code = isAuthError ? "FORBIDDEN" : "INTERNAL";
        return NextResponse.json({ error: code, details: errorMessage }, { status });
    }
}

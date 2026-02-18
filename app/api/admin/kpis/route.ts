import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/requireAdmin";
import { checkRateLimit, logAdminAction } from "@/lib/admin/utils";

// Simple in-memory cache
// Key: "from|to"
// Value: { data: any, timestamp: number }
const CACHE_TTL_MS = 60 * 1000; // 60 seconds
const kpiCache = new Map<string, { data: any, timestamp: number }>();

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

        // SECURITY FIRST: Always verify admin before ANY logic
        const { adminClient, user } = await requireAdmin();
        userId = user.id;

        const searchParams = request.nextUrl.searchParams;
        const from = searchParams.get('from') || '2000-01-01T00:00:00Z';
        const to = searchParams.get('to') || new Date().toISOString();
        const cacheKey = `${from}|${to}`;

        // Check Cache
        const cached = kpiCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
            // Log cache hit?
            await logAdminAction({
                admin_user_id: userId,
                action: 'admin.kpis.cache_hit',
                meta: { from, to },
                req: request
            });
            return NextResponse.json(cached.data);
        }

        // Count users (approximated by profiles)
        // using count is efficient
        // Note: The previous logic used adminClient which is Service Role, correct.

        const { count: userCount, error: userError } = await adminClient
            .from('profiles') // using profiles as proxy for users since we want date filtering on joined
            .select('*', { count: 'exact', head: true })
            .gte('created_at', from)
            .lte('created_at', to);

        if (userError) throw userError;

        // Paid users (Active) - All time active, filter by date range applies to *what*?
        // Usually "Paid Users" is a current snapshot count, not "users who paid in this range".
        // But prompt says "KPIs cards: from/to ... reload KPIs". 
        // If I filter paid users by created_at, I filter by when they SUBSCRIBED? 
        // User subscriptions has updated_at, maybe created_at?
        // The previous code filtered by created_at only for users/storage/emails.
        // For Paid Users, it just checked status 'active'.
        // If the date range is "Last 30 days", "Paid Users" usually means "Paid users active NOW".
        // But maybe "New Paid Users in range"? The UI just says "Paid Users".
        // I will keep the logic: Current Active Paid Users (Snapshot), or if I should filter, 
        // the prompt implies data depends on range.
        // Let's assume User Count, Storage, Emails depend on range.
        // Paid Users usually is "Total Active Now". If I add date filter, it might mean "Joined in range AND is active".
        // Let's stick to "Total Active" if no date range makes sense, but the previous code didn't filter paid users by date.
        // Wait, line 22 in original didn't have filter. That explains it.

        const { count: paidCount, error: paidError } = await adminClient
            .from('user_subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('plan', 'pro')
            .in('status', ['active', 'trialing']);

        if (paidError && paidError.code !== 'PGRST116') throw paidError;

        // Storage MB
        const { data: storageData, error: storageError } = await adminClient
            .from('messages')
            .select('file_size_bytes')
            .gte('created_at', from)
            .lte('created_at', to);

        if (storageError) throw storageError;

        const totalBytes = storageData?.reduce((sum, m) => sum + (m.file_size_bytes || 0), 0) || 0;
        const storageMb = Math.round((totalBytes / 1024 / 1024) * 100) / 100;

        // Emails sent
        const { count: emailCount, error: emailError } = await adminClient
            .from('email_events')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', from)
            .lte('created_at', to);

        if (emailError && emailError.code !== 'PGRST116') {
            console.warn('Email events error:', emailError);
        }

        const data = {
            total_users: userCount || 0,
            paid_users: paidCount || 0,
            storage_mb: storageMb,
            emails_sent: emailCount || 0
        };

        // Update Cache
        kpiCache.set(cacheKey, { data, timestamp: Date.now() });

        return NextResponse.json(data);

    } catch (error: any) {
        console.error("KPI Error:", error);
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
                action: 'admin.kpis',
                meta: { status, error: errorMsg, duration_ms: duration },
                req: request
            });
        }
    }
}

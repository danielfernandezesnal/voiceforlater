import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/requireAdmin";
import { getAdminClient } from "@/lib/supabase/admin";
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
            return NextResponse.json({ error: "Too many requests" }, { status: 429 });
        }

        const { user } = await requireAdmin();
        userId = user.id;

        const searchParams = request.nextUrl.searchParams;
        const from = searchParams.get('from') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const to = searchParams.get('to') || new Date().toISOString();

        const adminClient = getAdminClient();

        // 1. Fetch Event Counts Grouped by Name
        // Supabase plain query doesn't do "GROUP BY" easily without RPC or raw SQL.
        // But we can fetch raw rows and aggregate in Node for MVP scale.
        // If scale > 10k events, this is slow. 
        // Better: use .rpc() if we could create a function. But "Zero manual DB steps".
        // So we are stuck with fetching rows or using multiple count queries.
        // Let's use multiple count queries for known event types to avoid massive data transfer.


        const knownEvents = [
            'signup.success',
            'milestone.first_message',
            'checkout.started',
            'subscription.created',
            'subscription.canceled',
            'conversion.video_attempt_free',
            'message.created',
            'contact.added'
        ];

        // Parallelize count queries
        const counts = await Promise.all(knownEvents.map(async (evt) => {
            const { count, error: countError } = await adminClient
                .from('product_events')
                .select('*', { count: 'exact', head: true })
                .eq('event_name', evt)
                .gte('created_at', from)
                .lte('created_at', to);

            if (countError) throw countError;
            return { event: evt, count: count || 0 };
        }));

        const dataMap = counts.reduce((acc, curr) => {
            acc[curr.event] = curr.count;
            return acc;
        }, {} as Record<string, number>);

        // Calculate Funnel / Conversion
        // Signup -> First Message
        // Signup -> Pro (rough approximation, assuming unique users in window, which isn't guaranteed by simple count)
        // For accurate conversion rates, we need unique users.
        // Attempt unique counts via memory (fetch user_ids)?
        // If we limit to e.g. 5000 rows, maybe ok.
        // Let's stick to simple counts for "Foundation".

        const analyticsData = {
            counts: dataMap,
            funnel: {
                signups: dataMap['signup.success'] || 0,
                activations: dataMap['milestone.first_message'] || 0,
                checkouts: dataMap['checkout.started'] || 0,
                conversions: dataMap['subscription.created'] || 0
            },
            rates: {
                activation: dataMap['signup.success'] ? Math.round((dataMap['milestone.first_message'] / dataMap['signup.success']) * 100) : 0,
                conversion: dataMap['signup.success'] ? Math.round((dataMap['subscription.created'] / dataMap['signup.success']) * 100) : 0
            }
        };

        return NextResponse.json(analyticsData);

    } catch (error: any) {
        // --- Fallback Logic: If product_events table missing, derive analytics from core tables ---
        if (error && (error.code === 'PGRST205' || error.code === '42P01')) {
            console.warn("Analytics table missing, falling back to core table derivation.");
            const adminClient = getAdminClient(); // Re-initialize if needed, or use existing one

            // 1. Total Users (Rough estimation via public.users or RPC if available)
            // We'll try to get count from 'user_roles' or 'user_subscriptions' which usually exist for all users if synced.
            // Or use the 'users' table if we have one (Step 7 mentioned 'admin_list_users' uses auth.users directly).
            // We can't access auth.users via PostgREST. 
            // We CAN access it via adminClient.auth.admin but that's slow for count.
            // Let's use user_subscriptions count as a proxy for "users who reached dashboard".

            const { count: usersCount } = await adminClient.from('user_subscriptions').select('*', { count: 'exact', head: true });

            // 2. Activations (Messages)
            // Count unique users who sent a message. PostgREST doesn't do distinct count easily on head.
            // We'll use total messages count as a proxy for "activity".
            const { count: messagesCount } = await adminClient.from('messages').select('*', { count: 'exact', head: true });

            // 3. Conversions (Pro)
            const { count: proCount } = await adminClient
                .from('user_subscriptions')
                .select('*', { count: 'exact', head: true })
                .eq('plan', 'pro');

            const total = usersCount || 0;
            const active = messagesCount || 0; // This is message count, not unique users, but it's "activity".
            const pro = proCount || 0;

            const fallbackData = {
                counts: {
                    'signup.success': total,
                    'message.created': active,
                    'subscription.created': pro,
                    'system.fallback_mode': 1
                },
                funnel: {
                    signups: total,
                    activations: active,
                    conversions: pro
                },
                rates: {
                    activation: total ? Math.round((active / total) * 100) : 0,
                    conversion: total ? Math.round((pro / total) * 100) : 0
                }
            };

            return NextResponse.json(fallbackData);
        }

        // If it's not a missing table error, or if fallback also fails, then re-throw or handle as generic error
        console.error("Analytics Error:", error);
        status = error.message?.includes("Forbidden") ? 403 : 500;
        errorMsg = error.message || "Internal Server Error";
        return NextResponse.json({ error: errorMsg }, { status });
    } finally {
        if (status === 200) {
            // Only log analytics access?
            // Maybe skip logging reads to avoid noise or keep it for strict audit.
            // Prompt says "Audit Logger...". Let's log.
            await logAdminAction({
                admin_user_id: userId,
                action: 'admin.analytics.view',
                meta: { status, duration_ms: Date.now() - start },
                req: request
            });
        }
    }
}

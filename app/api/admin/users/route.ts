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
    let resultCount = 0;

    try {
        const ip = request.headers.get('x-forwarded-for') || 'unknown';

        if (!checkRateLimit(ip)) {
            status = 429;
            errorMsg = "Too many requests";
            return NextResponse.json({ error: errorMsg }, { status });
        }

        const { adminClient, user } = await requireAdmin();
        userId = user.id;

        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '20', 10);
        const search = searchParams.get('search') || '';

        // Fetch users from Auth Admin API
        const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers({
            page: page,
            perPage: limit,
        });

        if (listError) throw listError;

        let userList = users;
        // Basic search filter if API didn't support it (Supabase ListUsers has specific behavior)
        if (search) {
            const q = search.toLowerCase();
            userList = users.filter(u => u.email?.toLowerCase().includes(q));
        }

        // Enrich with profile/subscription data
        const enrichedUsers = await Promise.all(userList.map(async (u) => {
            // Get Plan
            const { data: sub } = await adminClient
                .from('user_subscriptions')
                .select('plan, status')
                .eq('user_id', u.id)
                .single();

            // Get Messages Count
            const { count: msgCount } = await adminClient
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('owner_id', u.id);

            // Get Storage
            const { data: msgs } = await adminClient
                .from('messages')
                .select('file_size_bytes')
                .eq('owner_id', u.id);
            const storage = msgs?.reduce((acc, m) => acc + (m.file_size_bytes || 0), 0) || 0;

            // Get Emails Sent
            // Include failed ones if we updated schema, but sticking to existing pattern for now
            const { count: emailCount } = await adminClient
                .from('email_events')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', u.id);

            // Get Contacts Count (Requested in Step 3 drilldown)
            const { count: contactsCount } = await adminClient
                .from('trusted_contacts')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', u.id);

            return {
                id: u.id,
                email: u.email,
                created_at: u.created_at,
                plan: sub?.plan || 'free',
                status: sub?.status || 'inactive',
                messages_count: msgCount || 0,
                storage_mb: Math.round((storage / 1024 / 1024) * 100) / 100,
                emails_sent: emailCount || 0,
                contacts_count: contactsCount || 0
            };
        }));

        resultCount = enrichedUsers.length;
        return NextResponse.json(enrichedUsers);

    } catch (error: any) {
        console.error("User List Error:", error);
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
                action: 'admin.users',
                meta: { status, error: errorMsg, duration_ms: duration, result_count: resultCount },
                req: request
            });
        }
    }
}

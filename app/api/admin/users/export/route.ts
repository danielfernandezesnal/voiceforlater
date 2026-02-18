import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server/requireAdmin';
import { getAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit, logAdminAction } from "@/lib/admin/utils";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
    const start = Date.now();
    let status = 200;
    let errorMsg = null;
    let userId: string | null = null;
    let recordCount = 0;

    try {
        const ip = request.headers.get('x-forwarded-for') || 'unknown';

        if (!checkRateLimit(ip)) {
            status = 429;
            errorMsg = "Too many requests";
            return NextResponse.json({ error: errorMsg }, { status });
        }

        const { user } = await requireAdmin();
        userId = user.id;

        const { searchParams } = new URL(request.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const search = searchParams.get('search');

        const supabase = getAdminClient();

        // Base query for users
        let query = supabase.auth.admin.listUsers({
            page: 1,
            perPage: 1000 // Reasonable limit for CSV export
        });

        const { data: { users }, error } = await query;

        if (error) throw error;

        // Apply filters in memory
        let filteredUsers = users;

        if (from) {
            const fromDate = new Date(from);
            filteredUsers = filteredUsers.filter(u => new Date(u.created_at) >= fromDate);
        }
        if (to) {
            // Include the whole 'to' day
            const toDate = new Date(to);
            toDate.setDate(toDate.getDate() + 1);
            filteredUsers = filteredUsers.filter(u => new Date(u.created_at) < toDate);
        }
        if (search) {
            const q = search.toLowerCase();
            filteredUsers = filteredUsers.filter(u => u.email?.toLowerCase().includes(q));
        }

        // Enrich Data (User Subscriptions + Metrics)
        const enrichedUsers = await Promise.all(filteredUsers.map(async (u) => {
            // Get Plan
            const { data: sub } = await supabase
                .from('user_subscriptions')
                .select('plan, status')
                .eq('user_id', u.id)
                .single();

            // Get Message Count
            const { count: messagesCount } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('owner_id', u.id);

            // Get Contacts Count
            const { count: contactsCount } = await supabase
                .from('trusted_contacts')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', u.id);

            // Get Storage
            const { data: messages } = await supabase
                .from('messages')
                .select('file_size_bytes')
                .eq('owner_id', u.id);

            const totalBytes = messages?.reduce((acc, m) => acc + (m.file_size_bytes || 0), 0) || 0;
            const storageMB = (totalBytes / (1024 * 1024)).toFixed(2);

            // Get Emails Sent
            const { count: emailsCount } = await supabase
                .from('email_events')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', u.id);

            return {
                id: u.id,
                email: u.email,
                created_at: u.created_at,
                plan_status: sub ? `${sub.plan} (${sub.status})` : 'free (inactive)',
                messages_count: messagesCount || 0,
                contacts_count: contactsCount || 0,
                storage_mb: storageMB,
                emails_sent: emailsCount || 0
            };
        }));

        recordCount = enrichedUsers.length;

        // Generate CSV
        const headers = ['user_id', 'email', 'created_at', 'plan_status', 'messages_count', 'contacts_count', 'storage_mb', 'emails_sent'];
        const csvRows = [headers.join(',')];

        for (const user of enrichedUsers) {
            csvRows.push([
                user.id,
                user.email || '',
                user.created_at,
                `"${user.plan_status}"`,
                user.messages_count,
                user.contacts_count,
                user.storage_mb,
                user.emails_sent
            ].join(','));
        }

        const csvContent = csvRows.join('\n');

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });

    } catch (error: any) {
        console.error('Export Error:', error);
        status = error.message?.includes("Forbidden") ? 403 : 500;
        errorMsg = error.message || "Internal Server Error";
        return NextResponse.json({ error: errorMsg }, { status });
    } finally {
        if (status !== 429) {
            const duration = Date.now() - start;
            await logAdminAction({
                admin_user_id: userId,
                action: 'admin.users.export',
                meta: { status, error: errorMsg, duration_ms: duration, records: recordCount },
                req: request
            });
        }
    }
}

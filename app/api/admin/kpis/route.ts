import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // Verify admin access
        await requireAdmin();

        const { searchParams } = new URL(request.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        const supabase = createAdminClient();

        // Build date filter for queries
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dateFilter = (query: any, field: string) => {
            if (from) {
                query = query.gte(field, from);
            }
            if (to) {
                query = query.lte(field, to);
            }
            return query;
        };

        // 1. Total registered users
        let usersQuery = supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        usersQuery = dateFilter(usersQuery, 'created_at');
        const { count: totalUsers } = await usersQuery;

        // 2. Total paid users (has active subscription)
        let paidUsersQuery = supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('plan', 'pro');

        paidUsersQuery = dateFilter(paidUsersQuery, 'created_at');
        const { count: paidUsers } = await paidUsersQuery;

        // 3. Total storage used (sum file_size_bytes)
        const { data: storageData } = await supabase
            .from('messages')
            .select('file_size_bytes');

        const totalStorageBytes = storageData?.reduce((sum, msg) => {
            return sum + (msg.file_size_bytes || 0);
        }, 0) || 0;

        const totalStorageMB = (totalStorageBytes / (1024 * 1024)).toFixed(2);

        // 4. Emails sent
        let emailsQuery = supabase
            .from('email_events')
            .select('*', { count: 'exact', head: true });

        emailsQuery = dateFilter(emailsQuery, 'created_at');
        const { count: emailsSent } = await emailsQuery;

        // Get today's counts for comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISO = today.toISOString();

        const { count: usersToday } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', todayISO);

        const { count: paidToday } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('plan', 'pro')
            .gte('created_at', todayISO);

        const { count: emailsToday } = await supabase
            .from('email_events')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', todayISO);

        return NextResponse.json({
            totalUsers: totalUsers || 0,
            usersToday: usersToday || 0,
            paidUsers: paidUsers || 0,
            paidToday: paidToday || 0,
            totalStorageMB: parseFloat(totalStorageMB),
            totalStorageBytes,
            emailsSent: emailsSent || 0,
            emailsToday: emailsToday || 0,
            dateRange: {
                from: from || null,
                to: to || null,
            },
        });
    } catch (error) {
        console.error('Admin KPIs error:', error);

        if (error instanceof Error && error.message.includes('Unauthorized')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

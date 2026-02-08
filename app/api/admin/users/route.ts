import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // Verify admin access
        await requireAdmin();

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '25');
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        const supabase = createAdminClient();

        // Get all users with their email from auth.users
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({
            page,
            perPage: pageSize,
        });

        if (authError) {
            throw authError;
        }

        // Get profile and message data for these users
        const userIds = authUsers.users.map(u => u.id);

        // Get profiles
        let profilesQuery = supabase
            .from('profiles')
            .select('*')
            .in('id', userIds);

        const { data: profiles } = await profilesQuery;

        // Get message counts and storage per user
        const { data: messageCounts } = await supabase
            .from('messages')
            .select('owner_id, type, file_size_bytes')
            .in('owner_id', userIds);

        // Aggregate message data
        const userStats = userIds.map(userId => {
            const userMessages = messageCounts?.filter(m => m.owner_id === userId) || [];
            const profile = profiles?.find(p => p.id === userId);
            const authUser = authUsers.users.find(u => u.id === userId);

            return {
                id: userId,
                email: authUser?.email || '',
                plan: profile?.plan || 'free',
                isPro: profile?.plan === 'pro',
                textMessages: userMessages.filter(m => m.type === 'text').length,
                audioMessages: userMessages.filter(m => m.type === 'audio').length,
                videoMessages: userMessages.filter(m => m.type === 'video').length,
                storageBytes: userMessages.reduce((sum, m) => sum + (m.file_size_bytes || 0), 0),
                storageMB: (userMessages.reduce((sum, m) => sum + (m.file_size_bytes || 0), 0) / (1024 * 1024)).toFixed(2),
                createdAt: profile?.created_at || authUser?.created_at || '',
            };
        });

        // Filter by search if provided
        let filteredUsers = userStats;
        if (search) {
            const searchLower = search.toLowerCase();
            filteredUsers = userStats.filter(u =>
                u.email.toLowerCase().includes(searchLower)
            );
        }

        // Filter by date range if provided (based on creation date)
        if (from) {
            filteredUsers = filteredUsers.filter(u => new Date(u.createdAt) >= new Date(from));
        }
        if (to) {
            filteredUsers = filteredUsers.filter(u => new Date(u.createdAt) <= new Date(to));
        }

        // Get total count for pagination
        const total = filteredUsers.length;
        const totalPages = Math.ceil(total / pageSize);

        return NextResponse.json({
            users: filteredUsers,
            pagination: {
                page,
                pageSize,
                total,
                totalPages,
            },
        });
    } catch (error) {
        console.error('Admin users list error:', error);

        if (error instanceof Error && error.message.includes('Unauthorized')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        return NextResponse.json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

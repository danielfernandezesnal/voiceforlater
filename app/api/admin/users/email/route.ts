import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
    try {
        // Verify admin access
        await requireAdmin();

        const { userId, newEmail } = await request.json();

        if (!userId || !newEmail) {
            return NextResponse.json({
                error: 'User ID and new email are required'
            }, { status: 400 });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
            return NextResponse.json({
                error: 'Invalid email format'
            }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Update user email in auth.users
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            userId,
            { email: newEmail }
        );

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({ success: true, email: newEmail });
    } catch (error) {
        console.error('Admin update user email error:', error);

        if (error instanceof Error && error.message.includes('Unauthorized')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        return NextResponse.json({
            error: 'Failed to update user email',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

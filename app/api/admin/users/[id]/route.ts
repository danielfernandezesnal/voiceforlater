import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Verify admin access
        await requireAdmin();

        const { id: userId } = params;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Get user's messages to delete associated storage files
        const { data: messages } = await supabase
            .from('messages')
            .select('audio_path')
            .eq('owner_id', userId);

        // Delete storage files
        if (messages && messages.length > 0) {
            const filesToDelete = messages
                .filter(m => m.audio_path)
                .map(m => m.audio_path as string);

            if (filesToDelete.length > 0) {
                await supabase.storage.from('audio').remove(filesToDelete);
            }
        }

        // Delete user from auth (cascades to profiles and related data via DB constraints)
        const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

        if (deleteError) {
            throw deleteError;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Admin delete user error:', error);

        if (error instanceof Error && error.message.includes('Unauthorized')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        return NextResponse.json({
            error: 'Failed to delete user',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server/requireAdmin';
import { logAdminAction } from '@/lib/admin/utils';

export const dynamic = 'force-dynamic';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const start = Date.now();
    let adminUserId: string | null = null;
    const { id: userId } = await params;

    try {
        // Verify admin access (stricter check from lib/server)
        const { adminClient, user: adminUser } = await requireAdmin();
        adminUserId = adminUser.id;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Get user's messages to delete associated storage files
        const { data: messages } = await adminClient
            .from('messages')
            .select('audio_path')
            .eq('owner_id', userId);

        // Delete storage files
        if (messages && messages.length > 0) {
            const filesToDelete = messages
                .filter(m => m.audio_path)
                .map(m => m.audio_path as string);

            if (filesToDelete.length > 0) {
                // Delete in batch using admin permissions
                const { error: storageError } = await adminClient.storage.from('audio').remove(filesToDelete);
                if (storageError) console.error('Storage Delete Error:', storageError);
            }
        }

        // Delete user from auth (cascades to public.profiles and related data via DB foreign keys with ON DELETE CASCADE)
        const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

        if (deleteError) {
            throw deleteError;
        }

        // Log the action to the audit log
        await logAdminAction({
            admin_user_id: adminUserId,
            action: 'admin.users.delete',
            meta: { target_user_id: userId, duration_ms: Date.now() - start },
            req: request
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Admin delete user error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const status = errorMessage.includes('Forbidden') || errorMessage.includes('Unauthorized') ? 403 : 500;

        return NextResponse.json({
            error: 'Failed to delete user',
            details: errorMessage
        }, { status });
    }
}

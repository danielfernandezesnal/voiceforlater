import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Check if the current authenticated user is an admin
 * Uses server-side auth check
 */
export async function isAdmin(): Promise<boolean> {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        return profile?.is_admin === true;
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

/**
 * Get current admin user ID if authenticated as admin
 */
export async function getAdminUserId(): Promise<string | null> {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        return profile?.is_admin === true ? user.id : null;
    } catch (error) {
        console.error('Error getting admin user ID:', error);
        return null;
    }
}

/**
 * Verify admin status and throw if not admin
 * Use this in API routes that require admin access
 */
export async function requireAdmin(): Promise<string> {
    const adminId = await getAdminUserId();
    if (!adminId) {
        throw new Error('Unauthorized: Admin access required');
    }
    return adminId;
}

/**
 * Set admin flag for a user (service role only)
 * This should only be called from secure scripts/migrations
 */
export async function setUserAsAdmin(userId: string): Promise<void> {
    const supabase = createAdminClient();

    const { error } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('id', userId);

    if (error) {
        throw new Error(`Failed to set admin: ${error.message}`);
    }
}

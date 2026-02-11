import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { User } from '@supabase/supabase-js';
import { ADMIN_EMAIL } from '@/lib/constants';

const ADMIN_EMAILS = [
    ADMIN_EMAIL
];

/**
 * Check if user is admin by email (hardcoded list)
 * Synchronous, useful for middleware
 */
export function isAdminEmail(user: User | null | undefined): boolean {
    if (!user || !user.email) return false;
    const email = user.email.toLowerCase().trim();
    return ADMIN_EMAILS.includes(email);
}

/**
 * Check if the current authenticated user is an admin
 * Uses server-side auth check
 */
export async function isAdmin(): Promise<boolean> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        // Check email list first (fast)
        if (isAdminEmail(user)) return true;

        const adminClient = createAdminClient();
        // Use adminClient to bypass RLS recursion
        const { data: profile } = await adminClient
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

        // Check email list
        if (isAdminEmail(user)) return user.id;

        const adminClient = createAdminClient();
        const { data: profile } = await adminClient
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

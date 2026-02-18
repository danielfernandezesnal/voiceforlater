import 'server-only';
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

// Prevent client-side bundling
if (typeof window !== 'undefined') {
    throw new Error('This module can only be imported on the server.');
}

/**
 * Server-side helper to strictly enforce admin access.
 * Since check_if_admin RPC cannot be migrated without SQL access,
 * we verify directly against user_roles using Service Role client.
 */
export async function requireAdmin() {
    const supabaseUser = await createClient();
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

    if (authError || !user) {
        throw new Error("Unauthorized: No active session");
    }

    // Use Service Role Admin Client to verify user_roles
    const adminClient = getAdminClient();
    const { data: userRole, error: roleError } = await adminClient
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

    // Also check profiles.is_admin as fallback/legacy
    if (roleError && roleError.code === 'PGRST116') {
        // No row in user_roles. Try profiles.is_admin if table exists
        const { data: profile, error: profileError } = await adminClient
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        if (profileError || !profile?.is_admin) {
            throw new Error("Forbidden: Admin privileges required");
        }
    } else if (roleError) {
        // DB error other than "not found"
        throw new Error(`Admin check failed: ${roleError.message}`);
    } else {
        // Role check passed?
        if (!['admin', 'owner'].includes(userRole.role)) {
            throw new Error("Forbidden: Insufficient privileges");
        }
    }

    return { user, supabase: supabaseUser, adminClient };
}

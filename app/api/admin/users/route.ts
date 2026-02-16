import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Check Owner/Admin permissions
        const { data: requesterRole, error: roleError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .single();

        if (roleError || !requesterRole || requesterRole.role !== 'owner') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // 2. Use Admin Client to fetch users directly (bypassing broken RPC)
        const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        // Fetch all users from Auth (limit 1000 for now, pagination needed for large scale)
        const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers({
            perPage: 1000
        });

        if (authError) {
            console.error("Error fetching auth users:", authError);
            throw authError;
        }

        // Fetch all roles
        const { data: userRoles, error: rolesError } = await supabaseAdmin
            .from("user_roles")
            .select("user_id, role");

        if (rolesError) {
            console.error("Error fetching roles:", rolesError);
            throw rolesError;
        }

        // 3. Merge data
        const rolesMap = new Map();
        if (userRoles) {
            userRoles.forEach((r: { user_id: string; role: string }) => rolesMap.set(r.user_id, r.role));
        }

        const combinedUsers = authUsers.map(u => ({
            id: u.id,
            email: u.email,
            role: rolesMap.get(u.id) || 'user',
            created_at: u.created_at,
            last_sign_in_at: u.last_sign_in_at
        }));

        // Sort by created_at DESC
        combinedUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        return NextResponse.json({ __fingerprint: "RBAC_USERS_V1", users: combinedUsers });

    } catch (error) {
        console.error("Unexpected error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

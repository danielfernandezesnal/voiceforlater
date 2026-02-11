import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Check Owner/Admin permissions (Ideally, the RPC function does this too, but double check is good)
        // Actually, the prompt says "Admin/Users", but specifically "Owner".
        // Let's assume ONLY owner can see user emails for role modification.

        const { data: requesterRole, error: roleError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .single();

        if (roleError || !requesterRole || requesterRole.role !== 'owner') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // 2. Call the RPC function
        const { data: users, error } = await supabase
            .rpc('admin_list_users');

        if (error) {
            console.error("Error fetching users:", error);
            // If function doesn't exist yet, this will error.
            return NextResponse.json({ error: "Database error or permission denied" }, { status: 500 });
        }

        return NextResponse.json({ __fingerprint: "RBAC_USERS_V1", users });

    } catch (error) {
        console.error("Unexpected error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

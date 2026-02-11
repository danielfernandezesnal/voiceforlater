import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Verify that the requester is an OWNER
        const { data: requesterRole, error: roleError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .single();

        if (roleError || !requesterRole || requesterRole.role !== 'owner') {
            return NextResponse.json({ error: "Forbidden: Only owners can update roles" }, { status: 403 });
        }

        // 2. Parse body
        const body = await request.json();
        const { userId, newRole } = body;

        if (!userId || !newRole) {
            return NextResponse.json({ error: "Missing userId or newRole" }, { status: 400 });
        }

        const allowedRoles = ['owner', 'admin', 'support', 'ops', 'user'];
        if (!allowedRoles.includes(newRole)) {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }

        // 3. Prevent self-demotion (an owner cannot change their own role via this endpoint to avoid locking themselves out)
        if (userId === user.id) {
            return NextResponse.json({ error: "You cannot change your own role." }, { status: 400 });
        }

        // 4. Update the role
        // Ideally we should use upsert? Or update?
        // If the target user doesn't have a role row yet, we should insert it.
        // If they do, update it.

        // However, if newRole is 'user', maybe we want to DELETE the row (if 'user' means no special role)?
        // The prompt says "UPDATE public.user_roles SET role = newRole".
        // Let's assume 'user' is just absence of role or a specific role.
        // If the prompt implies `user_roles` is for privileged access, maybe 'user' means deleting the row.
        // But let's stick to the prompt's update instruction implicitly, but assume we might need to INSERT if not exists.

        // Actually, let's use upsert to be safe.

        const { error: updateError } = await supabase
            .from("user_roles")
            .upsert({
                user_id: userId,
                role: newRole,
                // created_at is default now(), updated_at? table doesn't have it in the prompt schema.
            }, { onConflict: 'user_id' });

        if (updateError) {
            console.error("Error updating role:", updateError);
            return NextResponse.json({ error: "Database error" }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Unexpected error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

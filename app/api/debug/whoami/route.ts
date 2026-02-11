import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json(
            { ok: false, error: "Unauthorized" },
            { status: 401 }
        );
    }

    // Use the secure view 'my_role' which automatically filters by auth.uid()
    const { data: roleData, error: viewError } = await supabase
        .from("my_role")
        .select("role")
        .single();

    const role = roleData?.role || null;

    return NextResponse.json({
        ok: true,
        userId: user.id,
        email: user.email,
        role: role,
        viewError: viewError ? viewError.message : null,
        isOwner: role === "owner",
        isAdmin: role === "admin" || role === "owner",
    });
}

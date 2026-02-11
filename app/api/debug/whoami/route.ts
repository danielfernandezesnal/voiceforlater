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

    const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

    const role = roleData?.role || null;

    return NextResponse.json({
        ok: true,
        userId: user.id,
        email: user.email,
        role: role,
        isOwner: role === "owner",
        isAdmin: role === "admin" || role === "owner",
    });
}

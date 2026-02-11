
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    // 1. Cliente normal (usuario autenticado)
    const supabaseUser = await createServerClient();
    const {
        data: { user },
    } = await supabaseUser.auth.getUser();

    if (!user) {
        return NextResponse.json(
            { ok: false, error: "Unauthorized" },
            { status: 401 }
        );
    }

    // Consulta con RLS (lo que falla actualmente)
    const { data: rlsData, error: rlsError } = await supabaseUser
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

    // 2. Cliente Admin (Service Role - Bypass RLS)
    // Nota: Usamos NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY del entorno
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    let adminData = null;
    let adminError = null;

    if (serviceRoleKey && supabaseUrl) {
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
        const result = await supabaseAdmin
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .single();

        adminData = result.data;
        adminError = result.error;
    } else {
        adminError = { message: "Missing SUPABASE_SERVICE_ROLE_KEY in env" };
    }

    return NextResponse.json({
        user: {
            id: user.id,
            email: user.email
        },
        rlsCheck: {
            role: rlsData?.role || null,
            error: rlsError,
            status: "Checked with user session (RLS active)"
        },
        adminCheck: {
            role: adminData?.role || null,
            error: adminError,
            status: "Checked with service role (RLS bypassed)"
        },
        diagnosis: {
            isRlsIssue: !rlsData && !!adminData,
            isDatabaseIssue: !rlsData && !adminData,
            missingEnv: !serviceRoleKey
        }
    });
}

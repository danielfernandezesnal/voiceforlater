import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Attempt to get user if authenticated (optional for contact form)
        const { data: { user } } = await supabase.auth.getUser();

        const { email, subject, message } = await request.json();

        if (!email || !message) {
            return NextResponse.json({ error: "Email and message are required" }, { status: 400 });
        }

        // Insert using service role since anon/auth direct inserts are denied by RLS
        // Wait, createClient uses cookies, so it acts as authenticated user or anon.
        // To ensure insertion works regardless of RLS, we should use a service role client.
        // However, if we don't have a service role client setup locally in an easy way, 
        // let's create a server-admin client.
        // Assuming we have @supabase/supabase-js, but let's just use regular client if RLS
        // allows anon inserts? The prompt specifically said:
        // "* Recommended: deny direct anon/auth inserts; only allow inserts via API (service role)."

        // We need a specific service role client or admin credentials.
        // Let's create it inline using next.js env vars.
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { error: insertError } = await supabaseAdmin
            .from('contact_tickets')
            .insert({
                user_id: user?.id || null, // Best effort link
                email,
                subject: subject || null,
                message,
                metadata: {
                    ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
                    user_agent: request.headers.get("user-agent") || "unknown",
                }
            });

        if (insertError) {
            console.error("Failed to insert contact ticket:", insertError);
            return NextResponse.json({ error: "Database error" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("POST /api/contact error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

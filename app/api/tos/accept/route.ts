import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { REQUIRED_TOS_VERSION } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { version } = await request.json();

        if (version !== REQUIRED_TOS_VERSION) {
            return NextResponse.json({ error: "Invalid generic Terms version" }, { status: 400 });
        }

        const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
        const userAgent = request.headers.get("user-agent") || "unknown";

        // Update profile
        const { error: updateError } = await supabase
            .from("profiles")
            .update({
                tos_version: REQUIRED_TOS_VERSION,
                tos_accepted_at: new Date().toISOString(),
            })
            .eq("id", user.id);

        if (updateError) {
            console.error("Failed to update ToS profile status:", updateError);
            return NextResponse.json({ error: "Database error" }, { status: 500 });
        }

        // Publish event
        // Service role bypass or just standard auth insert via RLS
        const { error: eventError } = await supabase
            .from("events")
            .insert({
                type: "tos_accepted",
                user_id: user.id,
                metadata: {
                    version: REQUIRED_TOS_VERSION,
                    ip_address: ipAddress,
                    user_agent: userAgent,
                },
            });

        if (eventError) {
            console.error("Failed to record ToS audit event:", eventError);
        }

        return NextResponse.json({ success: true, version: REQUIRED_TOS_VERSION });
    } catch (error) {
        console.error("POST /api/tos/accept error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

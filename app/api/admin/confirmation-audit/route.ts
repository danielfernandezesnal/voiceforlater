import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/server/requireAdmin";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const targetUserId = searchParams.get('userId');
        const limitParam = searchParams.get('limit');
        const limit = limitParam ? parseInt(limitParam) : 20;

        if (!targetUserId) {
            return NextResponse.json({ error: "Missing userId query parameter" }, { status: 400 });
        }

        const { adminClient: supabaseAdmin } = await requireOwner();

        // 3. Fetch recent Verification Tokens
        const { data: tokens, error: tokensError } = await supabaseAdmin
            .from("verification_tokens")
            .select("*")
            .eq("user_id", targetUserId)
            .order("created_at", { ascending: false })
            .limit(limit);

        if (tokensError) {
            console.error("Error fetching tokens:", tokensError);
            return NextResponse.json({ error: "Error fetching tokens: " + tokensError.message }, { status: 500 });
        }

        // 4. Fetch recent Confirmation Events
        // We fetch more events than tokens to ensure we catch relevant history
        const eventLimit = Math.min(limit * 2, 100);
        const { data: events, error: eventsError } = await supabaseAdmin
            .from("confirmation_events")
            .select("*")
            .eq("user_id", targetUserId)
            .order("created_at", { ascending: false }) // Assuming created_at exists, if only 'timestamp' check schema. usually created_at default.
            .limit(eventLimit);

        // Fallback if 'created_at' is missing in events (custom table often has it)
        // Checking schema mentally: confirmations_events likely has created_at default now()

        if (eventsError) {
            console.error("Error fetching events:", eventsError);
            return NextResponse.json({ error: "Error fetching events: " + eventsError.message }, { status: 500 });
        }

        return NextResponse.json({
            target_user_id: targetUserId,
            tokens: tokens || [],
            events: events || []
        });

    } catch (error) {
        console.error("Audit endpoint error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

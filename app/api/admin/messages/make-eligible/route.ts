import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    try {
        const { supabase } = await requireAdmin();

        const body = await request.json();
        const { messageId } = body;
        if (!messageId || typeof messageId !== "string") {
            return NextResponse.json({ error: "messageId is required" }, { status: 400 });
        }

        // Verify message exists and is scheduled
        const { data: message, error: msgError } = await supabase
            .from("messages")
            .select("id, status")
            .eq("id", messageId)
            .single();

        if (msgError || !message) {
            return NextResponse.json({ error: "Message not found" }, { status: 404 });
        }
        if (message.status !== "scheduled") {
            return NextResponse.json({ error: `Message status is '${message.status}', expected 'scheduled'` }, { status: 400 });
        }

        // Verify delivery rule exists and uses date mode
        const { data: rule, error: ruleError } = await supabase
            .from("delivery_rules")
            .select("mode")
            .eq("message_id", messageId)
            .single();

        if (ruleError || !rule) {
            return NextResponse.json({ error: "Delivery rule not found" }, { status: 404 });
        }
        if (rule.mode !== "date") {
            return NextResponse.json({ error: `Delivery mode is '${rule.mode}', expected 'date'` }, { status: 400 });
        }

        // Set deliver_at to 1 minute ago — immediately eligible for cron
        const eligibleAt = new Date(Date.now() - 60 * 1000).toISOString();
        const { error: updateError } = await supabase
            .from("delivery_rules")
            .update({ deliver_at: eligibleAt })
            .eq("message_id", messageId);

        if (updateError) {
            console.error("[make-eligible] Update failed:", updateError);
            return NextResponse.json({ error: "Failed to update delivery rule" }, { status: 500 });
        }

        console.log(`[make-eligible] message ${messageId} set to eligible at ${eligibleAt}`);
        return NextResponse.json({ success: true, eligibleAt });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message.startsWith("Unauthorized")) {
                return NextResponse.json({ error: error.message }, { status: 401 });
            }
            if (error.message.startsWith("Forbidden")) {
                return NextResponse.json({ error: error.message }, { status: 403 });
            }
        }
        console.error("[make-eligible] Unexpected error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

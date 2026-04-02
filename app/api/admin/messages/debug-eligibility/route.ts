import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Must stay in sync with app/api/cron/process-messages/route.ts
const DELIVERY_CLAIM_TIMEOUT_MINUTES = 15;

export async function POST(request: NextRequest) {
    try {
        const { adminClient } = await requireAdmin();

        const body = await request.json();
        const { messageId } = body;
        if (!messageId || typeof messageId !== "string") {
            return NextResponse.json({ error: "messageId is required" }, { status: 400 });
        }

        const now = new Date();
        const staleThreshold = new Date(now.getTime() - DELIVERY_CLAIM_TIMEOUT_MINUTES * 60 * 1000);

        // Same join shape as the cron query (service role — bypasses RLS)
        const { data: message, error: msgError } = await adminClient
            .from("messages")
            .select(`
                id,
                status,
                delivery_claimed_at,
                delivery_rules (
                    mode,
                    deliver_at
                ),
                recipients (
                    email
                )
            `)
            .eq("id", messageId)
            .single();

        if (msgError || !message) {
            return NextResponse.json(
                { error: "Message not found", details: msgError?.message ?? null },
                { status: 404 }
            );
        }

        const rules = Array.isArray(message.delivery_rules)
            ? message.delivery_rules
            : [message.delivery_rules];
        const rule = rules[0] ?? null;

        const recipients = Array.isArray(message.recipients)
            ? message.recipients
            : [message.recipients];
        const recipient = recipients[0] ?? null;

        // Mirror exact conditions from process-messages/route.ts lines 63-66 + 116
        const status_is_scheduled = message.status === "scheduled";
        const mode_is_date = rule?.mode === "date";
        const deliver_at_is_due =
            rule?.deliver_at != null && new Date(rule.deliver_at as string) <= now;
        const claimedAt = message.delivery_claimed_at
            ? new Date(message.delivery_claimed_at as string)
            : null;
        const unclaimed_or_stale = claimedAt === null || claimedAt < staleThreshold;
        const has_recipient = !!(recipient?.email);

        const eligible_for_cron =
            status_is_scheduled &&
            mode_is_date &&
            deliver_at_is_due &&
            unclaimed_or_stale &&
            has_recipient;

        const blocking_reasons: string[] = [];
        if (!status_is_scheduled)
            blocking_reasons.push(
                `status is '${message.status}' — expected 'scheduled'`
            );
        if (!mode_is_date)
            blocking_reasons.push(
                `delivery mode is '${rule?.mode ?? "missing"}' — expected 'date'`
            );
        if (!deliver_at_is_due)
            blocking_reasons.push(
                `deliver_at is '${rule?.deliver_at ?? "missing"}' — server now is '${now.toISOString()}' — not yet due`
            );
        if (!unclaimed_or_stale)
            blocking_reasons.push(
                `delivery_claimed_at is '${message.delivery_claimed_at}' — not stale (threshold: ${staleThreshold.toISOString()})`
            );
        if (!has_recipient)
            blocking_reasons.push("no recipient with email found");

        return NextResponse.json({
            message_id: message.id,
            status: message.status,
            delivery_claimed_at: message.delivery_claimed_at ?? null,
            delivery_rule: {
                mode: rule?.mode ?? null,
                deliver_at: rule?.deliver_at ?? null,
            },
            recipient: {
                exists: !!recipient,
                email_masked: recipient?.email
                    ? `${(recipient.email as string).slice(0, 3)}***`
                    : null,
            },
            server_now: now.toISOString(),
            stale_threshold: staleThreshold.toISOString(),
            conditions: {
                status_is_scheduled,
                mode_is_date,
                deliver_at_is_due,
                unclaimed_or_stale,
                has_recipient,
            },
            final: {
                eligible_for_cron,
                blocking_reasons,
            },
        });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message.startsWith("Unauthorized"))
                return NextResponse.json({ error: error.message }, { status: 401 });
            if (error.message.startsWith("Forbidden"))
                return NextResponse.json({ error: error.message }, { status: 403 });
        }
        console.error("[debug-eligibility] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

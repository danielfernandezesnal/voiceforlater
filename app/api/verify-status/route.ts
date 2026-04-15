
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { releaseCheckinMessages } from "@/lib/release-logic";

export const runtime = "nodejs";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

function hashToken(rawToken: string): string {
    return crypto.createHash("sha256").update(rawToken).digest("hex");
}

type ContactStatus = "alive" | "critical" | "deceased" | "unknown";

const VALID_STATUSES: ContactStatus[] = ["alive", "critical", "deceased", "unknown"];

// ─── GET /api/verify-status?token=XXXX ────────────────────────────────────────
// Validates the token and returns the sender's first name.
// Does NOT mark the token as used.

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const rawToken = searchParams.get("token");

        if (!rawToken) {
            return NextResponse.json({ error: "Missing token", code: "TOKEN_MISSING" }, { status: 400 });
        }

        const supabase = getAdminClient();
        const tokenHash = hashToken(rawToken);

        // 1. Look up the token
        const { data: verification, error: fetchError } = await supabase
            .from("verification_tokens")
            .select("id, user_id, action, expires_at, used_at")
            .eq("token_hash", tokenHash)
            .single();

        if (fetchError || !verification) {
            return NextResponse.json({ error: "Token not found", code: "TOKEN_INVALID" }, { status: 404 });
        }

        // 2. Check action type
        if (verification.action !== "verify-status") {
            return NextResponse.json({ error: "Invalid token action", code: "TOKEN_INVALID" }, { status: 400 });
        }

        // 3. Check expiry
        if (new Date(verification.expires_at) < new Date()) {
            return NextResponse.json({ error: "Token has expired", code: "TOKEN_EXPIRED" }, { status: 410 });
        }

        // 4. Check if already used
        if (verification.used_at) {
            return NextResponse.json({ error: "Token already used", code: "TOKEN_USED" }, { status: 409 });
        }

        // 5. Fetch sender's name from profiles
        const { data: profile } = await supabase
            .from("profiles")
            .select("first_name, last_name")
            .eq("id", verification.user_id)
            .single();

        const senderName = profile?.first_name
            ? profile.first_name
            : "el remitente";

        return NextResponse.json({
            valid: true,
            senderName,
        });
    } catch (error) {
        console.error("[verify-status GET] Unexpected error:", error);
        return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
    }
}

// ─── POST /api/verify-status ──────────────────────────────────────────────────
// Accepts the trusted contact's response.
// Validates the token, persists the response, marks the token as used.
// Does NOT trigger message release logic.

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { token: rawToken, status, comment } = body as {
            token?: string;
            status?: string;
            comment?: string;
        };

        // --- Input validation ---
        if (!rawToken) {
            return NextResponse.json({ error: "Missing token", code: "TOKEN_MISSING" }, { status: 400 });
        }

        if (!status || !VALID_STATUSES.includes(status as ContactStatus)) {
            return NextResponse.json(
                { error: "Invalid status. Must be one of: alive, critical, deceased, unknown", code: "INVALID_STATUS" },
                { status: 400 }
            );
        }

        const contactStatus = status as ContactStatus;

        const supabase = getAdminClient();
        const tokenHash = hashToken(rawToken);

        // 1. Fetch and validate token
        const { data: verification, error: fetchError } = await supabase
            .from("verification_tokens")
            .select("id, user_id, contact_email, action, expires_at, used_at")
            .eq("token_hash", tokenHash)
            .single();

        if (fetchError || !verification) {
            return NextResponse.json({ error: "Token not found", code: "TOKEN_INVALID" }, { status: 404 });
        }

        if (verification.action !== "verify-status") {
            return NextResponse.json({ error: "Invalid token action", code: "TOKEN_INVALID" }, { status: 400 });
        }

        if (new Date(verification.expires_at) < new Date()) {
            return NextResponse.json({ error: "Token has expired", code: "TOKEN_EXPIRED" }, { status: 410 });
        }

        if (verification.used_at) {
            return NextResponse.json({ error: "Token already used", code: "TOKEN_USED" }, { status: 409 });
        }

        const now = new Date().toISOString();
        const ip = request.headers.get("x-forwarded-for") || "unknown";
        const ua = request.headers.get("user-agent") || "unknown";

        // 2. Mark token as used (optimistic lock: only if used_at is still null)
        const { data: updated, error: updateError } = await supabase
            .from("verification_tokens")
            .update({
                used_at: now,
                used_reason: "user_action",
                used_ip: ip,
                used_user_agent: ua,
                // Store the contact's response directly on the token row
                contact_status: contactStatus,
                contact_comment: comment?.trim() || null,
                responded_at: now,
            })
            .eq("id", verification.id)
            .is("used_at", null) // Optimistic concurrency lock
            .select("id");

        if (updateError) {
            console.error("[verify-status POST] Update error:", updateError);
            return NextResponse.json({ error: "Concurrent usage detected", code: "CONCURRENT_USE" }, { status: 409 });
        }

        if (!updated || updated.length === 0) {
            // Another request beat us to it
            return NextResponse.json({ error: "Token already used", code: "TOKEN_USED" }, { status: 409 });
        }

        // 3. Write audit event to confirmation_events
        const eventType = `trusted_contact_response_${contactStatus}`;

        await supabase.from("confirmation_events").insert({
            user_id: verification.user_id,
            contact_email: verification.contact_email,
            token_id: verification.id,
            type: eventType,
            // Store structured response in the event for auditing
            contact_status: contactStatus,
            contact_comment: comment?.trim() || null,
            ip_address: ip,
            user_agent: ua,
        });

        // 4. If deceased, trigger message release
        if (contactStatus === "deceased") {
            try {
                await releaseCheckinMessages(verification.user_id);
                console.log(`[verify-status] Released messages for deceased user ${verification.user_id}`);
            } catch (releaseError) {
                // Log error but don't fail the response to the contact
                console.error(`[verify-status] Failed to release messages for user ${verification.user_id}:`, releaseError);
                // Consider: crear evento de auditoría para retry manual si es crítico
            }
        }

        // 5. Return success
        return NextResponse.json({
            success: true,
            status: contactStatus,
        });
    } catch (error) {
        console.error("[verify-status POST] Unexpected error:", error);
        return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
    }
}

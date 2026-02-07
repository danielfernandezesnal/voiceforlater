import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { type Plan, canUseTrustedContact } from "@/lib/plans";

/**
 * GET /api/trusted-contact
 * Get the user's trusted contact
 */
export async function GET() {
    try {
        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user plan
        const { data: profile } = await supabase
            .from("profiles")
            .select("plan")
            .eq("id", user.id)
            .single();

        const plan = (profile?.plan as Plan) || "free";

        // Check if feature is available
        if (!canUseTrustedContact(plan)) {
            return NextResponse.json({
                contact: null,
                featureAvailable: false,
                upgradeRequired: true
            });
        }

        const { data: contact } = await supabase
            .from("trusted_contacts")
            .select("*")
            .eq("user_id", user.id)
            .single();

        return NextResponse.json({ contact: contact || null, featureAvailable: true });
    } catch (error) {
        console.error("Error fetching trusted contact:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/**
 * POST /api/trusted-contact
 * Create or update the user's trusted contact
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user plan
        const { data: profile } = await supabase
            .from("profiles")
            .select("plan")
            .eq("id", user.id)
            .single();

        const plan = (profile?.plan as Plan) || "free";

        // Check if feature is available
        if (!canUseTrustedContact(plan)) {
            return NextResponse.json(
                {
                    error: "Trusted contact feature requires Pro plan",
                    upgradeRequired: true
                },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { name, email } = body;

        if (!name || !email) {
            return NextResponse.json(
                { error: "Name and email are required" },
                { status: 400 }
            );
        }

        // Upsert trusted contact (only one per user in MVP)
        const { data: contact, error } = await supabase
            .from("trusted_contacts")
            .upsert(
                {
                    user_id: user.id,
                    name,
                    email,
                },
                { onConflict: "user_id" }
            )
            .select()
            .single();

        if (error) {
            console.error("Error saving trusted contact:", error);
            return NextResponse.json(
                { error: "Failed to save trusted contact" },
                { status: 500 }
            );
        }

        // Log event
        await supabase.from("events").insert({
            type: "trusted_contact_updated",
            user_id: user.id,
            metadata: { contact_email: email },
        });

        return NextResponse.json({ success: true, contact });
    } catch (error) {
        console.error("Error saving trusted contact:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/**
 * DELETE /api/trusted-contact
 * Remove the user's trusted contact
 */
export async function DELETE() {
    try {
        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { error } = await supabase
            .from("trusted_contacts")
            .delete()
            .eq("user_id", user.id);

        if (error) {
            console.error("Error deleting trusted contact:", error);
            return NextResponse.json(
                { error: "Failed to delete trusted contact" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting trusted contact:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

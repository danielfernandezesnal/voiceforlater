import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Best-effort structured telemetry for delivery engine events.
 * Swallows internal failures so telemetry never breaks the delivery 
 * business logic.
 */
export async function logDeliveryEvent(
    supabase: SupabaseClient,
    { type, userId, metadata }: { 
        type: string, 
        userId: string | null | undefined, 
        metadata: Record<string, any> 
    }
): Promise<void> {
    try {
        await supabase.from("events").insert({
            type,
            user_id: userId,
            metadata
        });
    } catch (err) {
        console.error(`Telemetry error (${type}):`, err);
        // Best-effort: we never throw back to the caller
    }
}

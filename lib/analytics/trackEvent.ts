import { getAdminClient } from "@/lib/supabase/admin";

export interface AnalyticsEvent {
    event: string;
    userId?: string | null;
    metadata?: Record<string, string | number | boolean | null>;
}

/**
 * Server-side helper to track product events.
 * Uses Service Role to bypass RLS.
 * "Fire and forget" pattern recommended for critical path performance.
 */
export async function trackServerEvent(event: AnalyticsEvent) {
    try {
        const adminClient = getAdminClient();

        await adminClient.from('product_events').insert({
            user_id: event.userId || null,
            event_name: event.event,
            metadata: event.metadata || null
        });
    } catch (error) {
        // Analytics should not break the app flow
        console.error(`[Analytics] Failed to track ${event.event}:`, error);
    }
}

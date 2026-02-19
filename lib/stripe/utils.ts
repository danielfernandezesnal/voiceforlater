import Stripe from "stripe";

// Helper to safely get ID from string or object
export function getResourceId(resource: string | { id: string } | null | undefined): string | null {
    if (!resource) return null;
    if (typeof resource === 'string') return resource;
    return resource.id;
}

/**
 * Normalize Stripe subscription status to internal Plan
 */
export function mapSubscriptionToPlan(
    status: Stripe.Subscription.Status,
    cancelAtPeriodEnd: boolean,
    currentPeriodEnd: number | null
): { plan: 'free' | 'pro', effectiveStatus: string, effectiveUntil: string | null } {
    const isActive = ['active', 'trialing'].includes(status);
    const periodEndIso = currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null;

    // Case 1: Active/Trialing
    if (isActive) {
        // Even if cancelling at period end, they are still PRO until then
        return {
            plan: 'pro' as const,
            effectiveStatus: status,
            effectiveUntil: cancelAtPeriodEnd ? periodEndIso : null
        };
    }

    // Case 2: Past Due, Canceled, Unpaid, etc.
    // Explicitly downgrade to FREE
    return {
        plan: 'free' as const,
        effectiveStatus: status,
        effectiveUntil: null
    };
}

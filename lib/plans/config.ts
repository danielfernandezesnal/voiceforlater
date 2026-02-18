/**
 * Plan Limits Configuration
 * Centralized rules for FREE and PRO plans
 * 
 * FREE:
 * - 1 active message max
 * - Text or audio
 * - Check-in delivery: max 7 days, 1 reminder, no trusted contact
 * - No check-in history
 * 
 * PRO (USD 10/year):
 * - Unlimited messages
 * - Text + audio
 * - Check-in delivery: 30/60/90 days, multiple reminders, trusted contact enabled
 * - Check-in history
 */

export type Plan = 'free' | 'pro';

export interface PlanLimits {
    // Message limits
    maxActiveMessages: number;
    allowedTypes: ('text' | 'audio' | 'video')[];

    // Check-in limits
    checkinEnabled: boolean;
    maxCheckinIntervalDays: number;
    allowedCheckinIntervals: number[];
    maxReminders: number;
    trustedContactEnabled: boolean; // Keep for now, but maxTrustedContacts controls actual limit
    maxTrustedContacts: number;
    checkinHistoryEnabled: boolean;

    // Audio/Text limits
    maxAudioSeconds: number;
    maxTextChars: number;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
    free: {
        maxActiveMessages: 1,
        allowedTypes: ['text', 'audio'],
        checkinEnabled: true,
        maxCheckinIntervalDays: 30,
        allowedCheckinIntervals: [30],
        maxReminders: 1,
        trustedContactEnabled: true,
        maxTrustedContacts: 1,
        checkinHistoryEnabled: false,
        maxAudioSeconds: 15,
        maxTextChars: 1000,
    },
    pro: {
        maxActiveMessages: Infinity,
        allowedTypes: ['text', 'audio', 'video'],
        checkinEnabled: true,
        maxCheckinIntervalDays: 90,
        allowedCheckinIntervals: [30, 60, 90],
        maxReminders: 3,
        trustedContactEnabled: true,
        maxTrustedContacts: 3,
        checkinHistoryEnabled: true,
        maxAudioSeconds: 120,
        maxTextChars: 5000,
    },
};

/**
 * Get limits for a specific plan
 */
export function getPlanLimits(plan: Plan): PlanLimits {
    return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

/**
 * Check if a user can create more messages
 */
export function canCreateMessage(plan: Plan, currentMessageCount: number): boolean {
    const limits = getPlanLimits(plan);
    return currentMessageCount < limits.maxActiveMessages;
}

/**
 * Check if a user can use trusted contact feature
 */
export function canUseTrustedContact(plan: Plan): boolean {
    return getPlanLimits(plan).trustedContactEnabled;
}

/**
 * Check if a check-in interval is allowed for a plan
 */
export function isCheckinIntervalAllowed(plan: Plan, intervalDays: number): boolean {
    const limits = getPlanLimits(plan);
    return limits.allowedCheckinIntervals.includes(intervalDays);
}

/**
 * Get the maximum reminders for a plan
 */
export function getMaxReminders(plan: Plan): number {
    return getPlanLimits(plan).maxReminders;
}

/**
 * Format plan name for display
 */
export function formatPlanName(plan: Plan): string {
    return plan === 'pro' ? 'Pro' : 'Free';
}

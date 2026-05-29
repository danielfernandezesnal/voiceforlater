import 'server-only';
import { getAdminClient } from '@/lib/supabase/admin';

/**
 * Safe statuses that may be auto-confirmed on dashboard access.
 * awaiting_verification and confirmed_absent must never be reset here.
 */
const SAFE_STATUSES = ['active', 'pending'] as const;
type SafeStatus = (typeof SAFE_STATUSES)[number];

function isSafeStatus(status: string): status is SafeStatus {
    return (SAFE_STATUSES as readonly string[]).includes(status);
}

/** Default interval when no delivery rule is found for the user. */
const DEFAULT_INTERVAL_DAYS = 30;

/**
 * How long a confirmed-active session stays fresh before dashboard access
 * triggers a new refresh. Pending always refreshes immediately regardless.
 */
const ACTIVITY_REFRESH_THRESHOLD_HOURS = 24;

export interface CheckinData {
    hasCheckin: boolean;
    status: string;
    nextDueAt: string;
    daysRemaining: number;
    isOverdue: boolean;
}

type RefreshReason =
    | 'pending_dashboard_access'
    | 'missing_last_confirmed_at'
    | 'stale_dashboard_access';

/**
 * dashboardAutoConfirm
 *
 * Runs server-side before the dashboard renders. Refreshes the check-in timer
 * when the authenticated user is in a safe state and activity is stale.
 *
 * Eligibility (application-level, mirrored in DB predicates):
 *   - status = 'pending'                               → always refresh
 *   - status = 'active', last_confirmed_at IS NULL     → refresh
 *   - status = 'active', last_confirmed_at > 24h ago   → refresh
 *   - status = 'active', last_confirmed_at within 24h  → no write
 *
 * Hard guards (never relaxed):
 *   - awaiting_verification → never touched
 *   - confirmed_absent      → never touched
 *
 * Uses the admin/service-role client for the write so it is not constrained
 * by RLS. The caller is responsible for verifying user identity before calling.
 *
 * @param userId - Verified auth user ID from the dashboard server component.
 * @returns CheckinData ready for the widget's initialCheckin prop,
 *          or null if no checkin row exists.
 */
export async function dashboardAutoConfirm(userId: string): Promise<CheckinData | null> {
    const admin = getAdminClient();

    // 1. Load current checkin row for this user.
    const { data: checkin, error: fetchError } = await admin
        .from('checkins')
        .select('id, status, next_due_at, last_confirmed_at, attempts')
        .eq('user_id', userId)
        .single();

    if (fetchError || !checkin) {
        return null;
    }

    const now = new Date();
    const nextDue = new Date(checkin.next_due_at);

    // 2. Status guard — awaiting_verification and confirmed_absent exit here.
    if (!isSafeStatus(checkin.status)) {
        return buildCheckinData(checkin.status, checkin.next_due_at, now, nextDue);
    }

    // 3. Activity-freshness eligibility check (application-level).
    //    Mirrors the OR predicate used in the UPDATE below.
    const thresholdMs = ACTIVITY_REFRESH_THRESHOLD_HOURS * 60 * 60 * 1000;
    const thresholdDate = new Date(now.getTime() - thresholdMs);
    const thresholdIso = thresholdDate.toISOString();

    const lastConfirmed = checkin.last_confirmed_at
        ? new Date(checkin.last_confirmed_at)
        : null;

    const isPending = checkin.status === 'pending';
    const isMissingLastConfirmed = lastConfirmed === null;
    const isStaleActivity = lastConfirmed !== null && lastConfirmed <= thresholdDate;

    const isEligible = isPending || isMissingLastConfirmed || isStaleActivity;

    if (!isEligible) {
        // Active with a recent confirmation — no write needed.
        return buildCheckinData(checkin.status, checkin.next_due_at, now, nextDue);
    }

    // Determine the reason that will be attached to the audit event.
    const refreshReason: RefreshReason = isPending
        ? 'pending_dashboard_access'
        : isMissingLastConfirmed
        ? 'missing_last_confirmed_at'
        : 'stale_dashboard_access';

    // 4. Derive interval from the user's own delivery rule.
    //    Scoped through messages so we never pick up another user's rule.
    const { data: ruleRow } = await admin
        .from('delivery_rules')
        .select('checkin_interval_days, messages!inner(owner_id)')
        .eq('mode', 'checkin')
        .eq('messages.owner_id', userId)
        .limit(1)
        .maybeSingle();

    const intervalDays: number = ruleRow?.checkin_interval_days ?? DEFAULT_INTERVAL_DAYS;

    // 5. Calculate new next_due_at.
    const newNextDue = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

    // 6. Capture previous state for audit before writing.
    const previousStatus = checkin.status;
    const previousNextDueAt = checkin.next_due_at;
    const previousAttempts = checkin.attempts;

    // 7. Write the reset — admin client bypasses RLS.
    //    Three DB-level predicates guard the update atomically:
    //      a) user_id                       — scopes to this user only
    //      b) status IN ('active','pending') — blocks awaiting_verification / confirmed_absent
    //      c) freshness OR predicate        — mirrors the eligibility check above;
    //         prevents a spurious write if the row was already refreshed between read and write
    const { data: updated, error: updateError } = await admin
        .from('checkins')
        .update({
            status: 'active',
            attempts: 0,
            last_confirmed_at: now.toISOString(),
            next_due_at: newNextDue.toISOString(),
        })
        .eq('user_id', userId)
        .in('status', SAFE_STATUSES)
        .or(`status.eq.pending,last_confirmed_at.is.null,last_confirmed_at.lte.${thresholdIso}`)
        .select('id');

    if (updateError) {
        // Log but do not break the dashboard — return fetched state.
        console.error('[dashboardAutoConfirm] Failed to update checkin:', updateError.message);
        return buildCheckinData(checkin.status, checkin.next_due_at, now, nextDue);
    }

    if (!updated || updated.length === 0) {
        // Row no longer matched the freshness predicates at write time (e.g. another
        // concurrent request already refreshed it). Return fetched state; do not log.
        return buildCheckinData(checkin.status, checkin.next_due_at, now, nextDue);
    }

    // 8. Insert audit event. Failure must not break the dashboard.
    try {
        await admin.from('events').insert({
            type: 'checkin_auto_confirmed_dashboard_access',
            user_id: userId,
            metadata: {
                previous_status: previousStatus,
                previous_next_due_at: previousNextDueAt,
                previous_attempts: previousAttempts,
                new_next_due_at: newNextDue.toISOString(),
                interval_days: intervalDays,
                method: 'dashboard_access',
                refresh_reason: refreshReason,
                activity_refresh_threshold_hours: ACTIVITY_REFRESH_THRESHOLD_HOURS,
            },
        });
    } catch (eventErr) {
        console.error('[dashboardAutoConfirm] Event logging failed (non-fatal):', eventErr);
    }

    // 9. Return fresh state.
    return buildCheckinData('active', newNextDue.toISOString(), now, newNextDue);
}

function buildCheckinData(
    status: string,
    nextDueAt: string,
    now: Date,
    nextDue: Date,
): CheckinData {
    const isOverdue = now >= nextDue;
    const msRemaining = nextDue.getTime() - now.getTime();
    const daysRemaining = isOverdue ? 0 : Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

    return {
        hasCheckin: true,
        status,
        nextDueAt,
        daysRemaining,
        isOverdue,
    };
}

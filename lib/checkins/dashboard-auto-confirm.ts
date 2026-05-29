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

export interface CheckinData {
    hasCheckin: boolean;
    status: string;
    nextDueAt: string;
    daysRemaining: number;
    isOverdue: boolean;
}

/**
 * dashboardAutoConfirm
 *
 * Runs server-side before the dashboard renders. If the authenticated user
 * has a checkin row in a safe state (active | pending) AND next_due_at is
 * in the past, it resets the checkin to active and returns the fresh state.
 *
 * Guards:
 *   - awaiting_verification → never touched
 *   - confirmed_absent      → never touched
 *   - future next_due_at    → no write, current state returned
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
    const isExpired = now >= nextDue;

    // 2. Only proceed if status is safe AND the checkin is overdue.
    if (!isSafeStatus(checkin.status) || !isExpired) {
        // Return current state as-is — no write performed.
        return buildCheckinData(checkin.status, checkin.next_due_at, now, nextDue);
    }

    // 3. Derive interval from the user's own delivery rule.
    //    Scoped through messages so we never pick up another user's rule.
    const { data: ruleRow } = await admin
        .from('delivery_rules')
        .select('checkin_interval_days, messages!inner(owner_id)')
        .eq('mode', 'checkin')
        .eq('messages.owner_id', userId)
        .limit(1)
        .maybeSingle();

    const intervalDays: number = ruleRow?.checkin_interval_days ?? DEFAULT_INTERVAL_DAYS;

    // 4. Calculate new next_due_at.
    const newNextDue = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

    // 5. Capture previous state for audit before writing.
    const previousStatus = checkin.status;
    const previousNextDueAt = checkin.next_due_at;
    const previousAttempts = checkin.attempts;

    // 6. Write the reset — admin client bypasses RLS.
    //    Three DB-level predicates guard the update atomically:
    //      a) user_id            — scopes to this user only
    //      b) status IN (...)    — blocks awaiting_verification / confirmed_absent
    //      c) next_due_at <= now — blocks if row became non-overdue between read and write
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
        .lte('next_due_at', now.toISOString())
        .select('id');

    if (updateError) {
        // Log but do not break the dashboard — return fetched state.
        console.error('[dashboardAutoConfirm] Failed to update checkin:', updateError.message);
        return buildCheckinData(checkin.status, checkin.next_due_at, now, nextDue);
    }

    if (!updated || updated.length === 0) {
        // Row was no longer overdue (or status changed) at write time — no update applied.
        // Return the fetched state without logging a success event.
        return buildCheckinData(checkin.status, checkin.next_due_at, now, nextDue);
    }

    // 7. Insert audit event. Failure must not break the dashboard.
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
            },
        });
    } catch (eventErr) {
        console.error('[dashboardAutoConfirm] Event logging failed (non-fatal):', eventErr);
    }

    // 8. Return fresh state.
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

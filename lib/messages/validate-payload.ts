/**
 * Validation helpers for /api/messages route.
 * Each function returns a result object: { valid: true } or { valid: false, response }.
 * The caller can short-circuit with `if (!result.valid) return result.response`.
 */

import { NextResponse } from "next/server";
import { type Plan, type PlanLimits, isCheckinIntervalAllowed } from "@/lib/plans";
import type { MessagePayload, RecipientData } from "./parse-payload";

type ValidationOk = { valid: true };
type ValidationFail = { valid: false; response: NextResponse };
export type ValidationResult = ValidationOk | ValidationFail;

/**
 * Validate that required fields are present: type, title, deliveryMode, and at least one recipient.
 */
export function validateRequiredFields(payload: MessagePayload): ValidationResult {
    const { type, title, deliveryMode, recipientsData } = payload;

    if (!type || recipientsData.length === 0 || !deliveryMode || !title || title.trim().length === 0) {
        return { valid: false, response: NextResponse.json({ error: "Missing required fields" }, { status: 400 }) };
    }

    if (title.length > 80) {
        return { valid: false, response: NextResponse.json({ error: "Title exceeds 80 characters" }, { status: 400 }) };
    }

    return { valid: true };
}

/**
 * Validate delivery date for "date" mode: must exist, be parseable, and (in production) be ≥5 min in the future.
 */
export function validateDeliveryDate(deliverAt: string | null, deliveryMode: string): ValidationResult {
    if (deliveryMode !== "date") return { valid: true };

    if (!deliverAt) {
        return { valid: false, response: NextResponse.json({ error: "Delivery date is required for date mode" }, { status: 400 }) };
    }

    const scheduleDate = new Date(deliverAt);
    if (isNaN(scheduleDate.getTime())) {
        return { valid: false, response: NextResponse.json({ error: "Invalid date format" }, { status: 400 }) };
    }

    // Skip future-date enforcement outside production (admin/dev testing)
    if (process.env.NODE_ENV === 'production') {
        const now = new Date();
        const minDate = new Date(now.getTime() + 5 * 60 * 1000); // Now + 5m

        if (scheduleDate < minDate) {
            return {
                valid: false,
                response: NextResponse.json({
                    error: "Delivery date must be at least 5 minutes in the future.",
                    code: "INVALID_SCHEDULE"
                }, { status: 400 })
            };
        }
    }

    return { valid: true };
}

/**
 * Validate that the message type is allowed by the plan, and that content matches the type.
 */
export function validateContentForType(
    payload: MessagePayload,
    limits: PlanLimits,
    plan: Plan
): ValidationResult {
    const { type, textContent, audioFile, videoFile, existingAudioUrl } = payload;

    if (!limits.allowedTypes.includes(type)) {
        return {
            valid: false,
            response: NextResponse.json(
                {
                    error: "PLAN_LIMIT",
                    reason: "VIDEO_NOT_ALLOWED",
                    details: `${type} messages are not allowed on the ${plan} plan.`
                },
                { status: 403 }
            )
        };
    }

    if (type === "text" && (!textContent || textContent.trim().length === 0)) {
        return { valid: false, response: NextResponse.json({ error: "Text content is required" }, { status: 400 }) };
    }
    if (type === "audio" && !audioFile && !existingAudioUrl) {
        return { valid: false, response: NextResponse.json({ error: "Audio file is required" }, { status: 400 }) };
    }
    if (type === "video" && !videoFile && !existingAudioUrl) {
        return { valid: false, response: NextResponse.json({ error: "Video file is required" }, { status: 400 }) };
    }

    if (type === "text" && textContent && textContent.length > limits.maxTextChars) {
        return {
            valid: false,
            response: NextResponse.json(
                { error: `Text exceeds ${limits.maxTextChars} character limit` },
                { status: 400 }
            )
        };
    }

    return { valid: true };
}

/**
 * Disallow self as recipient for check-in (posthumous) messages.
 */
export function validateSelfRecipient(
    recipientsData: RecipientData[],
    userEmail: string | undefined,
    deliveryMode: string
): ValidationResult {
    if (deliveryMode !== "checkin" || !userEmail) return { valid: true };

    const selfEmail = userEmail.toLowerCase().trim();
    const hasSelfRecipient = recipientsData.some(
        (r) => r.email.toLowerCase().trim() === selfEmail
    );

    if (hasSelfRecipient) {
        return {
            valid: false,
            response: NextResponse.json(
                { error: "You cannot send this message to yourself.", code: "SELF_RECIPIENT_NOT_ALLOWED" },
                { status: 400 }
            )
        };
    }

    return { valid: true };
}

/**
 * Validate that the check-in interval is allowed for the plan.
 */
export function validateCheckinInterval(
    plan: Plan,
    checkinIntervalDays: string | null,
    deliveryMode: string,
    limits: PlanLimits
): ValidationResult {
    if (deliveryMode !== "checkin" || !checkinIntervalDays) return { valid: true };

    const interval = parseInt(checkinIntervalDays, 10);
    if (!isCheckinIntervalAllowed(plan, interval)) {
        return {
            valid: false,
            response: NextResponse.json(
                {
                    error: `${interval}-day check-in is not available on your plan`,
                    upgradeRequired: true,
                    allowedIntervals: limits.allowedCheckinIntervals
                },
                { status: 403 }
            )
        };
    }

    return { valid: true };
}

import { NextRequest } from "next/server";

/**
 * Returns true if the request carries a valid CRON_SECRET.
 *
 * Priority order:
 *   1. Authorization: Bearer <secret>  — used by Vercel Cron
 *   2. x-cron-secret: <secret>         — legacy header support
 *   3. ?secret=<secret>                — manual testing only
 *
 * Returns false (never throws) if CRON_SECRET is not configured.
 * Never logs the secret value.
 */
export function isAuthorized(request: NextRequest): boolean {
    const CRON_SECRET = process.env.CRON_SECRET;
    if (!CRON_SECRET) return false;

    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
        return authHeader.replace("Bearer ", "") === CRON_SECRET;
    }

    const customHeader = request.headers.get("x-cron-secret");
    if (customHeader) {
        return customHeader === CRON_SECRET;
    }

    const querySecret = request.nextUrl.searchParams.get("secret");
    if (querySecret) {
        return querySecret === CRON_SECRET;
    }

    return false;
}

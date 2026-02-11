import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json({
        ok: true,
        version: process.env.VERCEL_GIT_COMMIT_SHA || 'local-dev',
        timestamp: new Date().toISOString(),
        fingerprint_check: "RBAC_USERS_V1_PENDING"
    });
}

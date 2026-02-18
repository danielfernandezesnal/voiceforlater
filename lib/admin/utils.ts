import { getAdminClient } from '@/lib/supabase/admin';

// Simple in-memory rate limiter
interface RateRecord {
    count: number;
    resetAt: number;
}
const rateLimits = new Map<string, RateRecord>();
const LIMIT = 60; // Max requests per window
const WINDOW_MS = 60 * 1000; // 1 minute window

export function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = rateLimits.get(ip);

    // Clean up
    if (record && now > record.resetAt) {
        rateLimits.delete(ip);
    }

    if (!rateLimits.has(ip)) {
        rateLimits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
        return true;
    }

    const current = rateLimits.get(ip)!; // guaranteed by above check
    if (current.count >= LIMIT) {
        return false;
    }

    current.count++;
    return true;
}

interface AuditLogEntry {
    admin_user_id?: string | null;
    action: string;
    meta?: any;
    req?: Request;
    ip?: string;
}

export async function logAdminAction({ admin_user_id, action, meta, req, ip }: AuditLogEntry) {
    try {
        const adminClient = getAdminClient();

        let clientIp = ip || 'unknown';
        let userAgent = 'unknown';

        if (req) {
            clientIp = req.headers.get('x-forwarded-for') || clientIp;
            userAgent = req.headers.get('user-agent') || userAgent;
        }

        const metadata = {
            ...meta,
            userAgent,
            timestamp: new Date().toISOString()
        };

        const { error } = await adminClient
            .from('admin_audit_log')
            .insert({
                admin_user_id, // can be null
                action,
                meta: metadata
            });

        if (error) {
            console.error('Audit Log Insert Error:', error.message);
        }
    } catch (e) {
        console.error('Audit Log System Error:', e);
    }
}

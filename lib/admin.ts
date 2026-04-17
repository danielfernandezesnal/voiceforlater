import { User } from '@supabase/supabase-js';
import { ADMIN_EMAIL } from '@/lib/constants';

const ADMIN_EMAILS = [
    ADMIN_EMAIL
];

/**
 * Check if user is admin by email (hardcoded list).
 * Synchronous — used by middleware where async DB checks are impractical.
 *
 * For server-side route protection, use requireAdmin() or requireOwner()
 * from '@/lib/server/requireAdmin' instead.
 */
export function isAdminEmail(user: User | null | undefined): boolean {
    if (!user || !user.email) return false;
    const email = user.email.toLowerCase().trim();
    return ADMIN_EMAILS.includes(email);
}

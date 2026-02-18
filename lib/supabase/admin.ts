import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Prevent client-side bundling
if (typeof window !== 'undefined') {
    throw new Error('This module can only be imported on the server.');
}

export function getAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error("Missing Supabase credentials for Admin Client");
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}

// Alias for backward compatibility if needed
export const createAdminClient = getAdminClient;

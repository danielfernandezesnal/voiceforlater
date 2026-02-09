import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    const supabase = await createClient();

    // 1. Get Auth User
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    // 2. Get Profile directly
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    // 3. Check Admin logic
    const isAdminCheck = profile?.is_admin === true;

    return NextResponse.json({
        auth_email: user.email,
        user_id: user.id,
        profile_data: profile,
        is_admin_check: isAdminCheck,
        auth_error: authError,
        profile_error: profileError
    }, { status: 200 });
}

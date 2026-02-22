const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
    console.error('.env.local not found');
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
        env[key] = value;
    }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function verify() {
    console.log('--- Verifying Migrations 021 & 022 in PROD ---\n');

    // 1. Check for functions
    const { data: functions, error } = await supabase.rpc('get_functions_metadata', {});

    // Since get_functions_metadata might not exist, let's use a direct query via rpc if possible or fallback to check existence by calling them with invalid args or just checking if they are in pg_proc

    const checkQuery = `
        SELECT 
            p.proname as function_name,
            p.prosecdef as is_security_definer,
            p.proconfig as config
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname IN ('check_if_admin', 'admin_list_users', 'admin_kpis');
    `;

    // We can't run raw SQL via supabase client easily without a wrapper RPC. 
    // Let's try to call the functions. If they don't exist, we get a 404/PGRST202.

    console.log('Checking public.check_if_admin...');
    const { error: err1 } = await supabase.rpc('check_if_admin', { p_user_id: '00000000-0000-0000-0000-000000000000' });
    if (err1 && err1.code === 'PGRST202') {
        console.log('❌ public.check_if_admin NOT found.');
    } else {
        console.log('✅ public.check_if_admin found (or returned error: ' + (err1 ? err1.message : 'NONE') + ')');
    }

    console.log('\nChecking public.admin_list_users...');
    const { error: err2 } = await supabase.rpc('admin_list_users', { p_limit: 1 });
    if (err2 && err2.code === 'PGRST202') {
        console.log('❌ public.admin_list_users NOT found.');
    } else {
        console.log('✅ public.admin_list_users found (or returned error: ' + (err2 ? err2.message : 'NONE') + ')');
    }

    console.log('\nChecking public.admin_kpis...');
    const { error: err3 } = await supabase.rpc('admin_kpis', {});
    if (err3 && err3.code === 'PGRST202') {
        console.log('❌ public.admin_kpis NOT found.');
    } else {
        console.log('✅ public.admin_kpis found (or returned error: ' + (err3 ? err3.message : 'NONE') + ')');
    }
}

verify();

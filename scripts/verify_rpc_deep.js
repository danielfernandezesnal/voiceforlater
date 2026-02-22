const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function verify() {
    console.log('--- Deep Verification of RPCs ---\n');

    // Test check_if_admin (from 021)
    console.log('Test check_if_admin (021):');
    const { data: d1, error: e1 } = await supabase.rpc('check_if_admin', { p_user_id: '00000000-0000-0000-0000-000000000000' });
    console.log('Result:', d1, 'Error:', e1 ? e1.code + ' - ' + e1.message : 'NONE');

    // Test admin_kpis (from 021)
    console.log('\nTest admin_kpis (021):');
    const { data: d2, error: e2 } = await supabase.rpc('admin_kpis', { p_date_from: null });
    console.log('Result:', d2, 'Error:', e2 ? e2.code + ' - ' + e2.message : 'NONE');

    // Test admin_list_users with params (021/022)
    console.log('\nTest admin_list_users with params (021/022):');
    const { data: d3, error: e3 } = await supabase.rpc('admin_list_users', { p_limit: 1 });
    console.log('Result:', d3, 'Error:', e3 ? e3.code + ' - ' + e3.message : 'NONE');

    // Test admin_list_users without params (Old 007)
    console.log('\nTest admin_list_users empty (007):');
    const { data: d4, error: e4 } = await supabase.rpc('admin_list_users', {});
    console.log('Result:', d4, 'Error:', e4 ? e4.code + ' - ' + e4.message : 'NONE');
}

verify();

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

const adminClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY);

async function checkPolicies() {
    const { data, error } = await adminClient.rpc('get_policies_for_table', { t_name: 'user_roles' });
    if (error) {
        // Fallback to manual query
        const { data: pols, error: e2 } = await adminClient.from('pg_policies').select('*').eq('tablename', 'user_roles');
        console.log('Policies on user_roles:', pols || e2);
    } else {
        console.log('Policies on user_roles:', data);
    }
}

async function checkRaw() {
    const { data, error } = await adminClient.from('user_roles').select('*');
    console.log('All user_roles (Admin):', data?.length);
}

checkRaw();

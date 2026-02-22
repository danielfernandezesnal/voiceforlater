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

async function debugAdmin() {
    const email = 'admin@carrymywords.com';
    console.log(`Checking user: ${email}`);

    // 1. Auth Users
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
        console.error('Auth check error:', authError);
        return;
    }

    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) {
        console.log('User not found in Auth.');
        return;
    }

    console.log(`Auth User ID: ${user.id}`);

    // 2. Profiles
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    console.log('Profile:', profile);
    if (profileError) console.log('Profile Error:', profileError.message);

    // 3. User Roles
    const { data: role, error: roleError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .single();

    console.log('User Role:', role);
    if (roleError) console.log('Role Error:', roleError.message);
}

debugAdmin();

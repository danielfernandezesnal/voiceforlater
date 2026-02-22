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

// Simulate Middleware Client (ANON KEY)
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function simulateMiddleware() {
    const email = 'admin@carrymywords.com';
    const password = '...'; // I don't need the password if I use admin client to get a session or just check RLS

    // Let's use service role to get the user ID first
    const adminClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY);
    const { data: { users } } = await adminClient.auth.admin.listUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
        console.error('User not found');
        return;
    }

    console.log(`Simulating middleware for user: ${user.id}`);

    // Now try to read user_roles as ANON (simulating middleware)
    // Note: We can't easily "become" the user without logging in, 
    // but we can check if there's any policy that allows ANON or AUTHENTICATED to see it.

    // Actually, I'll use the service role to check ALL policies on user_roles
    const { data: policies, error: polError } = await adminClient.rpc('get_policies', { table_name: 'user_roles' });
    // If rpc doesn't exist, I'll use a raw query if I have one, or just check the migration files again.
}

simulateMiddleware();

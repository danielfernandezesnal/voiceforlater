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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testRPC() {
    const userId = '003d1c0d-8277-4eae-ad28-c676522e9892'; // admin@carrymywords.com
    console.log(`Testing RPC check_if_admin for ID: ${userId}`);

    // Call RPC as ANON
    const { data: isAdmin, error } = await supabase.rpc('check_if_admin', { p_user_id: userId });

    if (error) {
        console.error('RPC Error:', error.message);
    } else {
        console.log('Result (isAdmin):', isAdmin);
    }
}

testRPC();

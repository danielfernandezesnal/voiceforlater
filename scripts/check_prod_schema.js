const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
    }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    console.log('--- Checking for user_subscriptions table ---');
    const { error } = await supabase.from('user_subscriptions').select('count', { count: 'exact', head: true });
    if (error) {
        console.log('user_subscriptions does not exist:', error.message);
    } else {
        console.log('user_subscriptions EXISTS.');
    }

    console.log('\n--- Checking profiles schema ---');
    const { data: profile } = await supabase.from('profiles').select('*').limit(1);
    if (profile && profile.length > 0) {
        console.log('Profile columns:', Object.keys(profile[0]));
        console.log('Sample profile plan:', profile[0].plan);
    } else {
        console.log('No profiles found.');
    }
}

check();


const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Manual env parsing
const envFile = fs.readFileSync('.env.vercel.prod', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)="?([^"\r\n]+)"?/);
    if (match) env[match[1]] = match[2];
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfile() {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', 'danielfernandezesnal@gmail.com')
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
    } else {
        console.log('--- PROFILE DATA ---');
        console.log('ID:', data.id);
        console.log('Plan:', data.plan);
        console.log('Status:', data.plan_status);
        console.log('Stripe Customer:', data.stripe_customer_id);
        console.log('Stripe Sub:', data.stripe_subscription_id);
        console.log('--------------------');
    }
}

checkProfile();

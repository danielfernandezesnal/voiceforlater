const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local manually since we can't assume dotenv is installed/configured
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
    // Need a user ID to test with. I'll search for the first user with messages.
    // Or just fetch ANY message to test the shape.

    console.log('Fetching messages with service role key (bypassing RLS)...');

    const { data, error } = await supabase
        .from('messages')
        .select(`
            id,
            status,
            created_at,
            delivery_rules (mode, deliver_at)
        `)
        .limit(1);

    if (error) {
        console.error('Query Error:', error);
    } else {
        console.log('Query Result:', JSON.stringify(data, null, 2));
    }
}

testQuery();

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
let envContent;
try {
    envContent = fs.readFileSync(envPath, 'utf8');
} catch (e) {
    console.error("Could not read .env.local");
    process.exit(1);
}

const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = (value || '').trim().replace(/^["']|["']$/g, '');
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY; // Must use service role

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials (URL or SERVICE_ROLE_KEY) in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log('--- Inspecting Current DB Structure ---');

    console.log('\n[1] Trusted Contacts (LIMIT 1):');
    const { data: contacts, error: contactsError } = await supabase
        .from('trusted_contacts')
        .select('*')
        .limit(1);

    if (contactsError) console.error('Error fetching contacts:', contactsError.message);
    else console.log(JSON.stringify(contacts, null, 2));

    console.log('\n[2] Profiles Columns (via data sample):');
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

    if (profilesError) console.error('Error fetching profiles:', profilesError.message);
    else {
        // Just show keys to identify existing columns
        const keys = profiles && profiles.length > 0 ? Object.keys(profiles[0]) : 'No profiles found';
        console.log(keys);
    }

    console.log('\n[3] Check if message_trusted_contacts exists (should fail if not exists):');
    const { error: checkError } = await supabase
        .from('message_trusted_contacts')
        .select('*')
        .limit(1);

    if (checkError) console.log('Confirmed: Table likely does not exist (' + checkError.message + ')');
    else console.log('Review Needed: Table ALREADY EXISTS!');
}

inspect();

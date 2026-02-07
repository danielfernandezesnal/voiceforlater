
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

const supabase = createClient(supabaseUrl, supabaseKey);

async function listProfiles() {
    const { data, error } = await supabase
        .from('profiles')
        .select('*');

    if (error) {
        console.error('Error fetching profiles:', error);
    } else {
        console.log('Profiles:', JSON.stringify(data, null, 2));
    }
}

listProfiles();

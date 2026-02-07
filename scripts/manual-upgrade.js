
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

async function upgradeUser() {
    const userId = "0c2c0bf2-49d1-4fdf-9900-c4e30582117f";
    const { data, error } = await supabase
        .from('profiles')
        .update({
            plan: 'pro'
        })
        .eq('id', userId)
        .select();

    if (error) {
        console.error('Error upgrading profile:', error);
    } else {
        console.log('Successfully upgraded user:', JSON.stringify(data, null, 2));
    }
}

upgradeUser();

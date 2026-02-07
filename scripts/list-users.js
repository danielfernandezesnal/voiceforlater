
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Manual env parsing - trying common env files
let env = {};
const envFiles = ['.env.vercel.prod', '.env.local', '.env'];

for (const file of envFiles) {
    if (fs.existsSync(file)) {
        console.log(`Loading env from ${file}`);
        const content = fs.readFileSync(file, 'utf8');
        content.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)="?([^"\r\n]+)"?/);
            if (match) env[match[1]] = match[2];
        });
        break; // Stop after first successful load
    }
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials. Ensure .env.vercel.prod or .env.local exists with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listUsers() {
    console.log('Fetching users...');

    // 1. Get all users from Auth (requires Service Role)
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers({ perPage: 1000 });

    if (authError) {
        console.error('Error fetching auth users:', authError);
        return;
    }

    // 2. Get all profiles
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*');

    if (profileError) {
        console.error('Error fetching profiles:', profileError);
        return;
    }

    // 3. Join and Display
    const lines = [];
    lines.push(`Found ${users.length} users and ${profiles.length} profiles.`);
    lines.push('------------------------------------------------');
    lines.push('Email'.padEnd(40) + ' | ' + 'Plan'.padEnd(10) + ' | ' + 'ID');
    lines.push('------------------------------------------------');

    users.forEach(user => {
        const profile = profiles.find(p => p.id === user.id);
        const plan = profile ? profile.plan : 'Unknown';
        const email = user.email || 'No Email';
        const planDisplay = plan === 'pro' ? 'PRO ⭐' : plan;

        lines.push(`${email.padEnd(40)} | ${planDisplay.padEnd(10)} | ${user.id}`);
    });
    lines.push('------------------------------------------------');

    fs.writeFileSync('users_output.txt', lines.join('\n'));
    console.log('Output written to users_output.txt');
}

listUsers();

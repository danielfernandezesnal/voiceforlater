
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Manual env parsing
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
        break;
    }
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findUser() {
    const targetEmail = 'laura.fernandez.esnal@gmail.com';
    console.log(`Searching for ${targetEmail}...`);

    // List all users (simplest way to filter without knowing ID)
    const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });

    if (error) {
        console.error('Error:', error);
        return;
    }

    const user = users.find(u => u.email === targetEmail);

    if (!user) {
        console.log('❌ User NOT found in Auth.');
        console.log('Total users checked:', users.length);
    } else {
        console.log('✅ User FOUND in Auth:');
        console.log('ID:', user.id);
        console.log('Created:', user.created_at);
        console.log('Last Sign In:', user.last_sign_in_at);

        // Check Profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error('❌ Error fetching profile:', profileError);
        } else if (!profile) {
            console.log('⚠️ User has Auth but NO Profile row.');
        } else {
            console.log('✅ Profile Found:');
            console.log('Plan:', profile.plan);
        }
    }
}

findUser();

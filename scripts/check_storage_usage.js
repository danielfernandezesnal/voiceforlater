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
    console.log('--- Checking storage usage in messages table ---');
    const { data, error } = await supabase
        .from('messages')
        .select('file_size_bytes')
        .not('file_size_bytes', 'is', null);

    if (error) {
        console.error('Error fetching file sizes:', error.message);
    } else {
        const totalBytes = data.reduce((acc, m) => acc + Number(m.file_size_bytes), 0);
        console.log(`Found ${data.length} messages with file_size_bytes.`);
        console.log(`Total bytes: ${totalBytes}`);
        console.log(`Total MB: ${(totalBytes / 1024 / 1024).toFixed(2)}`);
    }
}

check();

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
    console.log('--- Inspecting messages table schema ---');
    const { data: messages, error } = await supabase.from('messages').select('*').limit(1);
    if (error) {
        console.error('Error fetching messages:', error.message);
    } else if (messages && messages.length > 0) {
        console.log('Message columns:', Object.keys(messages[0]));
        console.log('Sample message:', JSON.stringify(messages[0], null, 2));
    } else {
        console.log('No messages found.');
    }
}

check();

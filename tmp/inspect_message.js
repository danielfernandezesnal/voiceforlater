const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.vercel.prod' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectMessage() {
    const userId = '993c2368-284d-4b69-9450-fb6a64af97a1';

    console.log(`Inspecting messages for user ${userId}...`);

    const { data: messages, error } = await supabase
        .from('messages')
        .select(`
            id,
            title,
            text_content,
            type,
            status,
            owner_id,
            recipients (name, email),
            profiles!inner (first_name, last_name)
        `)
        .eq('owner_id', userId);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(JSON.stringify(messages, null, 2));
}

inspectMessage();

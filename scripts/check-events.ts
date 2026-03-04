import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

async function checkLatestEvents() {
    console.log('Checking latest email events (last 20)...');
    const { data, error } = await supabase
        .from('email_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

    if (error) {
        console.error(error)
    } else {
        data.forEach(e => {
            console.log(`[${e.created_at}] TO: ${e.to_email} TYPE: ${e.email_type} STATUS: ${e.status} ERROR: ${e.error_message || 'None'}`);
        })
    }
}

checkLatestEvents()

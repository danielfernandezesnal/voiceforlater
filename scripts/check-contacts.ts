import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

async function checkContacts() {
    const { data, error } = await supabase
        .from('trusted_contacts')
        .select('id, name, email')
        .limit(10)

    if (error) {
        console.error(error)
    } else {
        data.forEach(c => {
            console.log(`ID: ${c.id} NAME: ${c.name} EMAIL: ${c.email}`);
        })
    }
}

checkContacts()

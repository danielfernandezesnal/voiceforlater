/**
 * Set Admin Flag Script
 * 
 * This script sets the is_admin flag to TRUE for a specific user.
 * 
 * Usage:
 *   node scripts/set-admin.js <user-email>
 * 
 * Example:
 *   node scripts/set-admin.js admin@carrymywords.com
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL');
    console.error('   SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

async function setAdmin(email) {
    try {
        console.log(`🔍 Looking for user with email: ${email}`);

        // Get user by email
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
            throw listError;
        }

        const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

        if (!user) {
            console.error(`❌ User not found: ${email}`);
            return;
        }

        console.log(`✅ Found user: ${user.email} (ID: ${user.id})`);

        // Check if profile exists
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error(`❌ Error fetching profile:`, profileError);
            return;
        }

        if (profile.is_admin) {
            console.log(`ℹ️  User is already an admin`);
            return;
        }

        // Set admin flag
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ is_admin: true })
            .eq('id', user.id);

        if (updateError) {
            throw updateError;
        }

        console.log(`✅ Successfully set ${email} as admin!`);
        console.log(`\n📝 Next steps:`);
        console.log(`   1. User can now log in with: admin@carrymywords.com`);
        console.log(`   2. Magic link will be sent to: danielfernandezesnal@gmail.com`);
        console.log(`   3. After clicking the link, user will have admin access`);
        console.log(`   4. Access admin dashboard at: /[locale]/admin`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

const email = process.argv[2];

if (!email) {
    console.error('❌ Usage: node scripts/set-admin.js <user-email>');
    console.error('   Example: node scripts/set-admin.js admin@carrymywords.com');
    process.exit(1);
}

setAdmin(email);

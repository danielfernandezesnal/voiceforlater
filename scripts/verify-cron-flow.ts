
// Verification Script for Expired Token Flow
// Run with: npx tsx scripts/verify-cron-flow.ts

import { createClient } from "@supabase/supabase-js";
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Setup Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Starting Verification...");

    // 1. Check Tables
    const { error: checkError } = await supabase.from('verification_tokens').select('count').limit(1);
    if (checkError) {
        if (checkError.message.includes('relation "public.verification_tokens" does not exist') || checkError.code === '42P01') {
            console.error("\n❌ TABLES MISSING! Please run `supabase/migrations/016_consolidated_verification_setup.sql` in your Supabase SQL Editor.\n");
            process.exit(1);
        } else {
            console.error("Error checking tables:", checkError);
        }
    } else {
        console.log("✅ Tables exist.");
    }

    const userId = 'b1ddd7d5-5882-4a4b-b830-96c2c39fe821'; // Test User
    const contactEmail = 'expired_contact_verify@test.com';

    // 2. Setup Data (Clean & Create)
    console.log("Setting up test data...");

    // Clean old
    await supabase.from('messages').delete().eq('owner_id', userId).ilike('text_content', 'TEST_VERIFY_FLOW%');
    await supabase.from('verification_tokens').delete().eq('user_id', userId).eq('contact_email', contactEmail);

    // Create Message
    const { data: msg } = await supabase.from('messages').insert({
        owner_id: userId,
        type: 'text',
        text_content: 'TEST_VERIFY_FLOW: Auto release message',
        status: 'scheduled'
    }).select().single();

    if (!msg) throw new Error("Failed to create message");

    await supabase.from('delivery_rules').insert({ message_id: msg.id, mode: 'checkin', attempts_limit: 3 });
    await supabase.from('recipients').insert({ message_id: msg.id, email: 'recipient@test.com', name: 'Recipient' });

    // Create Expired Token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const { data: token } = await supabase.from('verification_tokens').insert({
        user_id: userId,
        contact_email: contactEmail,
        token_hash: tokenHash,
        action: 'verify-status',
        expires_at: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
    }).select().single();

    if (!token) throw new Error("Failed to create token");
    console.log(`✅ Setup complete. Token ID: ${token.id}`);

    // 3. Call Cron (Need to hit the dedicated route URL or mock logic)
    // Since we are running outside Next.js context (script), we can use fetch to localhost if server running, 
    // OR we can't easily import the route handler logic due to Next.js specific imports (NextRequest).
    // Let's assume server is running on localhost:3000 as indicated by previous metadata.

    console.log("Triggering Cron Job (Run 1)...");
    const cronUrl = `${appUrl}/api/cron/process-expired-tokens`;
    try {
        const res1 = await fetch(cronUrl);
        const json1 = await res1.json();
        console.log("Cron 1 Result:", JSON.stringify(json1, null, 2));
    } catch (e) {
        console.error("Failed to call cron endpoint. Is server running?");
        // If fail, we can't proceed with verification.
    }

    console.log("Triggering Cron Job (Run 2 - Idempotency)...");
    try {
        const res2 = await fetch(cronUrl);
        const json2 = await res2.json();
        console.log("Cron 2 Result:", JSON.stringify(json2, null, 2));
    } catch (e) {
        console.error("Failed to call cron endpoint.");
    }

    // 4. Gather Evidence
    console.log("\n=== EVIDENCE ===");

    // A. Token State
    const { data: validToken } = await supabase
        .from('verification_tokens')
        .select('*')
        .eq('id', token.id)
        .single();

    console.log("\n[Token State]");
    console.table([{
        id: validToken.id,
        expires_at: validToken.expires_at,
        used_at: validToken.used_at,
        used_reason: validToken.used_reason
    }]);

    // B. Events
    const { data: events } = await supabase
        .from('confirmation_events')
        .select('*')
        .eq('token_id', token.id)
        .order('created_at', { ascending: true });

    console.log("\n[Confirmation Events]");
    console.table(events?.map(e => ({
        type: e.type,
        decision: e.decision, // Should be NULL
        created_at: e.created_at
    })));

    // C. Message State
    const { data: message } = await supabase
        .from('messages')
        .select('id, status, type, text_content')
        .eq('id', msg.id)
        .single();

    console.log("\n[Message State]");
    console.table([message]);

    if (validToken.used_at && events.length >= 2 && message.status === 'delivered') {
        console.log("\n✅ VERIFICATION SUCCESSFUL!");
    } else {
        console.log("\n❌ VERIFICATION FAILED (Check logs above)");
    }
}

run().catch(e => console.error(e));

/**
 * Stripe Webhook Smoke Test Script
 * Verifies that the webhook endpoint exists on the old and new domains.
 */
import https from 'https';

const OLD_URL = process.env.OLD_URL || 'https://voiceforlater.vercel.app';
const NEW_URL = process.env.NEW_URL || 'https://carrymywords.com';

const webhookPath = '/api/stripe/webhook';

async function checkWebhook(baseUrl) {
    const fullUrl = `${baseUrl}${webhookPath}`;

    return new Promise((resolve) => {
        const req = https.request(fullUrl, { method: 'POST', rejectUnauthorized: false }, (res) => {
            resolve({ url: fullUrl, status: res.statusCode });
            res.resume();
        });

        req.on('error', (e) => resolve({ url: fullUrl, status: 'ERROR', message: e.message }));
        req.end();
    });
}

async function run() {
    console.log(`🔍 Starting Stripe webhook smoke test...\n`);
    let hasErrors = false;

    const oldResult = await checkWebhook(OLD_URL);
    console.log(`[${oldResult.status}] Old Webhook: ${oldResult.url}`);
    if (oldResult.status === 404) {
        console.error(`❌ Old webhook endpoint returned 404 Not Found.`);
        hasErrors = true;
    }

    const newResult = await checkWebhook(NEW_URL);
    console.log(`[${newResult.status === 'ERROR' ? newResult.message : newResult.status}] New Webhook: ${newResult.url}`);

    // Any status except 404 is technically fine for a webhook (400, 401, 405, 500) if it's missing signature/body
    // But we don't fail for newResult.status === 404 right now, to mimic the prompt's instruction:
    // "Solo verificar que el endpoint exista y no devuelva 404. Aceptar 400/405 como “ok” (porque falta firma o método)." 
    // And if it's new domain, maybe it actually fails if it's fully active and returns 404.
    if (newResult.status === 404) {
        console.error(`❌ New webhook endpoint returned 404 Not Found.`);
        hasErrors = true;
    }

    if (hasErrors) {
        console.error(`\n🚨 Webhook verification failed.`);
        process.exit(1);
    } else {
        console.log(`\n✅ Webhook verification check passed.`);
        process.exit(0);
    }
}

run().catch(console.error);

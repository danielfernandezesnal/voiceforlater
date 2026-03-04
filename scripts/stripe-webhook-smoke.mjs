/**
 * Stripe Webhook Smoke Test Script
 * Verifies that the webhook endpoint exists on the old and new domains.
 */
import https from 'https';

const OLD_URL = process.env.OLD_URL || 'https://voiceforlater.vercel.app';
const NEW_URL = process.env.NEW_URL || 'https://carrymywords.com';
const STRICT_NEW = process.env.STRICT_NEW === 'true';

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
    console.log(`🔍 Starting Stripe webhook smoke test...`);
    console.log(`STRICT_NEW: ${STRICT_NEW}\n`);

    let hasErrors = false;

    const oldResult = await checkWebhook(OLD_URL);
    console.log(`[${oldResult.status}] Old Webhook: ${oldResult.url}`);
    if (oldResult.status === 404 || oldResult.status === 'ERROR') {
        console.error(`❌ Old webhook endpoint returned 404 Not Found or Error.`);
        hasErrors = true;
    }

    const newResult = await checkWebhook(NEW_URL);
    console.log(`[${newResult.status === 'ERROR' ? newResult.message : newResult.status}] New Webhook: ${newResult.url}`);

    if (newResult.status === 404 || newResult.status === 'ERROR') {
        if (STRICT_NEW) {
            console.error(`❌ New webhook endpoint returned 404 Not Found or Error. STRICT_NEW is enabled.`);
            hasErrors = true;
        } else {
            console.warn(`⚠️  New webhook endpoint check failed. Non-blocking since NEW isn't active yet.`);
        }
    } else if (newResult.status !== 400 && newResult.status !== 405 && newResult.status !== 500) {
        // usually passing without body/sig yields 400, 405 or 500
        console.log(`ℹ️ New webhook returned unexpected status: ${newResult.status}`);
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

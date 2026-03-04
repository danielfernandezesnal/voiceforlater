/**
 * Domain Smoke Test Script
 * Verifies that the old and new domains respond appropriately.
 */
import https from 'https';

const OLD_URL = process.env.OLD_URL || 'https://voiceforlater.vercel.app';
const NEW_URL = process.env.NEW_URL || 'https://carrymywords.com';

const endpoints = ['/', '/es', '/en', '/api/health'];

async function checkUrl(baseUrl, path) {
    const fullUrl = `${baseUrl}${path}`;
    const startTime = Date.now();

    return new Promise((resolve) => {
        const req = https.get(fullUrl, { rejectUnauthorized: false }, (res) => {
            const timeTaken = Date.now() - startTime;
            resolve({
                url: fullUrl,
                status: res.statusCode,
                time: timeTaken,
            });
            res.resume();
        });

        req.on('error', (e) => {
            const timeTaken = Date.now() - startTime;
            resolve({
                url: fullUrl,
                status: 'ERROR',
                message: e.message,
                time: timeTaken,
            });
        });

        req.setTimeout(5000, () => {
            req.destroy();
            resolve({
                url: fullUrl,
                status: 'TIMEOUT',
                time: 5000,
            });
        });
    });
}

async function run() {
    console.log(`🔍 Starting domain smoke test...`);
    console.log(`OLD_URL: ${OLD_URL}`);
    console.log(`NEW_URL: ${NEW_URL}\n`);

    let hasErrors = false;

    console.log(`--- Checking Old Domain ---`);
    for (const path of endpoints) {
        const result = await checkUrl(OLD_URL, path);
        console.log(`[${result.status}] ${result.time}ms - ${result.url}`);

        if (result.status !== 200 && path !== '/api/health') {
            console.error(`❌ Old domain failed on ${path} with status ${result.status}. Expected 200.`);
            hasErrors = true;
        }
    }

    console.log(`\n--- Checking New Domain ---`);
    for (const path of endpoints) {
        const result = await checkUrl(NEW_URL, path);
        console.log(`[${result.status === 'ERROR' ? result.message : result.status}] ${result.time}ms - ${result.url}`);

        if (path !== '/api/health') {
            const isOk = result.status === 200;
            const isPending = result.status === 404 || result.status === 'ERROR' || result.status === 308 || result.status === 301;
            if (!isOk && !isPending) {
                console.error(`❌ New domain responded with unexpected status ${result.status} on ${path}. Expected 200 or 404/SSL-pending.`);
                hasErrors = true;
            }
        }
    }

    if (hasErrors) {
        console.error(`\n🚨 Smoke test failed.`);
        process.exit(1);
    } else {
        console.log(`\n✅ Smoke test passed!`);
        process.exit(0);
    }
}

run().catch(console.error);

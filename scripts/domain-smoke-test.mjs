/**
 * Domain Smoke Test Script
 * Verifies that the old and new domains respond appropriately.
 */
import https from 'https';

const OLD_URL = process.env.OLD_URL || 'https://voiceforlater.vercel.app';
const NEW_URL = process.env.NEW_URL || 'https://carrymywords.com';
const STRICT_NEW = process.env.STRICT_NEW === 'true';

const endpoints = ['/', '/es', '/en', '/api/health'];

async function checkUrl(baseUrl, path, followRedirect = true) {
    const fullUrl = `${baseUrl}${path}`;
    const startTime = Date.now();

    return new Promise((resolve) => {
        const req = https.get(fullUrl, { rejectUnauthorized: false }, (res) => {
            const timeTaken = Date.now() - startTime;
            const status = res.statusCode;

            // Consume response data to free up memory
            res.resume();

            if (followRedirect && [301, 302, 307, 308].includes(status) && res.headers.location) {
                const nextUrl = new URL(res.headers.location, baseUrl).toString();
                // We resolve with a special flag indicating redirect, and we can follow it
                resolve({
                    url: fullUrl,
                    status: status,
                    time: timeTaken,
                    redirectLocation: nextUrl,
                    isRedirect: true
                });
                return;
            }

            resolve({
                url: fullUrl,
                status: status,
                time: timeTaken,
                isRedirect: false
            });
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
    console.log(`NEW_URL: ${NEW_URL}`);
    console.log(`STRICT_NEW: ${STRICT_NEW}\n`);

    let hasErrors = false;

    console.log(`--- Checking Old Domain ---`);
    for (const path of endpoints) {
        let result = await checkUrl(OLD_URL, path);
        console.log(`[${result.status}] ${result.time}ms - ${result.url}`);

        if (result.isRedirect) {
            console.log(` ↪ Redirects to: ${result.redirectLocation}`);
            const followResult = await checkUrl(result.redirectLocation, '', false); // fetch the redirect target itself
            console.log(`   [${followResult.status}] ${followResult.time}ms - ${followResult.url}`);
            result = followResult; // We validate the final destination
        }

        if (path === '/api/health') {
            if (result.status === 404) {
                console.log(`ℹ️  /api/health returned 404. Skipping as optional endpoint.`);
            } else if (result.status !== 200) {
                console.error(`❌ Old domain failed on ${path} with status ${result.status}.`);
                hasErrors = true;
            }
        } else {
            if (result.status !== 200) {
                console.error(`❌ Old domain failed on ${path} with final status ${result.status}. Expected 200.`);
                hasErrors = true;
            }
        }
    }

    console.log(`\n--- Checking New Domain ---`);
    for (const path of endpoints) {
        let result = await checkUrl(NEW_URL, path);
        console.log(`[${result.status === 'ERROR' ? result.message : result.status}] ${result.time}ms - ${result.url}`);

        if (result.isRedirect) {
            console.log(` ↪ Redirects to: ${result.redirectLocation}`);
            const followResult = await checkUrl(result.redirectLocation, '', false);
            console.log(`   [${followResult.status}] ${followResult.time}ms - ${followResult.url}`);
            result = followResult;
        }

        if (path !== '/api/health') {
            const isOk = result.status === 200;
            if (!isOk) {
                if (STRICT_NEW) {
                    console.error(`❌ New domain responded with unexpected status ${result.status} on ${path}. STRICT_NEW is enabled.`);
                    hasErrors = true;
                } else {
                    console.warn(`⚠️  New domain status is ${result.status} on ${path}. Non-blocking since NEW isn't fully active yet.`);
                }
            }
        } else {
            if (result.status !== 200 && result.status !== 404 && STRICT_NEW) {
                console.error(`❌ New domain failed on ${path} with status ${result.status}.`);
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

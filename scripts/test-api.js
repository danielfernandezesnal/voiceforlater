// using native fetch

async function test() {
    try {
        const response = await fetch('https://voiceforlater.vercel.app/api/auth/magic-link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@test.com', locale: 'en' })
        });
        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Data:', data);
    } catch (e) {
        console.error(e);
    }
}

test();

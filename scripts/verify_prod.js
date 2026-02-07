const https = require('https');

const url = 'https://voiceforlater.vercel.app/es/auth/login';

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Status Code:', res.statusCode);

        // Check for "Voice for later"
        if (data.includes('Voice for later')) {
            console.log('✅ Found "Voice for later"');
        } else {
            console.log('❌ "Voice for later" NOT found');
        }

        // Check for "Tu Legado Digital"
        if (data.includes('Tu Legado Digital')) {
            console.log('❌ Found "Tu Legado Digital" (Should be removed)');
        } else {
            console.log('✅ "Tu Legado Digital" NOT found');
        }

        // Check for magic link message part
        if (data.includes('enlace mágico')) {
            console.log('❌ Found "enlace mágico" (Should be removed)');
        } else {
            console.log('✅ "enlace mágico" NOT found (Good)');
        }
    });

}).on('error', (err) => {
    console.log('Error: ' + err.message);
});

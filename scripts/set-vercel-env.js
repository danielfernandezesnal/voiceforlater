const { execSync } = require('child_process');
const fs = require('fs');

const envs = [
    { key: 'RESEND_API_KEY', file: 'RESEND_API_KEY.txt' },
    { key: 'SUPABASE_SERVICE_ROLE_KEY', file: 'SUPABASE_SERVICE_ROLE_KEY.txt' }
];

for (const { key, file } of envs) {
    try {
        const value = fs.readFileSync(file, 'utf8');
        console.log(`Setting ${key} from ${file}...`);
        // We use input option to pass the value to stdin, avoiding shell parsing completely
        execSync(`npx vercel env add ${key} production`, {
            input: value,
            stdio: ['pipe', 'inherit', 'inherit'],
            shell: true
        });
        console.log(`Successfully set ${key}`);
    } catch (e) {
        console.error(`Failed to set ${key}:`, e.message);
    }
}

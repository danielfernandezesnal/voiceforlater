const fs = require('fs');
const path = require('path');

const rootDir = __dirname + '/../';
const blacklist = ['.git', '.next', 'node_modules', '.vercel', 'coverage', 'dist', 'build'];

function searchFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, index) => {
        if (line.includes('fetch(') || line.includes('fetch (')) {
            if (line.includes('/messages') && !line.includes('/api/messages')) {
                console.log(`FOUND in ${filePath}:${index + 1}: ${line.trim()}`);
            }
            if (line.includes('/profile') && !line.includes('/api/profile')) {
                console.log(`FOUND in ${filePath}:${index + 1}: ${line.trim()}`);
            }
        }
    });
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (blacklist.includes(file)) continue;
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            walkDir(filePath);
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
                searchFile(filePath);
            }
        }
    }
}

console.log('Searching for fetch("/messages") or fetch("/profile") without /api...');
walkDir(rootDir);

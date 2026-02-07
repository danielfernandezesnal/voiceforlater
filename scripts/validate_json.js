const fs = require('fs');
const path = require('path');

const esPath = path.join(__dirname, '../messages/es.json');
const enPath = path.join(__dirname, '../messages/en.json');

function checkJson(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const json = JSON.parse(content);
        console.log(`✅ ${path.basename(filePath)} is valid JSON`);
        if (json.common && json.common.appName) {
            console.log(`   - common.appName: ${json.common.appName}`);
        } else {
            console.error(`   ❌ common.appName missing in ${path.basename(filePath)}`);
        }
    } catch (e) {
        console.error(`❌ Error parsing ${path.basename(filePath)}:`, e.message);
    }
}

checkJson(esPath);
checkJson(enPath);

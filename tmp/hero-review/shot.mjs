import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PREVIEW_URL = 'https://voiceforlater-git-fi-430f64-daniel-fernandezs-projects-6d91943c.vercel.app/es';
const OUTPUT_DIR = __dirname;

async function capture() {
    console.log('Launching browser...');
    const browser = await chromium.launch();
    const context = await browser.newContext();

    const viewports = [
        { name: 'desktop', width: 1440, height: 900 },
        { name: 'tablet', width: 768, height: 1024 },
        { name: 'mobile', width: 390, height: 844 },
    ];

    for (const vp of viewports) {
        console.log(`Capturing ${vp.name}...`);
        const page = await context.newPage();
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(PREVIEW_URL, { waitUntil: 'networkidle' });
        await page.screenshot({ path: path.join(OUTPUT_DIR, `${vp.name}.png`), fullPage: true });
        await page.close();
    }

    await browser.close();
    console.log('Done.');
}

capture().catch(err => {
    console.error(err);
    process.exit(1);
});

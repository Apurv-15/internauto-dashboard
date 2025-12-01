import puppeteer from 'puppeteer';

(async () => {
    console.log('🚀 Testing Puppeteer...');
    try {
        const browser = await puppeteer.launch({
            headless: false, // We want to see the browser
            args: ['--no-sandbox']
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });

        console.log('🌐 Navigating to Internshala...');
        await page.goto('https://internshala.com', { waitUntil: 'networkidle2' });

        const title = await page.title();
        console.log(`✅ Success! Page title: ${title}`);

        console.log('😴 Waiting 3 seconds...');
        await new Promise(r => setTimeout(r, 3000));

        await browser.close();
        console.log('👋 Browser closed. Test passed!');

    } catch (error) {
        console.error('❌ Error:', error);
    }
})();

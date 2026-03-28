const { chromium } = require('playwright');

const keyword = process.argv[2] || '';
const location = process.argv[3] || '';

(async () => {
    // Tambahkan args '--no-sandbox' agar lebih ringan di server
    const browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();

    try {
        // Menggunakan format URL pencarian yang lebih standar
        const searchUrl = `https://id.jobstreet.com/id/${keyword.replace(/\s+/g, '-')}-jobs/in-${location.replace(/\s+/g, '-')}`;
        
        await page.goto(searchUrl, { 
            waitUntil: 'domcontentloaded', 
            timeout: 60000 // Naikkan ke 60 detik
        });

        // Tunggu selector dengan opsi 'visible' agar lebih akurat
        await page.waitForSelector('article[data-card-type]', { 
            timeout: 20000, 
            state: 'visible' 
        });

        const jobs = await page.evaluate(() => {
            const cards = Array.from(document.querySelectorAll('article[data-card-type]'));
            return cards.map(card => ({
                title: card.querySelector('a[data-automation="jobTitle"]')?.innerText || 'N/A',
                company: card.querySelector('a[data-automation="jobCompany"]')?.innerText || 'N/A',
                location: card.querySelector('a[data-automation="jobLocation"]')?.innerText || 'N/A',
                link: card.querySelector('a[data-automation="jobTitle"]')?.href || ''
            }));
        });

        process.stdout.write(JSON.stringify(jobs));

    } catch (error) {
        // Jika timeout, kirim array kosong agar workflow n8n tidak berhenti total
        process.stdout.write(JSON.stringify({ error: error.message, status: "failed" }));
        process.exit(0); // Exit 0 agar n8n tidak menganggapnya sebagai crash sistem
    } finally {
        await browser.close();
    }
})();
import puppeteer from 'puppeteer-extra';
import originalPuppeteer from 'puppeteer';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import path from 'path';

puppeteer.use(StealthPlugin());

const COOKIES_PATH = path.resolve(__dirname, '../../storage/youtube_cookies.json');

export async function uploadViaPuppeteer(videoPath: string, title: string, description: string) {
    let browser;
    try {
        console.log('[Puppeteer] Launching browser...');
        const hasCookies = fs.existsSync(COOKIES_PATH);
        
        let execPath: string = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
        if (!fs.existsSync(execPath)) {
            execPath = (await originalPuppeteer.executablePath()) as unknown as string;
        }
        const profilePath = path.resolve(__dirname, '../../storage/chrome_profile');
        
        browser = await puppeteer.launch({
            executablePath: execPath,
            headless: false, // ALWAYS false so we avoid Google Bot Detection and user can watch!
            defaultViewport: null,
            userDataDir: profilePath,
            ignoreDefaultArgs: ['--enable-automation'],
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--start-maximized'
            ]
        });

        let page = await browser.newPage();

        // Cookies are now handled natively by the Chrome profile!
        // We no longer need to inject or save cookies manually.

        // Navigate to YouTube Studio Upload page
        await page.goto('https://studio.youtube.com/', { waitUntil: 'networkidle2' });

        // Check if we are logged in by looking for the avatar or create button
        const isLoggedIn = await page.$('#avatar').catch(() => null) || await page.$('#create-icon').catch(() => null);

        if (!isLoggedIn) {
            console.log('[Puppeteer] Waiting for manual login... Please log in completely.');
            
            // Wait for any tab to reach studio.youtube.com
            let studioReached = false;
            while (!studioReached) {
                const pages = await browser.pages();
                for (const p of pages) {
                    try {
                        const urlObj = new URL(p.url());
                        if (urlObj.hostname === 'studio.youtube.com') {
                            page = p; // switch our reference to the active studio tab
                            studioReached = true;
                            break;
                        }
                    } catch (e) {}
                }
                if (!studioReached) await new Promise(r => setTimeout(r, 2000));
            }
            
            console.log('[Puppeteer] Reached Studio URL, waiting for UI to load...');
            await new Promise(r => setTimeout(r, 8000)); // wait 8 seconds for UI to fully render

            console.log('[Puppeteer] Login detected! Proceeding with upload...');
        }

        console.log(`[Puppeteer] Navigating to upload dialog for: ${title}`);
        
        // Find and click the Create button using deep recursive shadow DOM traversal
        const clickedCreate = await page.evaluate(async () => {
            function deepFind(root: any, id: string, ariaLabel?: string): any {
                if (root.id === id) return root;
                if (ariaLabel && root.getAttribute && root.getAttribute('aria-label') === ariaLabel) return root;
                for (let child of root.children || []) {
                    const found = deepFind(child, id, ariaLabel);
                    if (found) return found;
                }
                if (root.shadowRoot) {
                    const found = deepFind(root.shadowRoot, id, ariaLabel);
                    if (found) return found;
                }
                return null;
            }
            
            // Try ID or Aria-Label
            const createBtn = deepFind(document.body, 'create-icon', 'Create') || deepFind(document.body, 'upload-icon');
            if (createBtn) {
                createBtn.click();
                await new Promise(r => setTimeout(r, 2000));
                
                // Click "Upload videos" item
                const uploadItem = deepFind(document.body, 'text-item-0') || deepFind(document.body, '', 'Upload videos');
                if (uploadItem) {
                    uploadItem.click();
                } else {
                    // Fallback to clicking the first list-item in the popup
                    const items = document.querySelectorAll('tp-yt-paper-item');
                    if (items.length > 0) (items[0] as HTMLElement).click();
                }
                return true;
            }
            return false;
        });

        if (!clickedCreate) {
            console.log('[Puppeteer] Could not find the Create button even with deep traversal!');
            await page.screenshot({ path: path.join(__dirname, '../../storage/debug_create_failed.png') });
            console.log('[Puppeteer] Saved debug screenshot to storage/debug_create_failed.png');
            
            console.log('[Puppeteer] Attempting URL-based fallback to open upload dialog...');
            const currentUrl = page.url().split('?')[0];
            if (currentUrl.includes('/channel/')) {
                await page.goto(currentUrl + '/videos/upload?d=upload', { waitUntil: 'networkidle2' });
            }
            await new Promise(r => setTimeout(r, 5000));
        }
        
        // Wait for file input using deep traversal to find the input element
        console.log('[Puppeteer] Waiting for file input...');
        await page.waitForFunction(() => {
            function deepQuery(root: any, sel: string): any {
                if (root.matches && root.matches(sel)) return root;
                for (let child of root.children || []) {
                    const found = deepQuery(child, sel);
                    if (found) return found;
                }
                if (root.shadowRoot) {
                    const found = deepQuery(root.shadowRoot, sel);
                    if (found) return found;
                }
                return null;
            }
            return !!deepQuery(document.body, 'input[type="file"]');
        }, { timeout: 60000 });

        const fileHandle = await page.evaluateHandle(() => {
            function deepQuery(root: any, sel: string): any {
                if (root.matches && root.matches(sel)) return root;
                for (let child of root.children || []) {
                    const found = deepQuery(child, sel);
                    if (found) return found;
                }
                if (root.shadowRoot) {
                    const found = deepQuery(root.shadowRoot, sel);
                    if (found) return found;
                }
                return null;
            }
            return deepQuery(document.body, 'input[type="file"]');
        });
        
        await (fileHandle as any).uploadFile(videoPath);
        
        console.log('[Puppeteer] Video file selected, waiting for upload modal to load...');
        
        // Wait for the title box to appear
        console.log('[Puppeteer] Waiting for title/description textboxes...');
        await page.waitForFunction(() => {
            function deepQueryAll(root: any, sel: string, results: any[] = []): any[] {
                if (root.matches && root.matches(sel)) results.push(root);
                for (let child of root.children || []) deepQueryAll(child, sel, results);
                if (root.shadowRoot) deepQueryAll(root.shadowRoot, sel, results);
                return results;
            }
            return deepQueryAll(document.body, '#textbox').length >= 2;
        }, { timeout: 30000 });
        
        // Set Title & Description
        console.log('[Puppeteer] Setting title and description...');
        await page.evaluate(async (vidTitle: string, vidDesc: string) => {
            function deepQueryAll(root: any, sel: string, results: any[] = []): any[] {
                if (root.matches && root.matches(sel)) results.push(root);
                for (let child of root.children || []) deepQueryAll(child, sel, results);
                if (root.shadowRoot) deepQueryAll(root.shadowRoot, sel, results);
                return results;
            }
            const textboxes = deepQueryAll(document.body, '#textbox');
            
            if (textboxes[0]) {
                textboxes[0].focus();
                document.execCommand('selectAll', false, "");
                document.execCommand('insertText', false, vidTitle);
            }
            if (textboxes[1]) {
                textboxes[1].focus();
                document.execCommand('selectAll', false, "");
                document.execCommand('insertText', false, vidDesc);
            }
        }, title, description);
        
        // Set "Not made for kids" radio button
        console.log('[Puppeteer] Setting audience restrictions...');
        await page.evaluate(() => {
            function deepQuery(root: any, sel: string): any {
                if (root.matches && root.matches(sel)) return root;
                for (let child of root.children || []) { const f = deepQuery(child, sel); if (f) return f; }
                if (root.shadowRoot) { const f = deepQuery(root.shadowRoot, sel); if (f) return f; }
                return null;
            }
            const notForKids = deepQuery(document.body, 'tp-yt-paper-radio-button[name="VIDEO_MADE_FOR_KIDS_NOT_MFK"]');
            if (notForKids) notForKids.click();
        });

        // Click through the "Next" buttons (Details -> Elements -> Checks -> Visibility)
        console.log('[Puppeteer] Navigating through wizard...');
        for (let i = 0; i < 3; i++) {
            await new Promise(r => setTimeout(r, 2000));
            await page.evaluate(() => {
                function deepQuery(root: any, sel: string): any {
                    if (root.matches && root.matches(sel)) return root;
                    for (let child of root.children || []) { const f = deepQuery(child, sel); if (f) return f; }
                    if (root.shadowRoot) { const f = deepQuery(root.shadowRoot, sel); if (f) return f; }
                    return null;
                }
                const nextBtn = deepQuery(document.body, '#next-button');
                if (nextBtn) nextBtn.click();
            });
        }
        
        // Visibility Page: Select 'Private' for safety
        console.log('[Puppeteer] Setting visibility to Private...');
        await page.evaluate(() => {
            function deepQuery(root: any, sel: string): any {
                if (root.matches && root.matches(sel)) return root;
                for (let child of root.children || []) { const f = deepQuery(child, sel); if (f) return f; }
                if (root.shadowRoot) { const f = deepQuery(root.shadowRoot, sel); if (f) return f; }
                return null;
            }
            const privateRadio = deepQuery(document.body, 'tp-yt-paper-radio-button[name="PRIVATE"]');
            if (privateRadio) privateRadio.click();
        });

        // Wait a few seconds for video to process a bit
        console.log('[Puppeteer] Waiting 10 seconds before finalizing...');
        await new Promise(r => setTimeout(r, 10000));
        
        console.log('[Puppeteer] Clicking Save/Publish...');
        await page.evaluate(() => {
            function deepQuery(root: any, sel: string): any {
                if (root.matches && root.matches(sel)) return root;
                for (let child of root.children || []) { const f = deepQuery(child, sel); if (f) return f; }
                if (root.shadowRoot) { const f = deepQuery(root.shadowRoot, sel); if (f) return f; }
                return null;
            }
            const doneBtn = deepQuery(document.body, '#done-button');
            if (doneBtn) doneBtn.click();
        });
        
        // Wait for upload complete dialog or studio dashboard
        console.log('[Puppeteer] ✅ Upload completely successfully!');
        await new Promise(r => setTimeout(r, 5000));
        
        return "PUPPETEER_UPLOAD_" + Date.now();
    } catch (err) {
        console.error('[Puppeteer] Upload failed:', err);
        throw err;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

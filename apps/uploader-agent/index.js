require('dotenv').config({ path: '../../.env' });
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const VERCEL_API_URL = process.env.VERCEL_API_URL || 'http://localhost:3000';
const PIPELINE_SECRET = process.env.PIPELINE_SECRET;
const DOWNLOAD_DIR = path.join(__dirname, 'downloads');
const CHROME_PROFILE = path.join(__dirname, 'storage', 'chrome_profile');

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Ensure directories exist
if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
if (!fs.existsSync(CHROME_PROFILE)) fs.mkdirSync(CHROME_PROFILE, { recursive: true });

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

async function downloadFile(url, dest) {
  log(`Downloading ${url} to ${dest}...`);
  // Using native fetch in Node 18+
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.statusText}`);
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(dest, buffer);
  log(`Download complete: ${dest}`);
}

function findChrome() {
  const paths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// Helper: Deep Shadow DOM text entry
async function typeInShadowDom(page, selector, text) {
  await page.evaluate((sel, txt) => {
    function getElement(root, selector) {
      if (root.matches && root.matches(selector)) return root;
      if (root.shadowRoot) {
        const found = getElement(root.shadowRoot, selector);
        if (found) return found;
      }
      for (const child of Array.from(root.children || [])) {
        const found = getElement(child, selector);
        if (found) return found;
      }
      return null;
    }
    const el = getElement(document.body, sel);
    if (el) {
      el.focus();
      document.execCommand('insertText', false, txt);
    }
  }, selector, text);
}

// Helper: Deep Shadow DOM click
async function clickInShadowDom(page, selector) {
  await page.evaluate((sel) => {
    function getElement(root, selector) {
      if (root.matches && root.matches(selector)) return root;
      if (root.shadowRoot) {
        const found = getElement(root.shadowRoot, selector);
        if (found) return found;
      }
      for (const child of Array.from(root.children || [])) {
        const found = getElement(child, selector);
        if (found) return found;
      }
      return null;
    }
    const el = getElement(document.body, sel);
    if (el) el.click();
  }, selector);
}

async function uploadToYoutube(job, videoPath) {
  log(`Starting Puppeteer upload for job ${job.id}`);
  const executablePath = findChrome();
  
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: executablePath || undefined, // fallback to bundled if null
    userDataDir: CHROME_PROFILE,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    log('Navigating to YouTube Studio...');
    await page.goto('https://studio.youtube.com', { waitUntil: 'networkidle2' });

    // Check if logged in
    const url = page.url();
    if (url.includes('accounts.google.com') || url.includes('signin')) {
      throw new Error('Not logged into YouTube. Run `npm run login` first.');
    }

    log('Clicking Create > Upload Videos...');
    await page.waitForSelector('#create-icon', { timeout: 10000 });
    await clickInShadowDom(page, '#create-icon');
    await new Promise(r => setTimeout(r, 1000));
    await clickInShadowDom(page, 'tp-yt-paper-item#text-item-0'); // "Upload videos"
    
    // File upload
    log('Waiting for file input...');
    await page.waitForSelector('input[type="file"]', { timeout: 10000 });
    const fileInput = await page.$('input[type="file"]');
    await fileInput.uploadFile(videoPath);
    
    log('Waiting for upload dialog to open...');
    await new Promise(r => setTimeout(r, 5000)); // Wait for dialog rendering

    // Title
    log('Setting title...');
    const titleBox = '#textbox[aria-label*="Add a title"]';
    await typeInShadowDom(page, titleBox, job.generatedTitle);

    // Description
    log('Setting description...');
    const descBox = '#textbox[aria-label*="Tell viewers about your video"]';
    await typeInShadowDom(page, descBox, job.generatedDescription);

    // Audience (Not made for kids)
    log('Setting Audience to "No, it\'s not made for kids"...');
    await clickInShadowDom(page, 'tp-yt-paper-radio-button[name="VIDEO_MADE_FOR_KIDS_NOT_MFK"]');

    // Next -> Next -> Next -> Visibility
    log('Clicking Next through wizard...');
    for (let i = 0; i < 3; i++) {
      await clickInShadowDom(page, '#next-button');
      await new Promise(r => setTimeout(r, 2000));
    }

    // Visibility (Public)
    log('Setting visibility to Public...');
    await clickInShadowDom(page, 'tp-yt-paper-radio-button[name="PUBLIC"]');

    // Publish
    log('Clicking Publish...');
    await clickInShadowDom(page, '#done-button');

    // Wait for "Video published" or progress indicator
    log('Waiting for publish confirmation...');
    await new Promise(r => setTimeout(r, 10000)); // Simple wait for now

    // Attempt to extract the published URL
    let publishedId = null;
    try {
      const href = await page.evaluate(() => {
        const a = document.querySelector('a[href*="youtu.be"]');
        return a ? a.href : null;
      });
      if (href) {
        publishedId = href.split('/').pop();
      }
    } catch(e) {}

    log(`Upload complete. Published ID: ${publishedId || 'unknown'}`);
    return publishedId;

  } finally {
    await browser.close();
  }
}

async function markJobComplete(jobId, publishedYoutubeId, error = null) {
  log(`Marking job ${jobId} complete...`);
  await fetch(`${VERCEL_API_URL}/api/pipeline/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PIPELINE_SECRET}`
    },
    body: JSON.stringify({ jobId, publishedYoutubeId, error: error ? String(error) : null })
  });
}

async function processReadyJobs() {
  log('Polling for ready jobs...');
  try {
    const res = await fetch(`${VERCEL_API_URL}/api/pipeline/ready-jobs`, {
      headers: { 'Authorization': `Bearer ${PIPELINE_SECRET}` }
    });
    if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
    
    const data = await res.json();
    if (data.count === 0) {
      log('No pending jobs.');
      return;
    }

    log(`Found ${data.count} ready jobs.`);
    
    for (const job of data.jobs) {
      if (!job.videoUrl) continue;
      
      const videoPath = path.join(DOWNLOAD_DIR, `${job.id}.mp4`);
      
      try {
        await downloadFile(job.videoUrl, videoPath);
        
        let attempts = 0;
        let success = false;
        
        while (attempts < 2 && !success) {
          try {
            attempts++;
            const publishedId = await uploadToYoutube(job, videoPath);
            await markJobComplete(job.id, publishedId);
            success = true;
          } catch (uploadErr) {
            log(`Upload attempt ${attempts} failed: ${uploadErr.message}`);
            if (attempts >= 2) throw uploadErr;
            await new Promise(r => setTimeout(r, 30000)); // Wait 30s before retry
          }
        }
      } catch (err) {
        log(`Failed to process job ${job.id}: ${err.message}`);
        await markJobComplete(job.id, null, err.message);
      } finally {
        if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
      }
    }
  } catch (err) {
    log(`Polling error: ${err.message}`);
  }
}

// Manual Login mode
if (process.argv.includes('--manual-login')) {
  (async () => {
    log('Starting manual login mode. Please log into YouTube Studio.');
    const executablePath = findChrome();
    const browser = await puppeteer.launch({
      headless: false,
      executablePath: executablePath || undefined,
      userDataDir: CHROME_PROFILE,
    });
    const page = await browser.newPage();
    await page.goto('https://studio.youtube.com');
    log('Close the browser window when you are done logging in.');
    // Keep alive until user closes
  })();
} else {
  // Agent loop
  log('Starting Local Uploader Agent...');
  processReadyJobs();
  setInterval(processReadyJobs, POLL_INTERVAL);
}

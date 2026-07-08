require('dotenv').config({ path: '../../.env' });
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const VERCEL_API_URL = process.env.VERCEL_API_URL || 'http://localhost:3000';
const PIPELINE_SECRET = process.env.PIPELINE_SECRET;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
const DOWNLOAD_DIR = path.join(__dirname, 'downloads');
const CHROME_PROFILE = path.join(__dirname, 'storage', 'chrome_profile');

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MAX_RETRIES = 3;

// Ensure directories exist
if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
if (!fs.existsSync(CHROME_PROFILE)) fs.mkdirSync(CHROME_PROFILE, { recursive: true });

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function cleanupOldDownloads() {
  log('Cleaning up old downloaded files from previous runs...');
  try {
    const files = fs.readdirSync(DOWNLOAD_DIR);
    for (const file of files) {
      const filePath = path.join(DOWNLOAD_DIR, file);
      if (fs.statSync(filePath).isFile()) {
        try {
          fs.unlinkSync(filePath);
          log(`Deleted leftover file: ${file}`);
        } catch (e) {
          log(`Failed to delete leftover file ${file}: ${e.message}`);
        }
      }
    }
  } catch (err) {
    log(`Failed to read downloads directory: ${err.message}`);
  }
}

// ─────────────────────────────────────────────────────────
// Telegram Notifications
// ─────────────────────────────────────────────────────────
async function sendTelegramNotification(message) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });
  } catch (err) {
    log(`Telegram notification failed: ${err.message}`);
  }
}

// ─────────────────────────────────────────────────────────
// File Downloads (with retry)
// ─────────────────────────────────────────────────────────
async function downloadFile(url, dest, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      log(`Downloading ${url} (attempt ${attempt}/${retries})...`);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const arrayBuffer = await res.arrayBuffer();
      fs.writeFileSync(dest, Buffer.from(arrayBuffer));
      log(`Download complete: ${dest} (${(fs.statSync(dest).size / 1024 / 1024).toFixed(1)} MB)`);
      return;
    } catch (err) {
      log(`Download attempt ${attempt} failed: ${err.message}`);
      if (attempt >= retries) throw err;
      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
      log(`Retrying in ${delay / 1000}s...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// ─────────────────────────────────────────────────────────
// Chrome Discovery
// ─────────────────────────────────────────────────────────
function findChrome() {
  const paths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.CHROME_PATH // Allow custom path via env
  ].filter(Boolean);
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function clearChromeProfileLock() {
  try {
    const lockFiles = ['SingletonLock', 'SingletonSocket', 'SingletonCookie'];
    for (const file of lockFiles) {
      const lockPath = path.join(CHROME_PROFILE, file);
      if (fs.existsSync(lockPath)) {
        try { fs.unlinkSync(lockPath); } catch (e) {}
      }
    }
  } catch (e) {}
}

async function waitForShadowDomElement(page, selectors, timeout = 25000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    for (const sel of selectors) {
      try {
        const found = await page.evaluate((selector) => {
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
          const el = getElement(document.body, selector);
          return el ? selector : null;
        }, sel);
        if (found) return found;
      } catch (e) {}
    }
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error(`Waiting for selectors [${selectors.join(', ')}] failed after ${timeout}ms`);
}

async function typeInShadowDom(page, selector, text) {
  const typed = await page.evaluate((sel, txt) => {
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
      el.textContent = '';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      document.execCommand('insertText', false, txt);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
    return false;
  }, selector, text);

  // Human-like pause after typing
  await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));
  return typed;
}

async function extractPublishedVideoId(page) {
  return await page.evaluate(() => {
    function searchShadowForId(root) {
      if (!root) return null;
      
      // Look for anchor links with youtu.be or youtube.com/watch
      const links = root.querySelectorAll ? root.querySelectorAll('a[href*="youtu.be"], a[href*="youtube.com/watch"]') : [];
      for (const link of links) {
        const href = link.href || link.getAttribute('href') || '';
        if (href.includes('youtu.be/')) {
          const id = href.split('youtu.be/')[1]?.split('?')[0]?.split('&')[0];
          if (id && id.length >= 10) return id;
        }
        if (href.includes('v=')) {
          const id = href.split('v=')[1]?.split('&')[0];
          if (id && id.length >= 10) return id;
        }
      }

      // Look for share-url elements or text
      const shareEls = root.querySelectorAll ? root.querySelectorAll('.share-url, ytcp-video-permalink, [id*="video-url"]') : [];
      for (const el of shareEls) {
        const txt = el.textContent || el.value || el.getAttribute('href') || '';
        if (txt.includes('youtu.be/')) {
          const id = txt.split('youtu.be/')[1]?.split('?')[0]?.split(/\s/)[0];
          if (id && id.length >= 10) return id;
        }
      }

      // Recurse shadowRoot and children
      if (root.shadowRoot) {
        const found = searchShadowForId(root.shadowRoot);
        if (found) return found;
      }
      for (const child of Array.from(root.children || [])) {
        const found = searchShadowForId(child);
        if (found) return found;
      }
      return null;
    }
    return searchShadowForId(document.body);
  });
}

async function clickInShadowDom(page, selectors) {
  const selList = Array.isArray(selectors) ? selectors : [selectors];
  for (const sel of selList) {
    const clicked = await page.evaluate((selector) => {
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
      const el = getElement(document.body, selector);
      if (el) {
        el.click();
        return true;
      }
      return false;
    }, sel);
    if (clicked) {
      await new Promise(r => setTimeout(r, 800 + Math.random() * 400));
      return sel;
    }
  }
  return null;
}

async function waitForUploadCompletion(page, timeoutMs = 600000) {
  log('Waiting for upload completion (checking progress)...');
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    const progress = await page.evaluate(() => {
      function getProgressText(root) {
        if (!root) return null;
        const el = root.querySelector('.progress-label, ytcp-video-upload-progress, .upload-state, .status-area');
        if (el) return el.textContent || '';
        
        if (root.shadowRoot) {
          const txt = getProgressText(root.shadowRoot);
          if (txt) return txt;
        }
        for (const child of Array.from(root.children || [])) {
          const txt = getProgressText(child);
          if (txt) return txt;
        }
        return null;
      }
      return getProgressText(document.body);
    });

    if (progress && progress.trim().length > 0) {
      const text = progress.toLowerCase();
      log(`Current upload status: "${progress.trim()}"`);
      
      const isUploading = text.includes('uploading') || text.includes('%');
      const isFinished = text.includes('complete') || 
                         text.includes('processing') || 
                         text.includes('checks') || 
                         text.includes('ready') || 
                         text.includes('done') || 
                         text.includes('no issues');
                         
      if (isUploading) {
        // Still uploading, keep waiting
      } else if (isFinished) {
        log('Upload completed/processing started!');
        return true;
      } else {
        log(`Transient state detected ("${progress.trim()}"), continuing to wait...`);
      }
    } else {
      const isDone = await page.evaluate(() => {
        // Look for the specific final published popup/dialog, NOT the generic wizard close-button
        return !!document.querySelector('ytcp-video-share-dialog, .dialog-header[title="Video published"]');
      });
      if (isDone) {
        log('Upload verified via published dialog detection!');
        return true;
      }
      log('Waiting for upload progress or confirmation dialog...');
    }
    await new Promise(r => setTimeout(r, 5000));
  }
  throw new Error('Upload verification timed out.');
}

// ─────────────────────────────────────────────────────────
// Shorts Detection
// ─────────────────────────────────────────────────────────
function isShorts(videoPath) {
  // Quick check: if it came from our pipeline, it's almost always vertical (9:16)
  // We trust the job metadata if available; otherwise check filename patterns
  return true; // Our pipeline exclusively produces Shorts
}

function generateHashtags(title, niche) {
  const base = ['#Shorts', '#Viral', '#Trending', '#FYP'];
  if (niche) {
    const nicheTag = `#${niche.replace(/\s+/g, '')}`;
    base.unshift(nicheTag);
  }
  // Extract words from title to create hashtags
  const titleWords = (title || '').split(/\s+/)
    .filter(w => w.length > 3 && !w.startsWith('#'))
    .slice(0, 3)
    .map(w => `#${w.replace(/[^a-zA-Z0-9]/g, '')}`);
  
  return [...new Set([...base, ...titleWords])].slice(0, 8).join(' ');
}

// ─────────────────────────────────────────────────────────
// YouTube Upload via Puppeteer
// ─────────────────────────────────────────────────────────
async function uploadToYoutube(job, videoPath, thumbnailPath = null) {
  clearChromeProfileLock();
  log(`Starting Puppeteer upload for job ${job.id}`);
  const executablePath = findChrome();

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      executablePath: executablePath || undefined,
      userDataDir: CHROME_PROFILE,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--window-size=1280,900'
      ]
    });
  } catch (launchErr) {
    log(`Browser launch failed, attempting profile lock cleanup...`);
    clearChromeProfileLock();
    await new Promise(r => setTimeout(r, 2000));
    browser = await puppeteer.launch({
      headless: false,
      executablePath: executablePath || undefined,
      userDataDir: CHROME_PROFILE,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--window-size=1280,900'
      ]
    });
  }

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    log('Navigating to YouTube Studio...');
    await page.goto('https://studio.youtube.com', { waitUntil: 'networkidle2', timeout: 60000 });

    // Check if logged in
    const url = page.url();
    if (url.includes('accounts.google.com') || url.includes('signin')) {
      throw new Error('NOT_LOGGED_IN: Run `npm run login` first.');
    }

    // ── Step 1: Open Upload Dialog ──
    log('Clicking Create > Upload Videos...');
    const createSelectors = [
      '#create-icon',
      'ytcp-button#create-icon',
      'ytcp-icon-button#create-icon',
      'button[aria-label="Create"]',
      '#upload-icon',
      'ytcp-button#upload-icon',
      'ytcp-button[label="Upload videos"]',
      'ytcp-button[id="create-icon"]'
    ];
    await waitForShadowDomElement(page, createSelectors, 40000);
    await clickInShadowDom(page, createSelectors);
    await new Promise(r => setTimeout(r, 4000));

    const uploadOptionSelectors = [
      'tp-yt-paper-item#text-item-0',
      'tp-yt-paper-item',
      '#text-item-0',
      'yt-formatted-string[text-id="UPLOAD_VIDEO"]',
      '#upload-item'
    ];
    await clickInShadowDom(page, uploadOptionSelectors);

    // ── Step 2: Upload Video File ──
    log('Waiting for file input...');
    await page.waitForSelector('input[type="file"]', { timeout: 35000 });
    const fileInput = await page.$('input[type="file"]');
    await fileInput.uploadFile(videoPath);
    log('Video file selected. Waiting for upload dialog to fully initialize...');
    await new Promise(r => setTimeout(r, 12000));

    // ── Step 3: Title ──
    const title = (job.generatedTitle || 'Untitled Video').substring(0, 100);
    log(`Setting title: "${title}"`);
    const titleBox = '#textbox[aria-label*="Add a title"]';
    await typeInShadowDom(page, titleBox, title);

    // ── Step 4: Description with Hashtags ──
    const hashtags = generateHashtags(title, job.topic || job.niche);
    const description = `${job.generatedDescription || ''}\n\n${hashtags}`;
    log('Setting description with hashtags...');
    const descBox = '#textbox[aria-label*="Tell viewers about your video"]';
    await typeInShadowDom(page, descBox, description);

    // ── Step 5: Thumbnail Upload ──
    if (thumbnailPath && fs.existsSync(thumbnailPath)) {
      log('Uploading custom thumbnail...');
      try {
        const thumbInput = await page.$('input[accept="image/jpeg,image/png"]');
        if (thumbInput) {
          await thumbInput.uploadFile(thumbnailPath);
          log('Thumbnail uploaded successfully.');
          await new Promise(r => setTimeout(r, 4000));
        }
      } catch (thumbErr) {
        log(`Thumbnail upload failed (non-fatal): ${thumbErr.message}`);
      }
    }

    // ── Step 6: Audience (Not made for kids) ──
    log('Setting Audience to "No, it\'s not made for kids"...');
    const kidsSelectors = [
      'tp-yt-paper-radio-button[name="VIDEO_MADE_FOR_KIDS_NOT_MFK"]',
      '#made-for-kids-group tp-yt-paper-radio-button[name="VIDEO_MADE_FOR_KIDS_NOT_MFK"]',
      'tp-yt-paper-radio-button[id="off"]'
    ];
    await clickInShadowDom(page, kidsSelectors);

    // ── Step 7: Tags (Show More > Tags field) ──
    log('Expanding "Show More" for tags...');
    try {
      await clickInShadowDom(page, ['#toggle-button', 'ytcp-button#toggle-button']);
      await new Promise(r => setTimeout(r, 3000));
      const tagsInput = '#text-input[aria-label="Tags"]';
      const tags = [job.topic || job.niche, 'shorts', 'viral', 'trending', 'fyp', 'ai'].filter(Boolean).join(',');
      await typeInShadowDom(page, tagsInput, tags);
      log(`Tags set: ${tags}`);
    } catch (tagErr) {
      log(`Tags section skipped (non-fatal): ${tagErr.message}`);
    }

    // ── Step 8: Next -> Next -> Next -> Visibility ──
    log('Clicking Next through wizard (human pacing)...');
    const nextSelectors = ['#next-button', 'ytcp-button#next-button', '#next-button ytcp-button', 'button[aria-label="Next"]'];
    
    // Step Details -> Elements
    await clickInShadowDom(page, nextSelectors);
    await new Promise(r => setTimeout(r, 7000));

    // Step Elements -> Checks
    await clickInShadowDom(page, nextSelectors);
    await new Promise(r => setTimeout(r, 7000));

    // Step Checks -> Visibility
    await clickInShadowDom(page, nextSelectors);
    await new Promise(r => setTimeout(r, 7000));

    // ── Step 9: Extract Video Link & Set Visibility = Public ──
    let publishedId = await extractPublishedVideoId(page);
    if (publishedId) {
      log(`Found Video ID in upload dialog: ${publishedId}`);
    }

    log('Setting visibility to Public...');
    const publicSelectors = ['tp-yt-paper-radio-button[name="PUBLIC"]', '#first-container tp-yt-paper-radio-button[name="PUBLIC"]', 'tp-yt-paper-radio-button[id="radio-button"][name="PUBLIC"]'];
    await clickInShadowDom(page, publicSelectors);
    await new Promise(r => setTimeout(r, 5000));

    // ── Step 10: Wait for upload completion BEFORE clicking Publish ──
    log('Visibility set to Public. Verifying upload bytes are 100% complete before publishing...');
    await waitForUploadCompletion(page);

    // ── Step 11: Publish ──
    log('Clicking Publish...');
    const publishSelectors = ['#done-button', 'ytcp-button#done-button', '#done-button ytcp-button', 'button[aria-label="Publish"]', 'button[aria-label="Save"]'];
    await clickInShadowDom(page, publishSelectors);

    log('Waiting for confirmation and share dialog...');
    await new Promise(r => setTimeout(r, 15000));

    if (!publishedId) {
      publishedId = await extractPublishedVideoId(page);
    }

    log(`✅ Upload complete! Published ID: ${publishedId || 'unknown'}`);
    return publishedId;

  } finally {
    if (browser) {
      try { await browser.close(); } catch (e) {}
    }
    clearChromeProfileLock();
  }
}

// ─────────────────────────────────────────────────────────
// Job Status Updates
// ─────────────────────────────────────────────────────────
async function markJobComplete(jobId, publishedYoutubeId, error = null) {
  log(`Marking job ${jobId} as ${error ? 'FAILED' : 'COMPLETE'}...`);
  await fetch(`${VERCEL_API_URL}/api/pipeline/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PIPELINE_SECRET}`
    },
    body: JSON.stringify({ jobId, publishedYoutubeId, error: error ? String(error) : null })
  });
}

// ─────────────────────────────────────────────────────────
// Main Processing Loop (with Exponential Backoff Retries)
// ─────────────────────────────────────────────────────────
let isProcessing = false;

async function processReadyJobs() {
  if (isProcessing) {
    log('Already processing ready jobs, skipping this poll.');
    return;
  }
  isProcessing = true;
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
      const thumbnailPath = path.join(DOWNLOAD_DIR, `${job.id}_thumb.jpg`);

      try {
        // Download video
        await downloadFile(job.videoUrl, videoPath);

        // Download thumbnail if available
        let hasThumb = false;
        if (job.thumbnailUrl) {
          try {
            await downloadFile(job.thumbnailUrl, thumbnailPath);
            hasThumb = true;
          } catch (thumbErr) {
            log(`Thumbnail download failed (non-fatal): ${thumbErr.message}`);
          }
        }

        // Upload with exponential backoff retries
        let lastError = null;
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
          try {
            const publishedId = await uploadToYoutube(job, videoPath, hasThumb ? thumbnailPath : null);
            await markJobComplete(job.id, publishedId);

            // Send Telegram success notification
            await sendTelegramNotification(
              `✅ *Video Uploaded!*\n📹 Title: ${job.generatedTitle}\n🔗 ID: ${publishedId || 'unknown'}\n📊 Job: ${job.id}`
            );

            lastError = null;
            break;
          } catch (uploadErr) {
            lastError = uploadErr;
            log(`Upload attempt ${attempt}/${MAX_RETRIES} failed: ${uploadErr.message}`);
            if (attempt < MAX_RETRIES) {
              const delay = Math.pow(2, attempt) * 5000; // 10s, 20s, 40s
              log(`Retrying in ${delay / 1000}s...`);
              await new Promise(r => setTimeout(r, delay));
            }
          }
        }

        if (lastError) {
          log(`❌ All ${MAX_RETRIES} attempts failed for job ${job.id}`);
          await markJobComplete(job.id, null, lastError.message);
          await sendTelegramNotification(
            `❌ *Upload Failed!*\n📹 Title: ${job.generatedTitle}\n⚠️ Error: ${lastError.message}\n📊 Job: ${job.id}`
          );
        }
      } catch (err) {
        log(`Failed to process job ${job.id}: ${err.message}`);
        await markJobComplete(job.id, null, err.message);
        await sendTelegramNotification(`❌ *Job Failed:* ${err.message}`);
      } finally {
        // Cleanup downloaded files
        try {
          if (fs.existsSync(videoPath)) {
            fs.unlinkSync(videoPath);
            log(`Successfully cleaned up temporary video file: ${videoPath}`);
          }
        } catch (cleanupErr) {
          log(`Failed to clean up temporary video file ${videoPath}: ${cleanupErr.message}`);
        }
        try {
          if (fs.existsSync(thumbnailPath)) {
            fs.unlinkSync(thumbnailPath);
            log(`Successfully cleaned up temporary thumbnail file: ${thumbnailPath}`);
          }
        } catch (cleanupErr) {
          log(`Failed to clean up temporary thumbnail file ${thumbnailPath}: ${cleanupErr.message}`);
        }
      }
    }
  } catch (err) {
    log(`Polling error: ${err.message}`);
  } finally {
    isProcessing = false;
  }
}

// ─────────────────────────────────────────────────────────
// Manual Login mode
// ─────────────────────────────────────────────────────────
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
  })();
} else {
  // Agent loop
  log('🚀 Starting Bulletproof Local Uploader Agent v2.0...');
  log(`   Vercel API: ${VERCEL_API_URL}`);
  log(`   Poll interval: ${POLL_INTERVAL / 1000}s`);
  log(`   Max retries: ${MAX_RETRIES}`);
  log(`   Telegram: ${TELEGRAM_BOT_TOKEN ? 'Enabled ✅' : 'Disabled ❌'}`);
  cleanupOldDownloads();
  processReadyJobs();
  setInterval(processReadyJobs, POLL_INTERVAL);
}

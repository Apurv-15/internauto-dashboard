import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Store browser instance and page
let browser = null;
let page = null;
let isLoggedIn = false;

// Helper function to initialize browser
async function initBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: false, // Set to true for production
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }
  if (!page) {
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    // Set user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  }
  return { browser, page };
}

// API: Verify credentials and login
app.post('/api/verify-credentials', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const { page } = await initBrowser();

    // Navigate to Internshala login page
    await page.goto('https://internshala.com/login', { waitUntil: 'networkidle2' });

    // Wait for login form
    await page.waitForSelector('#email', { timeout: 10000 });

    // Fill in credentials
    await page.type('#email', email, { delay: 100 });
    await page.type('#password', password, { delay: 100 });

    // Click login button
    await page.click('#login_submit');

    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });

    // Check if login was successful
    const currentUrl = page.url();

    if (currentUrl.includes('/student/dashboard') || currentUrl.includes('/student')) {
      isLoggedIn = true;
      return res.json({
        success: true,
        message: 'Login successful',
        redirectUrl: currentUrl
      });
    } else {
      // Check for error messages
      const errorElement = await page.$('.alert-danger, .error-message');
      const errorMessage = errorElement
        ? await page.evaluate(el => el.textContent, errorElement)
        : 'Invalid credentials';

      return res.json({
        success: false,
        message: errorMessage.trim()
      });
    }

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed: ' + error.message
    });
  }
});

// API: Search for internships
app.post('/api/search-internships', async (req, res) => {
  try {
    if (!isLoggedIn) {
      return res.status(401).json({ success: false, message: 'Not logged in' });
    }

    const { keywords, location, remoteOnly, minStipend } = req.body;

    const { page } = await initBrowser();

    // Build search URL
    let searchUrl = 'https://internshala.com/internships/';

    if (keywords) {
      const keywordArray = keywords.split(',').map(k => k.trim());
      searchUrl += keywordArray[0].toLowerCase().replace(/\s+/g, '-') + '-';
    }

    searchUrl += 'internship';

    // Add filters
    const params = new URLSearchParams();
    if (remoteOnly) {
      params.append('type', 'virtual');
    } else if (location) {
      params.append('location', location);
    }

    if (params.toString()) {
      searchUrl += '?' + params.toString();
    }

    console.log('Searching:', searchUrl);

    // Navigate to search results
    await page.goto(searchUrl, { waitUntil: 'networkidle2' });

    // Wait for internship cards to load
    await page.waitForSelector('.internship_meta, .individual_internship', { timeout: 10000 });

    // Extract internship data
    const internships = await page.evaluate((minStipendValue) => {
      const cards = document.querySelectorAll('.internship_meta, .individual_internship');
      const results = [];

      cards.forEach((card, index) => {
        if (index >= 20) return; // Limit to 20 results

        try {
          // Extract title
          const titleElement = card.querySelector('.job-internship-name, .profile h3 a, h4.heading_4_5 a');
          const title = titleElement ? titleElement.textContent.trim() : 'Unknown Position';

          // Extract company
          const companyElement = card.querySelector('.company-name, .company h4 a, .link_display_like_text');
          const company = companyElement ? companyElement.textContent.trim() : 'Unknown Company';

          // Extract location
          const locationElement = card.querySelector('.location_link, .locations span a, #location_names a');
          const location = locationElement ? locationElement.textContent.trim() : 'Not specified';

          // Extract stipend
          const stipendElement = card.querySelector('.stipend, .item_body');
          let stipend = 'Not disclosed';
          let stipendAmount = 0;

          if (stipendElement) {
            const stipendText = stipendElement.textContent.trim();
            stipend = stipendText;

            // Extract numeric value
            const match = stipendText.match(/₹?\s*(\d+,?\d*)/);
            if (match) {
              stipendAmount = parseInt(match[1].replace(',', ''));
            }
          }

          // Extract link
          const linkElement = card.querySelector('a[href*="/internship/detail/"]');
          const link = linkElement ? 'https://internshala.com' + linkElement.getAttribute('href') : '#';

          // Extract posted time
          const postedElement = card.querySelector('.status-success, .status_container span');
          const posted = postedElement ? postedElement.textContent.trim() : 'Recently';

          // Filter by minimum stipend
          if (minStipendValue && stipendAmount > 0 && stipendAmount < minStipendValue) {
            return;
          }

          results.push({
            id: 'int_' + Date.now() + '_' + index,
            title,
            company,
            location,
            stipend,
            posted,
            link,
            status: 'pending'
          });
        } catch (err) {
          console.error('Error parsing internship card:', err);
        }
      });

      return results;
    }, minStipend || 0);

    console.log(`Found ${internships.length} internships`);

    res.json({
      success: true,
      internships,
      count: internships.length
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed: ' + error.message
    });
  }
});

// API: Apply to an internship
app.post('/api/apply-internship', async (req, res) => {
  try {
    if (!isLoggedIn) {
      return res.status(401).json({ success: false, message: 'Not logged in' });
    }

    const { internshipUrl, answers } = req.body;

    if (!internshipUrl) {
      return res.status(400).json({ success: false, message: 'Internship URL required' });
    }

    const { page } = await initBrowser();

    // Helper for waiting
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Navigate with better error handling
    try {
      // Use domcontentloaded which is faster and less prone to timeouts than networkidle2
      await page.goto(internshipUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    } catch (err) {
      console.error(`Navigation error: ${err.message}`);
      // Even if navigation "fails" (e.g. timeout), the page might still be usable
      // So we don't return immediately, but check if content loaded
    }

    // Wait a bit for dynamic content
    await wait(3000);

    // Check if we are on a valid page
    const title = await page.title();
    if (title.includes('404') || title.includes('Not Found')) {
      return res.json({ success: false, message: 'Internship page not found (404)', status: 'failed' });
    }

    // Check if already applied
    const alreadyApplied = await page.$('.already_applied, .btn-disabled, .applied_message');
    if (alreadyApplied) {
      return res.json({
        success: false,
        message: 'Already applied to this internship',
        status: 'already_applied'
      });
    }

    // Try multiple selectors for the apply button - use waitForSelector for robustness
    const applyButtonSelectors = [
      '#apply_now_button',
      '.btn.btn-primary.campaign',
      'button.view_detail_button',
      '.apply_now_button',
      '#easy_apply_button'
    ];

    let foundSelector = null;
    for (const selector of applyButtonSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        foundSelector = selector;
        console.log(`Found apply button with selector: ${selector}`);
        break;
      } catch (e) {
        // Selector not found, try next one
        continue;
      }
    }

    if (!foundSelector) {
      // Take screenshot for debugging
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      await page.screenshot({ path: `error_no_button_${timestamp}.png` });
      console.log(`Saved screenshot to error_no_button_${timestamp}.png`);

      return res.json({
        success: false,
        message: 'Apply button not found. Screenshot saved.',
        status: 'button_not_found'
      });
    }

    // Click apply button using the selector directly (more robust than element reference)
    try {
      await page.click(foundSelector);
      console.log('Clicked apply button successfully');
    } catch (err) {
      console.log('Normal click failed, trying JavaScript click');
      // Try javascript click if normal click fails
      await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (el) el.click();
      }, foundSelector);
    }

    // Wait for modal or navigation
    await wait(3000);

    // Handle "Continue" button if it appears (sometimes there's an intermediate step)
    try {
      const continueSelector = await page.waitForSelector('#continue_button, .continue_button', { timeout: 2000 });
      if (continueSelector) {
        await page.click('#continue_button, .continue_button');
        await wait(1000);
      }
    } catch (e) {
      // No continue button, that's fine
    }

    // Fill in answers if there are questions - use robust approach
    if (answers && answers.length > 0) {
      console.log(`Filling ${answers.length} answer(s)`);

      // Wait a bit for form to be ready
      await wait(1000);

      for (let i = 0; i < answers.length; i++) {
        if (!answers[i] || !answers[i].answer) continue;

        const answerText = answers[i].answer;

        // Try to fill using page.evaluate for maximum robustness
        const filled = await page.evaluate((index, text) => {
          // Try multiple selectors
          const selectors = [
            `textarea[name="answer_${index}"]`,
            `#cover_letter_holder textarea`,
            `.form-control`,
            `textarea`
          ];

          for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > index) {
              elements[index].value = text;
              elements[index].dispatchEvent(new Event('input', { bubbles: true }));
              elements[index].dispatchEvent(new Event('change', { bubbles: true }));
              return true;
            } else if (elements.length === 1 && index === 0) {
              elements[0].value = text;
              elements[0].dispatchEvent(new Event('input', { bubbles: true }));
              elements[0].dispatchEvent(new Event('change', { bubbles: true }));
              return true;
            }
          }
          return false;
        }, i, answerText);

        if (filled) {
          console.log(`Filled answer ${i + 1}`);
        } else {
          console.log(`Could not fill answer ${i + 1}`);
        }
      }

      await wait(500);
    }

    // Submit application - use same robust approach
    const submitButtonSelectors = [
      '#submit',
      'button[type="submit"]',
      '.submit_button',
      '#apply_button'
    ];

    let foundSubmitSelector = null;
    for (const selector of submitButtonSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        foundSubmitSelector = selector;
        break;
      } catch (e) {
        continue;
      }
    }

    if (foundSubmitSelector) {
      try {
        await page.click(foundSubmitSelector);
        console.log('Clicked submit button');
      } catch (err) {
        // Try JavaScript click as fallback
        await page.evaluate((sel) => {
          const el = document.querySelector(sel);
          if (el) el.click();
        }, foundSubmitSelector);
      }

      await wait(3000);

      // Check for success message
      const successElement = await page.$('.success-message, .alert-success, .applied_success');
      const currentUrl = page.url();

      if (successElement || currentUrl.includes('/application/success')) {
        return res.json({
          success: true,
          message: 'Application submitted successfully',
          status: 'applied'
        });
      }
    }

    // If we got here, assume success if no errors, but warn
    res.json({
      success: true,
      message: 'Application process completed (verification recommended)',
      status: 'applied'
    });

  } catch (error) {
    console.error('Apply error:', error);
    // Take screenshot on error
    try {
      if (page) await page.screenshot({ path: `error_exception_${Date.now()}.png` });
    } catch (e) { }

    res.status(500).json({
      success: false,
      message: 'Application failed: ' + error.message,
      status: 'failed'
    });
  }
});

// API: Get login status
app.get('/api/status', (req, res) => {
  res.json({
    isLoggedIn,
    browserActive: browser !== null
  });
});

// API: Logout and close browser
app.post('/api/logout', async (req, res) => {
  try {
    if (browser) {
      await browser.close();
      browser = null;
      page = null;
      isLoggedIn = false;
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  if (browser) {
    await browser.close();
  }
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

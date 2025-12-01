# 🎯 Quick Start Guide - InternBot

## What Changed?

Your InternBot now **scrapes REAL data from Internshala.com** instead of using mock data!

### Before ❌
- Fake company names (TechCorp, InnovateX, etc.)
- Simulated job listings
- No actual connection to Internshala

### After ✅
- **Real internships** scraped from Internshala
- **Actual login** to your Internshala account
- **Automated applications** to real positions
- **Live browser automation** with Puppeteer

---

## 🚀 Getting Started (5 Minutes)

### Step 1: Install Backend Dependencies

The backend handles all the web scraping. Install it first:

```bash
cd server
npm install
```

**Note**: This will take 2-3 minutes as Puppeteer downloads Chromium (~170MB).

### Step 2: Configure Your Credentials

Edit `server/.env` and add your Internshala credentials:

```bash
PORT=3001
```

**Important**: You'll enter your actual password in the dashboard UI (it's not stored in files).

### Step 3: Start the Backend

In a terminal window:

```bash
cd server
npm start
```

You should see:
```
🚀 Backend server running on http://localhost:3001
📊 Health check: http://localhost:3001/health
```

### Step 4: Start the Frontend

In a **NEW** terminal window:

```bash
npm run dev
```

The dashboard opens at `http://localhost:5173`

---

## 📱 Using the Dashboard

### 1. Login to Internshala

1. Go to **Configuration** tab
2. Enter your Internshala email
3. Enter your Internshala password
4. Click **Test Connection**
5. Wait for ✓ success message

**A Chrome window will open** - this is Puppeteer logging you in!

### 2. Set Your Filters

- **Keywords**: `web development, react, python` (comma-separated)
- **Location**: `Bangalore` or enable **Remote Only**
- **Min Stipend**: `5000` (in ₹)
- **Upload Resume**: For AI-generated answers

### 3. Configure AI Answers

1. Go to **AI Answers** tab
2. Click **Generate with AI** for each question
3. The AI uses your resume + keywords to write personalized answers
4. Edit if needed

### 4. Start Scraping!

1. Go to **Dashboard** tab
2. Click **Start Bot** (green button in sidebar)
3. Watch the magic happen:
   - 🔍 Searches Internshala
   - 📋 Lists real internships
   - 📝 Applies automatically
   - ✅ Shows success/failure

---

## 🎬 What Happens Behind the Scenes

### When You Click "Start Bot":

1. **Backend opens a Chrome browser** (you'll see it)
2. **Navigates to Internshala** search page
3. **Applies your filters** (keywords, location, stipend)
4. **Scrapes internship listings**:
   - Job title
   - Company name
   - Location
   - Stipend
   - Application link
5. **Sends data to frontend** (you see it in dashboard)
6. **For each internship**:
   - Opens detail page
   - Clicks "Apply Now"
   - Fills in your AI-generated answers
   - Submits application
7. **Updates status** in real-time

---

## 🔍 Troubleshooting

### "Failed to connect to backend"

**Problem**: Frontend can't reach backend server

**Solution**:
1. Make sure backend is running: `cd server && npm start`
2. Check `http://localhost:3001/health` in browser
3. Look for errors in backend terminal

### "Login failed"

**Problem**: Can't log into Internshala

**Solutions**:
- Double-check email/password
- Look at the Chrome window - is there a CAPTCHA?
- Check if Internshala requires 2FA
- Try logging in manually first in the browser

### "No internships found"

**Problem**: Search returns 0 results

**Solutions**:
- Use broader keywords: `software, development, intern`
- Remove location filter or try different cities
- Lower minimum stipend
- Check Internshala manually - are there any matching internships?

### "Apply button not found"

**Problem**: Bot can't find the apply button

**Solutions**:
- Internshala may have changed their UI
- Check the Chrome window - what does the page look like?
- You may need to update selectors in `server/server.js`

### Chrome window closes immediately

**Problem**: Browser crashes or closes

**Solutions**:
- Check backend terminal for errors
- Restart backend: `Ctrl+C` then `npm start`
- Clear browser cache

---

## 🎨 Understanding the Dashboard

### Stats Cards (Top)
- **Total Scanned**: All internships found
- **Applied**: Successfully submitted applications
- **Failed**: Applications that errored
- **Skipped**: Filtered out by your criteria

### Live Feed (Left)
- Real-time list of internships
- Color-coded status:
  - 🟡 Yellow = Pending
  - 🔵 Blue = Applying
  - 🟢 Green = Applied
  - 🔴 Red = Failed

### Console (Right Bottom)
- Live log of all bot actions
- Timestamps for debugging
- Error messages if something fails

### Chart (Right Top)
- Visual breakdown of application stats
- Updates in real-time

---

## ⚙️ Advanced Configuration

### Change Application Speed

Edit `App.tsx` line ~165:

```typescript
}, 5000); // Check every 5 seconds
```

Change `5000` to:
- `3000` = Faster (3 seconds)
- `10000` = Slower (10 seconds)

**Warning**: Too fast may trigger rate limiting!

### Run Headless (No Browser Window)

Edit `server/server.js` line ~18:

```javascript
browser = await puppeteer.launch({
  headless: true,  // Change false to true
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});
```

### Update Selectors (If Internshala Changes)

If scraping breaks, update CSS selectors in `server/server.js`:

```javascript
// Line ~100 - Internship cards
await page.waitForSelector('.internship_meta, .individual_internship');

// Line ~110 - Title
const titleElement = card.querySelector('.job-internship-name');

// Line ~115 - Company
const companyElement = card.querySelector('.company-name');
```

Use Chrome DevTools to find new selectors.

---

## 🛡️ Safety & Ethics

### Rate Limiting
- Bot applies to 1 internship every 5 seconds
- This is respectful to Internshala's servers
- Don't decrease below 3 seconds

### Session Management
- Browser stays open while backend runs
- Restart backend for fresh session
- Don't run multiple instances

### Terms of Service
- This tool is for **educational purposes**
- Automated scraping may violate Internshala's ToS
- Use responsibly and at your own risk
- Consider applying manually for important positions

### Data Privacy
- Your password is only sent to YOUR local backend
- No data is stored or sent to external servers
- Backend runs on `localhost` only

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND                          │
│  (React Dashboard - Port 5173)                      │
│  - Configuration UI                                 │
│  - Live job feed                                    │
│  - Stats & charts                                   │
│  - AI answer generator                              │
└──────────────────┬──────────────────────────────────┘
                   │ HTTP Requests
                   ▼
┌─────────────────────────────────────────────────────┐
│                   BACKEND                           │
│  (Express Server - Port 3001)                       │
│  - /api/verify-credentials                          │
│  - /api/search-internships                          │
│  - /api/apply-internship                            │
└──────────────────┬──────────────────────────────────┘
                   │ Controls
                   ▼
┌─────────────────────────────────────────────────────┐
│                  PUPPETEER                          │
│  (Headless Chrome Browser)                          │
│  - Opens Internshala.com                            │
│  - Logs in with credentials                         │
│  - Scrapes job listings                             │
│  - Fills application forms                          │
│  - Submits applications                             │
└─────────────────────────────────────────────────────┘
```

---

## 🎓 Next Steps

1. **Test with 1-2 applications first**
   - Make sure everything works
   - Check applied internships on Internshala

2. **Monitor the Chrome window**
   - Watch what the bot is doing
   - Catch any errors early

3. **Review AI-generated answers**
   - Make them personal
   - Add specific examples from your experience

4. **Set realistic filters**
   - Don't apply to everything
   - Focus on positions you actually want

5. **Check Internshala regularly**
   - Respond to messages from recruiters
   - Track interview invites

---

## 🆘 Need Help?

### Check Logs
- **Frontend**: Browser console (F12)
- **Backend**: Terminal where `npm start` is running

### Common Issues
- Most problems are due to Internshala UI changes
- Check the Chrome window to see what's happening
- Update selectors if needed

### Debug Mode
Add console logs in `server/server.js`:

```javascript
console.log('Current URL:', page.url());
console.log('Found internships:', internships.length);
```

---

**Happy job hunting! 🎉**

Remember: This tool helps you apply faster, but quality > quantity. Personalize your applications for best results!

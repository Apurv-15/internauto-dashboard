# 🤖 InternBot - Real Internshala Auto-Apply Bot

An intelligent automation tool that scrapes real internships from Internshala and automatically applies to them using AI-generated cover letters.

## ✨ Features

- **Real Web Scraping**: Uses Puppeteer to scrape actual internships from Internshala.com
- **Automated Login**: Securely logs into your Internshala account
- **Smart Filtering**: Filter by keywords, location, remote-only, and minimum stipend
- **AI-Powered Answers**: Generates personalized cover letter responses using Google's Gemini AI
- **Live Dashboard**: Real-time monitoring of applications with success metrics
- **Auto-Apply**: Automatically applies to matching internships with your custom answers

## 🏗️ Architecture

This project consists of two parts:

1. **Frontend** (React + TypeScript + Vite): Beautiful dashboard UI
2. **Backend** (Node.js + Express + Puppeteer): Web scraping and automation service

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Internshala Account** with valid credentials
- **Google Gemini API Key** (for AI-generated answers)

## 🚀 Setup Instructions

### 1. Install Frontend Dependencies

```bash
npm install
```

### 2. Install Backend Dependencies

```bash
cd server
npm install
cd ..
```

### 3. Configure Environment Variables

#### Frontend (.env.local)
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

#### Backend (server/.env)
```bash
PORT=3001
```

### 4. Start the Backend Server

Open a new terminal and run:

```bash
cd server
npm start
```

You should see:
```
🚀 Backend server running on http://localhost:3001
📊 Health check: http://localhost:3001/health
```

### 5. Start the Frontend

In another terminal:

```bash
npm run dev
```

The dashboard will open at `http://localhost:5173`

## 📖 Usage Guide

### Step 1: Configure Credentials

1. Go to the **Configuration** tab
2. Enter your Internshala email and password
3. Click **Test Connection** to verify credentials
4. Wait for the success message

### Step 2: Set Search Filters

1. Enter keywords (e.g., "web development, react, python")
2. Set your preferred location or enable **Remote Only**
3. Set minimum stipend amount
4. Upload your resume (PDF) for AI analysis

### Step 3: Configure AI Answers

1. Go to the **AI Answers** tab
2. Click **Generate with AI** for each question
3. Review and edit the generated answers
4. Add more custom questions if needed

### Step 4: Start the Bot

1. Go to the **Dashboard** tab
2. Click **Start Bot** in the sidebar
3. Watch as the bot:
   - Searches for matching internships
   - Displays them in real-time
   - Automatically applies to each one
   - Shows success/failure status

## 🔧 How It Works

### Backend Scraping Process

1. **Login**: Puppeteer opens a browser and logs into Internshala
2. **Search**: Navigates to search page with your filters
3. **Extract**: Parses internship cards to get title, company, location, stipend, link
4. **Apply**: For each internship:
   - Opens the detail page
   - Clicks the apply button
   - Fills in answers from your templates
   - Submits the application

### Frontend Dashboard

- Displays live feed of scraped internships
- Shows application status (Pending → Applying → Applied/Failed)
- Provides metrics and charts
- Logs all activities in real-time console

## 🎨 Tech Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Lucide React** - Icons
- **Recharts** - Charts
- **Google Gemini AI** - Answer generation

### Backend
- **Express** - Web server
- **Puppeteer** - Browser automation
- **CORS** - Cross-origin requests
- **dotenv** - Environment variables

## ⚠️ Important Notes

### Browser Visibility
- The backend runs Puppeteer in **non-headless mode** by default
- You'll see a Chrome window open when the bot runs
- This helps with debugging and avoiding detection
- Set `headless: true` in `server/server.js` for production

### Rate Limiting
- The bot applies to one internship every 5 seconds
- This prevents overwhelming Internshala's servers
- Adjust the interval in `App.tsx` if needed

### Session Management
- The browser session stays open while the backend is running
- Click **Stop Bot** to pause applications
- Restart the backend to create a fresh session

### Security
- Never commit your `.env` files
- Keep your Internshala credentials secure
- The password is only sent to your local backend

## 🐛 Troubleshooting

### "Failed to connect to backend"
- Make sure the backend server is running on port 3001
- Check `http://localhost:3001/health` in your browser

### "Login failed"
- Verify your Internshala credentials are correct
- Check if Internshala has changed their login page structure
- Look at the browser window for CAPTCHA or 2FA prompts

### "No internships found"
- Try broader keywords
- Remove location filters
- Lower the minimum stipend
- Check if Internshala has internships matching your criteria

### Scraping Errors
- Internshala may have updated their HTML structure
- Check browser console for selector errors
- Update selectors in `server/server.js` if needed

## 📝 API Endpoints

### Backend API

- `POST /api/verify-credentials` - Login to Internshala
- `POST /api/search-internships` - Search for internships
- `POST /api/apply-internship` - Apply to an internship
- `GET /api/status` - Get login status
- `POST /api/logout` - Logout and close browser
- `GET /health` - Health check

## 🤝 Contributing

This is a personal automation project. Use responsibly and respect Internshala's terms of service.

## ⚖️ Legal Disclaimer

This tool is for educational purposes. Automated scraping may violate Internshala's Terms of Service. Use at your own risk. The authors are not responsible for any consequences of using this tool.

## 📄 License

MIT License - Feel free to modify and use for personal projects.

---

**Made with ❤️ for students tired of manual applications**

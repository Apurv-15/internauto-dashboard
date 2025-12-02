# Deployment Guide (Single Service on Render)

We will deploy **both** the Frontend and Backend as a single service on Render.

## Step 1: Push to GitHub
Make sure all your latest changes are pushed to GitHub.

## Step 2: Create Web Service on Render
1.  **Login to [Render.com](https://render.com)**.
2.  Click **"New +"** -> **"Web Service"**.
3.  Connect your GitHub repository.
4.  **Configure the Service**:
    *   **Name**: `internauto-full` (or any unique name)
    *   **Root Directory**: `./` (Leave this blank or set to `.`)
    *   **Runtime**: `Node`
    *   **Build Command**: `npm install && npm run build && cd server && npm install`
        *   *(This installs root deps, builds frontend, then installs backend deps)*
    *   **Start Command**: `cd server && node server.js`
    *   **Instance Type**: Free

## Step 3: Environment Variables
Go to the **"Environment"** tab (or section) and add these:

1.  **Key**: `SERVER_AUTH_CONFIG`
    **Value**: `{"requireAuth":true,"maxRetries":3,"sessionTimeout":3600000,"securityKey":"intern-auto-secure-v1"}`
    *(Required for the server to start)*

2.  **Key**: `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD`
    **Value**: `true`
    *(Prevents downloading Chrome twice)*

3.  **Key**: `VITE_API_URL`
    **Value**: `/api`
    *(Important: This tells the frontend to use the same domain for API calls)*

## Step 4: Add Puppeteer Buildpack (Crucial)
1.  Go to the **"Settings"** tab.
2.  Scroll down to **"Buildpacks"**.
3.  Click **"Add Buildpack"**.
4.  Enter URL: `https://github.com/puppeteer/puppeteer-buildpack.git`
5.  Click **"Save Changes"**.

## Step 5: Deploy
Click **"Create Web Service"** (or "Manual Deploy" if you are editing an existing one).

Your app will be live at `https://your-app-name.onrender.com`.

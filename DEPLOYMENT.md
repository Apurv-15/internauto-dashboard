# Deployment Guide

This project consists of two parts:
1. **Frontend**: A React application (Vite)
2. **Backend**: A Node.js server with Puppeteer for automation

Because the backend uses Puppeteer (a headless browser) and maintains a persistent session (login state), it **cannot** be deployed as a standard Vercel Serverless Function. Vercel functions are stateless and have size limits that Puppeteer often exceeds.

Therefore, we recommend a **Split Deployment** strategy:

## Part 1: Deploy Backend to Render (Free Tier available)

Render is a cloud platform that supports Node.js and Puppeteer out of the box.

1.  **Push your code to GitHub**.
2.  **Sign up/Login to [Render.com](https://render.com)**.
3.  Click **"New +"** -> **"Web Service"**.
4.  Connect your GitHub repository.
5.  Configure the service:
    *   **Name**: `internauto-backend` (or similar)
    *   **Root Directory**: `server` (Important!)
    *   **Runtime**: `Node`
    *   **Build Command**: `npm install`
    *   **Start Command**: `node server.js`
    *   **Instance Type**: Free (or Starter if you need more performance)
6.  **Environment Variables**:
    *   **Key**: `SERVER_AUTH_CONFIG`
    *   **Value**: `{"requireAuth":true,"maxRetries":3,"sessionTimeout":3600000,"securityKey":"intern-auto-secure-v1"}`
    *   *(This is CRITICAL. Without this variable, the server will crash. This prevents others from running your code easily.)*
    
    *   Add `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD` = `true` (optional, but good if using a custom buildpack).

7.  Click **"Create Web Service"**.
8.  Once deployed, copy the **Service URL** (e.g., `https://internauto-backend.onrender.com`).

## Part 2: Deploy Frontend to Vercel

1.  **Login to [Vercel](https://vercel.com)**.
2.  Click **"Add New..."** -> **"Project"**.
3.  Import your GitHub repository.
4.  Configure the project:
    *   **Framework Preset**: Vite
    *   **Root Directory**: `./` (default)
5.  **Environment Variables**:
    *   Key: `VITE_API_URL`
    *   Value: `Your_Render_Backend_URL/api` (e.g., `https://internauto-backend.onrender.com/api`)
    *   *Note: Make sure to include `/api` at the end if your backend expects it, or just the base URL if your code appends `/api`.*
    *   *Looking at the code, it appends `/verify-credentials`, so if you set `VITE_API_URL` to `.../api`, it becomes `.../api/verify-credentials`.*
6.  Click **"Deploy"**.

## Local Development

To run locally:
1.  **Backend**:
    ```bash
    cd server
    npm install
    node server.js
    ```
2.  **Frontend**:
    ```bash
    npm install
    npm run dev
    ```

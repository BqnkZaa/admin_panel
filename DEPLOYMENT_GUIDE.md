# 🚀 Deployment Guide: Next.js + Worker + Redis (Free Tier)

This guide takes your local project and deploys it to a production-ready environment using free tiers from **Vercel**, **Upstash**, and **Render**.

---

## ✅ Prerequisites (Checklist)
- [x] **Project Prepared:** I have already updated your `package.json` and `src/workers/run.ts` to be production-ready.
- [x] **GitHub Account:** You need this for Vercel and Render.
- [ ] **Credit Card:** Upstash and Render may ask for a card for identity verification, even for free tiers (no charge).

---

## Step 1: Cloud Redis Setup (Upstash)
We need a cloud-hosted Redis to replace your local Docker Redis.

1.  **Sign Up:** Go to [Upstash Console](https://console.upstash.com/) and log in with GitHub.
2.  **Create Database:**
    *   Click **"Create Database"**.
    *   **Name:** `line-oa-redis` (or similar).
    *   **Region:** Choose a region close to your users (e.g., `Singapore` or `Japan` commonly for LINE apps, or `US-East-1` if your database is there).
    *   **Encryption:** OFF (for compatibility) or ON (if you prefer, usually fine).
3.  **Get Connection String:**
    *   In the database dashboard, find the **"Connect"** section.
    *   Click on the **"Node.js (ioredis)"** tab or just look for the `REDIS_URL`.
    *   It looks like: `rediss://default:your_password@your-endpoint.upstash.io:6379`
    *   **Copy this URL.**

> [!IMPORTANT]
> **Test Locally First:**
> Open your local `.env` file and replace:
> `REDIS_URL="redis://localhost:6379"`
> with your new Upstash URL:
> `REDIS_URL="rediss://default:xxxxx@xxxxx.upstash.io:6379"`
>
> Restart your local dev server (`npm run dev`) and worker (`npx tsx src/workers/run.ts`) to confirm everything still works!

---

## Step 2: Push to GitHub
Your code needs to be on GitHub for Vercel and Render to access it.

1.  **Check `.gitignore`:** I have already added `.env` to your `.gitignore` to prevent leaking secrets.
2.  **Create Repository:** Go to [GitHub.com/new](https://github.com/new) and create a **Private** repository (e.g., `line-oa-admin`).
3.  **Push Code:**
    Run these commands in your VS Code terminal:
    ```bash
    git init
    git add .
    git commit -m "Initial commit for production"
    git branch -M main
    git remote add origin https://github.com/YOUR_USERNAME/line-oa-admin.git
    git push -u origin main
    ```

---

## Step 3: Deploy Web App (Vercel)
This handles your UI and API Routes (`/api/webhook/line`, etc.).

1.  **Import Project:**
    *   Go to [Vercel Dashboard](https://vercel.com/dashboard).
    *   Click **"Add New..."** > **"Project"**.
    *   Select your `line-oa-admin` repository.
2.  **Configure Project:**
    *   **Framework Preset:** Next.js (should be auto-detected).
    *   **Root Directory:** `./` (default).
    *   **Build Command:** `next build` (default is fine, I added a `postinstall` script to handle Prisma).
    *   **Output Directory:** `.next` (default).
3.  **Environment Variables:**
    Expand the **"Environment Variables"** section and add these from your local `.env`:
    *   `DATABASE_URL` (Your Supabase URL)
    *   `AUTH_SECRET` (Your NextAuth secret)
    *   `LINE_CHANNEL_ACCESS_TOKEN`
    *   `LINE_CHANNEL_SECRET`
    *   `REDIS_URL` (The **Upstash** URL you created in Step 1)
    *   `NEXTAUTH_URL` (Set this to your Vercel domain later, or use `https://your-project.vercel.app` if you can guess it, otherwise update it after deployment).
4.  **Deploy:** Click **"Deploy"**.

> [!NOTE]
> **NEXTAUTH_URL:** After valid deployment, Vercel gives you a domain like `line-oa-admin.vercel.app`. Go to **Settings > Environment Variables**, update `NEXTAUTH_URL` to that real domain, and initiate a **redeploy** (Deployment tab > ... > Redeploy).

---

## Step 4: Deploy Worker (Render)
Vercel is "Serverless" and kills processes quickly. Your BullMQ worker needs to run **forever**. We use Render for this.

1.  **Create Web Service:**
    *   Go to [Render Dashboard](https://dashboard.render.com/).
    *   Click **"New +"** > **"Web Service"**.
    *   Connect your GitHub repository.
2.  **Configuration:**
    *   **Name:** `line-oa-worker`
    *   **Region:** Same as Vercel/Redis if possible.
    *   **Branch:** `main`
    *   **Runtime:** `Node`
    *   **Build Command:** `npm install`
    *   **Start Command:** `npx tsx src/workers/run.ts`
    *   **Instance Type:** **Free** (select 'Free' instance type).
3.  **Environment Variables:**
    Scroll down to **"Advanced"** or **"Environment"** and add:
    *   `DATABASE_URL`
    *   `REDIS_URL`
    *   `LINE_CHANNEL_ACCESS_TOKEN`
    *   `LINE_CHANNEL_SECRET`
    *   `PORT`: `3000` (Render needs this to pass the health check server I added).
4.  **Deploy:** Click **"Create Web Service"**.

> [!TIP]
> **Why Web Service?** Render's "Background Worker" type is **paid**. The "Web Service" type is **free**.
> I added a tiny HTTP server to your worker script so Render thinks it's a web service and keeps it alive!

---

## Step 5: Final Wiring

### 1. Update LINE Developers Console
*   Go to [LINE Developers Console](https://developers.line.biz/).
*   Select your channel.
*   Find **Messaging API** > **Webhook settings**.
*   Update **Webhook URL** to your Vercel domain:
    `https://YOUR-APP.vercel.app/api/webhook/line`
*   Click **"Verify"** (it might fail if you haven't deployed properly yet, retry after Vercel is green).
*   Enable **"Use webhook"**.

### 2. Update NextAuth URL (If missed)
*   Ensure `NEXTAUTH_URL` in Vercel Settings matches your final `https://YOUR-APP.vercel.app`.

### 3. Test!
*   Go to your Admin Panel URL.
*   Login.
*   Try sending a broadcast.
*   Check Render logs to see: `🚀 Starting Broadcast Worker...` and `[Job ...] Starting broadcast...`.

---

## ⚠️ Common Pitfalls
*   **Postgres Connection Pool:** If you see "Too many connections" errors, use the **Transaction Pooler** URL (port 6543) from Supabase instead of the direct Session connection (port 5432) for `DATABASE_URL`.
*   **Redis Latency:** If Upstash is in US and Vercel in Japan, it will be slow. Try to match regions.
*   **Cold Starts:** Vercel puts the app to sleep. The first request might be slow. This is normal on free tier.
*   **Worker Sleep:** Render Free tier spins down if inactive for 15 mins. BUT, since it's a queue worker, it might stay active if it's processing. **However**, for a truly robust 24/7 worker on free tier, you might need to use a pinging service (like UptimeRobot) to ping your Render URL (`https://your-worker.onrender.com`) every 10 minutes to verify it stays awake.

You are ready to launch! 🚀

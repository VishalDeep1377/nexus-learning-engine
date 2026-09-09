# Netlify Deployment Guide: Code-To-Career

Deploying a complex Next.js 16 application with NextAuth, MongoDB, and external APIs (Google, GitHub, Gemini) requires carefully aligning your Environment Variables and OAuth provider security settings. 

If any of these links are misconfigured, your authentication or database connection will crash in production.

---

## 1️⃣ Phase 1: Preparing Netlify

When you connect your GitHub repository to Netlify, it will automatically detect Next.js and apply the required plugin (`@netlify/plugin-nextjs`).

### Build Settings
When Netlify asks for your build settings, use the defaults the framework detection gives you:
- **Build Command:** `npm run build`
- **Publish Directory:** `.next`

### Setting Environment Variables in Netlify
Go to **Site configuration > Environment variables** in your Netlify dashboard and paste all your `.env.local` keys.

> [!CAUTION]
> **CRITICAL FIXES FOR PRODUCTION:**  
> 1. Change `NEXTAUTH_URL` from `http://localhost:3000` to exactly `https://code-to-carrer.netlify.app`.  
> 2. Change `NEXT_PUBLIC_API_URL` from `http://localhost:3000/api` to exactly `https://code-to-carrer.netlify.app/api`.  
> 3. Create a brand new random string for `NEXTAUTH_SECRET` and `JWT_SECRET` for production security.

---

## 2️⃣ Phase 2: Google Cloud Console (OAuth)

Your local Google Login works because Google is told `localhost` is safe. When you launch on Netlify, Google will block the login completely with a `redirect_uri_mismatch` error unless you do this:

1. Go to your [Google Cloud Console](https://console.cloud.google.com/).
2. Navigate to **APIs & Services > Credentials**.
3. Click on your `Code-To-Career` OAuth client.
4. Under **Authorized JavaScript origins**, click "ADD URI" and paste your exact Netlify domain:
   - `https://code-to-carrer.netlify.app`
5. Under **Authorized redirect URIs**, click "ADD URI" and paste your exact Netlify callback path:
   - `https://code-to-carrer.netlify.app/api/auth/callback/google`
6. Click **Save**.

---

## 3️⃣ Phase 3: GitHub Developer Settings (OAuth)

Similar to Google, GitHub will block production logins if not updated.

1. Go to [GitHub Developer Settings](https://github.com/settings/developers).
2. Under "OAuth Apps", select your app.
3. Update the **Homepage URL** to your Netlify domain:
   - `https://code-to-carrer.netlify.app`
4. Update the **Authorization callback URL** to:
   - `https://code-to-carrer.netlify.app/api/auth/callback/github`
5. Click **Update application**.

---

## 4️⃣ Phase 4: MongoDB Atlas (Database Firewall)

By default, MongoDB only allows your local computer's IP address to read/write data. Because Netlify runs its API routes on Serverless Edge Functions, their IP addresses constantly change. **If you ignore this step, Netlify will throw 500 Server Errors because their IP is blocked by Mongo.**

1. Log into [MongoDB Atlas](https://cloud.mongodb.com/).
2. On the left sidebar sidebar under **Security**, click **Network Access**.
3. Click the **+ Add IP Address** button.
4. Click **Allow Access from Anywhere** (which inputs `0.0.0.0/0`).
5. Click **Confirm** and wait 3 minutes for it to deploy to the firewall.

---

## 5️⃣ Phase 5: Gemini AI & NewsAPI

Both Google's `GEMINI_API_KEY` and the `NEWS_URL` do not strictly enforce IP-blocking out-of-the-box (unless you specifically configured them to). 

Simply ensure those exact keys from your local `.env.local` are copied perfectly into your Netlify dashboard without any extra spaces or quotes!

# Deploying to Vercel

Vercel is the natural home for Next.js apps. Since you're now using MongoDB Atlas, deployment is very straightforward.

## 1. Push to GitHub
If you haven't already, push your code to a GitHub repository.

## 2. Importance of Environment Variables
On Vercel, you don't use a `.env` file. Instead, you add them in the Vercel Dashboard.

**Required Variables:**
- `MONGODB_URI`: (Your full connection string with the `/ultimate-goals` database name)
- `AUTH_SECRET`: (Your secret string)

## 3. Deployment Steps
1.  Go to [vercel.com](https://vercel.com) and click **"Add New"** > **"Project"**.
2.  Import your GitHub repository.
3.  In the **"Environment Variables"** section, add the two variables listed above.
4.  Click **"Deploy"**.

## 4. Whitelisting Vercel on MongoDB Atlas
> [!IMPORTANT]
> By default, MongoDB Atlas might block connections from Vercel's dynamic IP addresses.
> 
> 1. Go to **Network Access** in MongoDB Atlas.
> 2. Click **"Add IP Address"**.
> 3. Select **"Allow Access from Anywhere"** (0.0.0.0/0). 
>    *Note: This is standard for Vercel as its IPs change constantly.*

## 5. Done!
Vercel will build your app and give you a `.vercel.app` URL. You're live!

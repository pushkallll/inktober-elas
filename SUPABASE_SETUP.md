# INKTOBER 2026 × ELAS — SUPABASE + CLOUDINARY SETUP

This document covers the exact setup instructions to configure Supabase (Authentication + Database) and Cloudinary (Image Storage) for the application on their respective Free Plans.

## 1. Supabase Project Setup
1. Go to [Supabase](https://supabase.com/) and create a new project on the **Free Plan**.
2. Wait for the database to provision.
3. Go to **Project Settings -> API** to find your `Project URL`, `anon public key`, and `service_role secret`.
4. Copy these into your `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL="<Project URL>"
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="<publishable key>"
   SUPABASE_SECRET_KEY="<service_role secret>"
   ```

## 2. Google OAuth Configuration
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Navigate to **APIs & Services -> OAuth consent screen**.
4. Choose **External** (unless you have a Google Workspace for the campus domain and want it Internal).
5. Fill out the required App information.
6. Navigate to **Credentials** -> **Create Credentials** -> **OAuth client ID**.
7. Select **Web application**.
8. For **Authorized JavaScript origins**, add your development and production URLs:
   - `http://localhost:3000`
   - `https://your-production-site.com`
9. For **Authorized redirect URIs**, add the Supabase Auth callback URL. You can find this in Supabase under **Authentication -> Providers -> Google**. It will look like:
   - `https://<project-ref>.supabase.co/auth/v1/callback`
10. Copy the **Client ID** and **Client Secret**.

## 3. Supabase Google Auth Setup
1. In your Supabase dashboard, go to **Authentication -> Providers**.
2. Enable **Google**.
3. Paste the **Client ID** and **Client Secret** obtained from Google Cloud Console.
4. Keep "Skip nonce check" unchecked unless experiencing specific issues with iOS/Safari.
5. Save the configuration.

## 4. Redirect URLs
1. In Supabase, go to **Authentication -> URL Configuration**.
2. Ensure the **Site URL** is your main site (e.g., `http://localhost:3000` for dev, or your production URL).
3. Under **Redirect URLs**, add URLs for both local development and production so Auth can safely return users:
   - `http://localhost:3000/**`
   - `https://your-production-site.com/**`

## 5. Campus Domain Restriction
The application checks the configured environment variable to restrict logins.
Ensure your `.env.local` has:
```env
NEXT_PUBLIC_CAMPUS_EMAIL_DOMAIN="hyderabad.bits-pilani.ac.in"
```

## 6. Cloudinary Setup
1. Go to [Cloudinary](https://cloudinary.com/) and create an account (Free Plan).
2. On your Dashboard, find your **Cloud Name**, **API Key**, and **API Secret**.
3. Add these to your `.env.local`:
   ```env
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="<Cloud Name>"
   CLOUDINARY_API_KEY="<API Key>"
   CLOUDINARY_API_SECRET="<API Secret>"
   ```
4. **IMPORTANT**: Never expose `CLOUDINARY_API_SECRET` to the browser. The application will use server-side signed uploads.

## 7. Database Initialization (Migrations)
The application schema is defined in the `supabase/migrations/` directory.
To apply the database schema, either:
1. Use the Supabase CLI: `supabase db push`
2. OR, copy the contents of `supabase/migrations/0001_initial_schema.sql` and run it in the **SQL Editor** in the Supabase dashboard.

# How to Set Up Google Sign-In

To enable "Sign up with Google", you need to obtain a **Client ID** and **Client Secret** from Google and configure them in your Supabase project.

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown in the top bar and select **"New Project"**.
3. Give your project a name (e.g., "Entemba Auth") and click **Create**.
4. Once created, select the project.

## Step 2: Configure OAuth Consent Screen

1. In the left sidebar, go to **APIs & Services** > **OAuth consent screen**.
2. Select **External** (unless you are a Google Workspace user testing internally) and click **Create**.
3. Fill in the **App Information**:
   - **App name**: Entemba (or your app name)
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Click **Save and Continue**.
5. Skip "Scopes" for now (or add `.../auth/userinfo.email` and `.../auth/userinfo.profile` if not selected by default).
6. Click **Save and Continue**.
7. (Optional) Add Test Users if you are in "Testing" mode.

## Step 3: Create Credentials

1. In the left sidebar, go to **APIs & Services** > **Credentials**.
2. Click **+ CREATE CREDENTIALS** at the top and select **OAuth client ID**.
3. For **Application type**, select **Web application**.
4. Name it (e.g., "Supabase Auth").
5. **Authorized JavaScript origins**:
   - Add your local development URL: `http://localhost:3000` (or your current port).
   - Add your production URL if you have one (e.g., `https://your-domain.com`).
6. **Authorized redirect URIs**:
   - This is CRITICAL. You need your Supabase Project URL.
   - Go to your Supabase Dashboard > Project Settings > API.
   - Find your **Project URL** (e.g., `https://xxyyzz.supabase.co`).
   - The redirect URI format is: `https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback`
   - Paste that URL into the "Authorized redirect URIs" field in Google Console.
7. Click **Create**.

## Step 4: Get Client ID and Secret

1. After creating, a modal will appear with your **Consumer Key (Client ID)** and **Consumer Secret (Client Secret)**.
2. **Copy these values.**

## Step 5: Configure Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project.
3. Go to **Authentication** > **Providers**.
4. Find **Google** and click it to expand.
5. Paste your **Client ID** and **Client Secret**.
6. Toggle **Enable Google provider** to ON.
7. Click **Save**.

## Step 6: Test It

1. Restart your development server if needed.
2. Go to the Sign Up page.
3. Click "Sign up with Google".
4. You should be redirected to Google to log in, and then back to your app.

---

**Note**: If you are testing locally, make sure `http://localhost:3000` is also added to your Supabase Authentication > URL Configuration > **Site URL** or **Redirect URLs**.

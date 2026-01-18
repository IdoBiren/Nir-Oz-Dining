# Setup Google Login

To enable "Sign in with Google", you need to configure Supabase and Google Cloud.

### Step 1: Get Google Cloud Keys
1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a **New Project** (e.g., "Meal App").
3.  Go to **APIs & Services** -> **OAuth consent screen**.
    - Type: **External**.
    - Fill in "App Name" and emails.
    - Click Save/Next until finished.
4.  Go to **Credentials** -> **Create Credentials** -> **OAuth client ID**.
    - Application type: **Web application**.
    - Name: "Supabase Login".
    - **Authorized redirect URIs**: You need to get this from Supabase (see Step 2).
5.  Keep this tab open.

### Step 2: Configure Supabase
1.  Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2.  Go to **Authentication** -> **Providers**.
3.  Click **Google**.
4.  Switch **Enable Google provider** to ON.
5.  Copy the **Callback URL (for OAuth)** (it looks like `https://<your-ref>.supabase.co/auth/v1/callback`).
    - **Paste this URL** into the Google Cloud "Authorized redirect URIs" (from Step 1) and click **Create** in Google Cloud.
6.  Copy the **Client ID** and **Client Secret** from the Google Cloud popup.
7.  **Paste** them into the Supabase Google Provider settings.
8.  Click **Save** in Supabase.

### Step 3: Test
- Restart your app.
- Click "Sign in with Google".

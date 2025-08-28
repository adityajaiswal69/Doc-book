# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for your Doc-books application using Supabase Auth.

## Prerequisites

- A Google Cloud Project
- Supabase project with authentication enabled
- Your application running on a known domain (for production) or localhost (for development)

## Step 1: Create Google Cloud Project & OAuth Credentials

### 1.1 Create or Select a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID for reference

### 1.2 Enable Google+ API

1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Google+ API" or "People API"
3. Click on it and press **Enable**

### 1.3 Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** (for public apps) or **Internal** (for workspace apps)
3. Fill in the required information:
   - **App name**: Your app name (e.g., "Doc-books")
   - **User support email**: Your email
   - **App logo**: Optional but recommended
   - **App domain**: Your domain (e.g., `yourdomain.com`)
   - **Authorized domains**: Add your domain
   - **Developer contact email**: Your email
4. Click **Save and Continue**
5. On the **Scopes** page, add these scopes:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
   - `openid`
6. Click **Save and Continue**
7. Review and submit for verification if required

### 1.4 Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**
3. Choose **Web application**
4. Configure the credentials:
   - **Name**: A descriptive name (e.g., "Doc-books Web Client")
   - **Authorized JavaScript origins**:
     - Development: `http://localhost:3000`
     - Production: `https://yourdomain.com`
   - **Authorized redirect URIs**:
     - Development: `http://localhost:3000/auth/callback`
     - Production: `https://yourdomain.com/auth/callback`
5. Click **Create**
6. Copy the **Client ID** and **Client Secret**

## Step 2: Configure Supabase Authentication

### 2.1 Add Google OAuth Provider

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** > **Providers**
4. Find **Google** and click **Configure**
5. Enable Google authentication
6. Enter your Google OAuth credentials:
   - **Client ID**: From Step 1.4
   - **Client Secret**: From Step 1.4
7. Configure redirect URLs:
   - **Site URL**: `http://localhost:3000` (development) or `https://yourdomain.com` (production)
   - **Redirect URLs**: Add your callback URLs:
     - `http://localhost:3000/auth/callback`
     - `https://yourdomain.com/auth/callback`
8. Click **Save**

## Step 3: Configure Environment Variables

### 3.1 Update .env.local

Add the Google OAuth credentials to your `.env.local` file:

\`\`\`bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google OAuth Configuration (for Supabase Auth)
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# Liveblocks Configuration
LIVEBLOCKS_SECRET_KEY=your_liveblocks_secret_key
\`\`\`

### 3.2 Restart Development Server

After updating environment variables, restart your development server:

\`\`\`bash
npm run dev
\`\`\`

## Step 4: Test Google OAuth

1. Go to your application
2. Click on the **"Sign In"** or **"Sign Up"** page
3. Click the **"Google"** button
4. You should be redirected to Google's OAuth consent screen
5. Grant permissions to your application
6. You should be redirected back to your application and signed in
7. Check that the user profile is created in the `profiles` table

## Step 5: Production Deployment

### 5.1 Update Redirect URLs

Before deploying to production:

1. **Google Cloud Console**:
   - Add your production domain to **Authorized JavaScript origins**
   - Add your production callback URL to **Authorized redirect URIs**

2. **Supabase Dashboard**:
   - Update **Site URL** to your production domain
   - Add production callback URL to **Redirect URLs**

### 5.2 Environment Variables

Ensure your production environment has the correct environment variables set.

## Troubleshooting

### Common Issues

1. **"redirect_uri_mismatch" Error**
   - Check that your redirect URIs match exactly in both Google Cloud Console and Supabase
   - Ensure no trailing slashes or extra characters

2. **"OAuth configuration error"**
   - Verify your Client ID and Client Secret are correct
   - Check that Google+ API is enabled in Google Cloud Console

3. **"Access blocked" Error**
   - Make sure your OAuth consent screen is configured properly
   - For development, use test users if your app is not verified

4. **Profile not created**
   - Check that the profiles table exists (run the profiles migration)
   - Verify the auth callback route is handling profile creation

### Testing Checklist

- [ ] Google OAuth credentials are correctly configured in Supabase
- [ ] Environment variables are set correctly
- [ ] Redirect URLs match in all configurations
- [ ] Profiles table exists in database
- [ ] Auth callback route is working
- [ ] User profile is created after OAuth signin

## Security Best Practices

1. **Environment Variables**: Never commit real credentials to version control
2. **Redirect URLs**: Only add trusted domains to authorized redirect URIs
3. **Scopes**: Only request the minimum required scopes
4. **HTTPS**: Always use HTTPS in production
5. **Domain Verification**: Verify your domain with Google for production apps

## Additional Features

### Custom OAuth Scopes

If you need additional Google services, add scopes in Supabase:

\`\`\`javascript
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    scopes: 'email profile https://www.googleapis.com/auth/drive.readonly',
    redirectTo: \`\${window.location.origin}/auth/callback\`
  }
});
\`\`\`

### Profile Data Access

After OAuth signin, you can access Google profile data:

\`\`\`javascript
const { data: { user } } = await supabase.auth.getUser();
console.log(user.user_metadata); // Contains Google profile data
\`\`\`

## Support

If you encounter issues:

1. Check the [Supabase Auth documentation](https://supabase.com/docs/guides/auth/social-login/auth-google)
2. Review [Google OAuth 2.0 documentation](https://developers.google.com/identity/protocols/oauth2)
3. Check browser developer tools for error messages
4. Verify all configuration steps are completed correctly

The Google OAuth integration should now be working correctly with your Doc-books application!

# OAuth Setup Guide for Candidate Authentication

This guide explains how to set up Google and LinkedIn OAuth providers in Supabase to enable social login for candidates.

## Prerequisites

- Supabase project with authentication enabled
- Google Cloud Console account (for Google OAuth)
- LinkedIn Developer account (for LinkedIn OAuth)

## 1. Google OAuth Setup

### Step 1: Create Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     ```
     https://[YOUR_SUPABASE_PROJECT_REF].supabase.co/auth/v1/callback
     http://localhost:3000/candidate/applications (for development)
     ```
   - Copy the Client ID and Client Secret

### Step 2: Configure Google OAuth in Supabase

1. Go to your Supabase project dashboard
2. Navigate to "Authentication" > "Providers"
3. Find "Google" and click "Edit"
4. Enable Google provider
5. Enter your Google OAuth credentials:
   - **Client ID**: Your Google OAuth Client ID
   - **Client Secret**: Your Google OAuth Client Secret
6. Save the configuration

## 2. LinkedIn OAuth Setup

### Step 1: Create LinkedIn OAuth Application

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Click "Create App"
3. Fill in the app details:
   - App name: Your app name
   - LinkedIn Page: Your company page
   - App Logo: Upload your app logo
4. Once created, go to "Auth" tab
5. Add redirect URLs:
   ```
   https://[YOUR_SUPABASE_PROJECT_REF].supabase.co/auth/v1/callback
   http://localhost:3000/candidate/applications (for development)
   ```
6. Copy the Client ID and Client Secret

### Step 2: Configure LinkedIn OAuth in Supabase

1. Go to your Supabase project dashboard
2. Navigate to "Authentication" > "Providers"
3. Find "LinkedIn" and click "Edit"
4. Enable LinkedIn provider
5. Enter your LinkedIn OAuth credentials:
   - **Client ID**: Your LinkedIn OAuth Client ID
   - **Client Secret**: Your LinkedIn OAuth Client Secret
6. Save the configuration

## 3. Database Schema Updates

Make sure your `candidate_profiles` table has the necessary columns for OAuth data:

```sql
-- Add these columns if they don't exist
ALTER TABLE candidate_profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'email';

-- Update the table structure to handle OAuth users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO candidate_profiles (
    id,
    full_name,
    email,
    phone,
    avatar_url,
    provider,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 
             NEW.raw_user_meta_data->>'name', 
             split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_app_meta_data->>'provider', 'oauth'),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

## 4. Environment Variables

Add these environment variables to your `.env` file:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://[YOUR_SUPABASE_PROJECT_REF].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]

# OAuth Redirect URLs
VITE_OAUTH_REDIRECT_URL=http://localhost:3000/candidate/applications
```

## 5. Testing OAuth Integration

### Test Google OAuth:
1. Start your development server
2. Navigate to `/candidate`
3. Click "Continue with Google"
4. Complete the Google OAuth flow
5. Verify you're redirected to `/candidate/applications`

### Test LinkedIn OAuth:
1. Start your development server
2. Navigate to `/candidate`
3. Click "Continue with LinkedIn"
4. Complete the LinkedIn OAuth flow
5. Verify you're redirected to `/candidate/applications`

## 6. Production Deployment

### Update Redirect URLs for Production:

1. **Google Cloud Console:**
   - Add your production domain to authorized redirect URIs:
   ```
   https://yourdomain.com/candidate/applications
   ```

2. **LinkedIn Developers:**
   - Add your production domain to redirect URLs:
   ```
   https://yourdomain.com/candidate/applications
   ```

3. **Supabase:**
   - Update the redirect URL in your OAuth configuration to point to your production domain

## 7. Troubleshooting

### Common Issues:

1. **"Invalid redirect URI" error:**
   - Ensure the redirect URI in your OAuth provider matches exactly with Supabase
   - Check for trailing slashes and protocol (http vs https)

2. **"Provider not enabled" error:**
   - Verify the OAuth provider is enabled in Supabase dashboard
   - Check that Client ID and Client Secret are correct

3. **Profile not created after OAuth:**
   - Check the database trigger is properly set up
   - Verify the `candidate_profiles` table exists and has the correct schema

4. **Session not persisting:**
   - Ensure Supabase client is configured with proper storage settings
   - Check that cookies/localStorage is enabled in the browser

### Debug Steps:

1. Check browser console for errors
2. Verify Supabase logs in the dashboard
3. Test OAuth flow in incognito mode
4. Check network tab for failed requests

## 8. Security Considerations

1. **HTTPS Required:** Always use HTTPS in production
2. **Redirect URI Validation:** Strictly validate redirect URIs
3. **Token Storage:** Use secure token storage methods
4. **Session Management:** Implement proper session expiry
5. **Rate Limiting:** Consider implementing rate limiting for OAuth endpoints

## 9. Additional Features

### Profile Completion:
After OAuth login, you may want to prompt users to complete their profile:

```typescript
// Check if profile is complete
const isProfileComplete = (profile) => {
  return profile.full_name && profile.email && profile.phone;
};

// Redirect to profile completion if needed
if (!isProfileComplete(userProfile)) {
  navigate('/candidate/profile/complete');
}
```

### Account Linking:
Allow users to link multiple OAuth providers to the same account:

```typescript
// Link additional provider
const linkProvider = async (provider) => {
  const { error } = await supabase.auth.link({
    provider,
    options: {
      redirectTo: `${window.location.origin}/candidate/profile`
    }
  });
};
```

## Support

If you encounter issues with OAuth setup:

1. Check the [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
2. Review [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
3. Review [LinkedIn OAuth Documentation](https://developer.linkedin.com/docs/oauth2)
4. Check Supabase community forums for similar issues 
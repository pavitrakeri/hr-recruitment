# Session Expiry Implementation

## Overview

The application now implements a 1-hour session expiry system that automatically logs out users after 60 minutes of inactivity. This ensures security and requires fresh authentication credentials.

## How It Works

### 1. Session Tracking
- When a user signs in, a timestamp is stored in `localStorage` as `login_time`
- The session expiry is checked every minute in the background
- After 1 hour (60 minutes), the user is automatically signed out

### 2. Session Expiry Check
- The `useAuth` hook continuously monitors session validity
- Session expiry is checked on:
  - Initial page load
  - Every minute while the user is active
  - When the auth state changes

### 3. Automatic Sign Out
- When session expires, all authentication data is cleared
- User is redirected to the login page
- All stored tokens and session data are removed

## Components Updated

### 1. `useAuth` Hook (`src/hooks/useAuth.tsx`)
- Added continuous session monitoring
- Implements 1-hour expiry logic
- Automatically signs out expired sessions

### 2. `AuthForm` Component (`src/components/AuthForm.tsx`)
- Clears existing session data before sign in/up
- Ensures fresh authentication on each login attempt

### 3. `CandidateAuthForm` Component (`src/components/CandidateAuthForm.tsx`)
- Same session clearing logic as AuthForm
- Ensures consistent behavior across both portals

### 4. Supabase Client (`src/integrations/supabase/client.ts`)
- Configured with proper session persistence settings
- Uses custom storage key for better control

### 5. Session Expiry Notification (`src/components/SessionExpiryNotification.tsx`)
- Shows warning when session is about to expire (10 minutes remaining)
- Displays countdown timer
- Provides manual sign out option

## Utility Functions (`src/lib/utils.ts`)

### `clearAllAuthData()`
- Removes all authentication-related data from localStorage and sessionStorage
- Clears Supabase tokens and custom session data

### `isSessionExpired()`
- Returns true if the current session has expired
- Checks against the 1-hour limit

### `getSessionTimeRemaining()`
- Returns the number of milliseconds remaining in the session
- Used for countdown display

### Development Utilities (for testing)
- `simulateSessionExpiry()` - Forces session to expire immediately
- `setSessionToExpireIn(minutes)` - Sets session to expire in specified minutes

## Testing the Session Expiry

### Method 1: Wait for Natural Expiry
1. Sign in to the application
2. Wait for 1 hour
3. Session should automatically expire and redirect to login

### Method 2: Use Development Utilities
1. Open browser console
2. Run: `window.simulateSessionExpiry()` (after importing the function)
3. Page will reload and show login form

### Method 3: Set Custom Expiry Time
1. Open browser console
2. Run: `window.setSessionToExpireIn(5)` (expires in 5 minutes)
3. Wait for expiry or refresh page

## User Experience

### Session Expiry Warning
- Users see a notification 10 minutes before session expires
- Countdown timer shows remaining time
- Option to manually sign out

### Automatic Redirect
- When session expires, user is automatically signed out
- Redirected to appropriate login page (HR or Candidate portal)
- All form data and session state is cleared

### Fresh Login Required
- Each login attempt clears any existing session data
- Ensures no cached credentials are used
- Provides consistent authentication flow

## Security Benefits

1. **Automatic Logout**: Prevents unauthorized access from shared computers
2. **Session Isolation**: Each login session is independent
3. **Data Protection**: Clears sensitive data when session expires
4. **User Awareness**: Notifies users before session expiry

## Configuration

The session expiry time can be modified by changing the `oneHour` constant in:
- `src/hooks/useAuth.tsx` (line with `const oneHour = 60 * 60 * 1000`)
- `src/lib/utils.ts` (in `isSessionExpired` and `getSessionTimeRemaining` functions)

Current setting: 1 hour (60 minutes) 
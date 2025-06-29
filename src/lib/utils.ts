import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "@/integrations/supabase/client"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility function to get public URL for Supabase storage files
export function getSupabaseFileUrl(filePath: string | null | undefined, bucket: string = 'applications') {
  if (!filePath) return null;
  
  try {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    return data.publicUrl;
  } catch (error) {
    console.error('Error generating public URL:', error);
    return null;
  }
}

// Utility function to check if a file exists in storage
export async function checkFileExists(filePath: string | null | undefined, bucket: string = 'applications') {
  if (!filePath) return false;
  
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list('', {
        search: filePath
      });
    
    if (error) {
      console.error('Error checking file existence:', error);
      return false;
    }
    
    return data.some(file => file.name === filePath.split('/').pop());
  } catch (error) {
    console.error('Error checking file existence:', error);
    return false;
  }
}

// Session management utilities
export const clearAllAuthData = () => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('login_time');
  localStorage.removeItem('aimploy-auth-token');
  sessionStorage.removeItem('aimploy-auth-token');
  
  // Clear any other auth-related storage
  Object.keys(localStorage).forEach(key => {
    if (key.includes('supabase') || key.includes('auth')) {
      localStorage.removeItem(key);
    }
  });
  Object.keys(sessionStorage).forEach(key => {
    if (key.includes('supabase') || key.includes('auth')) {
      sessionStorage.removeItem(key);
    }
  });
};

export const isSessionExpired = (): boolean => {
  if (typeof window === 'undefined') return true;
  
  const loginTime = localStorage.getItem('login_time');
  if (!loginTime) return true;
  
  const now = Date.now();
  const elapsed = now - parseInt(loginTime, 10);
  const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
  
  return elapsed > oneHour;
};

export const getSessionTimeRemaining = (): number => {
  if (typeof window === 'undefined') return 0;
  
  const loginTime = localStorage.getItem('login_time');
  if (!loginTime) return 0;
  
  const now = Date.now();
  const elapsed = now - parseInt(loginTime, 10);
  const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
  
  return Math.max(0, oneHour - elapsed);
};

// Development utility to simulate session expiry (for testing)
export const simulateSessionExpiry = () => {
  if (typeof window === 'undefined') return;
  
  // Set login time to 2 hours ago to simulate expired session
  const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
  localStorage.setItem('login_time', twoHoursAgo.toString());
  
  // Force page reload to trigger session check
  window.location.reload();
};

// Development utility to set session to expire in X minutes (for testing)
export const setSessionToExpireIn = (minutes: number) => {
  if (typeof window === 'undefined') return;
  
  const timeToExpire = Date.now() - ((60 - minutes) * 60 * 1000);
  localStorage.setItem('login_time', timeToExpire.toString());
};

// Session recovery utility
export const recoverSession = async () => {
  if (typeof window === 'undefined') return false;
  
  try {
    // Clear potentially corrupted session data
    const corruptedKeys = Object.keys(localStorage).filter(key => 
      key.includes('supabase') && key.includes('session')
    );
    
    corruptedKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn('Error removing corrupted session key:', key, error);
      }
    });
    
    // Clear session storage
    sessionStorage.clear();
    
    // Remove login time to force fresh login
    localStorage.removeItem('login_time');
    
    return true;
  } catch (error) {
    console.error('Error during session recovery:', error);
    return false;
  }
};

// Check if session is corrupted
export const isSessionCorrupted = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    const sessionData = localStorage.getItem('aimploy-auth-token');
    if (!sessionData) return false;
    
    const parsed = JSON.parse(sessionData);
    return !parsed || !parsed.access_token || !parsed.refresh_token;
  } catch (error) {
    console.warn('Session data is corrupted:', error);
    return true;
  }
};

// Enhanced clear all auth data with session recovery
export const clearAllAuthDataWithRecovery = async () => {
  clearAllAuthData();
  await recoverSession();
};

import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { clearAllAuthData, isSessionExpired, isSessionCorrupted, clearAllAuthDataWithRecovery } from '@/lib/utils';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to check session expiry
  const checkSessionExpiry = async (session: Session | null) => {
    if (!session) return false;
    
    if (isSessionExpired()) {
      // Session expired, sign out
      await supabase.auth.signOut();
      clearAllAuthData();
      setSession(null);
      setUser(null);
      setLoading(false);
      return true; // Session was expired
    }
    
    return false; // Session is still valid
  };

  // Force sign out function with error handling
  const forceSignOut = async () => {
    try {
    await supabase.auth.signOut();
    } catch (error) {
      console.warn('Error during sign out:', error);
    } finally {
      await clearAllAuthDataWithRecovery();
    setSession(null);
    setUser(null);
    setLoading(false);
    }
  };

  // Validate session function
  const validateSession = async (session: Session | null) => {
    if (!session) return false;
    
    // Check if session data is corrupted
    if (isSessionCorrupted()) {
      console.warn('Session data is corrupted, clearing and returning false');
      await clearAllAuthDataWithRecovery();
      return false;
    }
    
    try {
      // Try to refresh the session to validate it
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.warn('Session validation failed:', error);
        // If it's a 404 or similar error, clear the session
        if (error.message?.includes('404') || error.message?.includes('NOT_FOUND')) {
          await clearAllAuthDataWithRecovery();
        }
        return false;
      }
      
      return !!data.session;
    } catch (error) {
      console.warn('Session validation error:', error);
      await clearAllAuthDataWithRecovery();
      return false;
    }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    // Set up auth state listener with better error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        
        if (event === 'SIGNED_IN') {
          localStorage.setItem('login_time', Date.now().toString());
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          
          // Start checking session expiry every minute
          intervalId = setInterval(async () => {
            const expired = await checkSessionExpiry(session);
            if (expired) {
              clearInterval(intervalId);
            }
          }, 60000); // Check every minute
        }
        
        if (event === 'SIGNED_OUT') {
          clearAllAuthData();
          setSession(null);
          setUser(null);
          setLoading(false);
          if (intervalId) {
            clearInterval(intervalId);
          }
        }
        
        if (event === 'TOKEN_REFRESHED') {
          // Update session but don't reset login time
          setSession(session);
          setUser(session?.user ?? null);
        }

        if (event === 'USER_UPDATED') {
          setUser(session?.user ?? null);
        }

        // Handle token refresh errors
        if (event === 'TOKEN_REFRESH_FAILED') {
          console.warn('Token refresh failed, signing out');
          await forceSignOut();
        }
      }
    );

    // Get initial session and check expiry with better error handling
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn('Error getting session:', error);
          await forceSignOut();
          return;
        }
        
        if (session) {
          // Validate the session first
          const isValid = await validateSession(session);
          
          if (!isValid) {
            console.warn('Invalid session detected, signing out');
            await forceSignOut();
            return;
          }
          
          const expired = await checkSessionExpiry(session);
          if (!expired) {
            setSession(session);
            setUser(session.user);
            
            // Start checking session expiry every minute
            intervalId = setInterval(async () => {
              const expired = await checkSessionExpiry(session);
              if (expired) {
                clearInterval(intervalId);
              }
            }, 60000); // Check every minute
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        await forceSignOut();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      subscription.unsubscribe();
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  const signOut = async () => {
    try {
    await supabase.auth.signOut();
    } catch (error) {
      console.warn('Error during sign out:', error);
      // Even if sign out fails, clear local data
      clearAllAuthData();
      setSession(null);
      setUser(null);
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

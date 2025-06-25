import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { clearAllAuthData, isSessionExpired } from '@/lib/utils';

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

  // Force sign out function
  const forceSignOut = async () => {
    await supabase.auth.signOut();
    clearAllAuthData();
    setSession(null);
    setUser(null);
    setLoading(false);
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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
      }
    );

    // Get initial session and check expiry
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
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
    await supabase.auth.signOut();
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

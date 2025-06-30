import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useOAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Handle OAuth callback
    const handleOAuthCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session?.user && !error) {
        try {
          // Check if user already has a candidate profile
          const { data: existingProfile } = await supabase
            .from('candidate_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (!existingProfile) {
            // Create candidate profile from OAuth data
            const { error: profileError } = await supabase
              .from('candidate_profiles')
              .insert({
                id: session.user.id,
                full_name: session.user.user_metadata?.full_name || 
                          session.user.user_metadata?.name || 
                          session.user.email?.split('@')[0] || 'User',
                email: session.user.email,
                phone: session.user.user_metadata?.phone || null,
                avatar_url: session.user.user_metadata?.avatar_url || null,
                provider: session.user.app_metadata?.provider || 'oauth',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });

            if (profileError) {
              console.error('Error creating candidate profile:', profileError);
              toast({
                title: "Profile creation failed",
                description: "There was an issue creating your profile. Please try again.",
                variant: "destructive",
              });
            } else {
              toast({
                title: "Welcome!",
                description: "Your account has been created successfully.",
              });
            }
          }

          // Redirect to candidate applications
          navigate('/candidate/applications');
        } catch (error) {
          console.error('Error handling OAuth callback:', error);
          toast({
            title: "Authentication error",
            description: "There was an issue with your authentication. Please try again.",
            variant: "destructive",
          });
        }
      }
    };

    // Check if we're returning from OAuth
    const urlParams = new URLSearchParams(window.location.search);
    const hasAuthParams = urlParams.has('access_token') || urlParams.has('error');
    
    if (hasAuthParams) {
      handleOAuthCallback();
    }
  }, [navigate, toast]);

  const signInWithOAuth = async (provider: 'google' | 'linkedin') => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/candidate/applications`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  return {
    signInWithOAuth,
  };
}; 
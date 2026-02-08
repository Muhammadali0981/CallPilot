import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const isGoogleUser = (u: User | null) =>
    u?.app_metadata?.provider === 'google' || u?.app_metadata?.providers?.includes('google');

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[useAuth] onAuthStateChange:', event, 'provider_token present:', !!session?.provider_token, 'provider_refresh_token present:', !!session?.provider_refresh_token);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Capture tokens on sign-in (only available during initial OAuth callback)
        if (session?.provider_token) {
          console.log('[useAuth] Storing provider_token in localStorage');
          localStorage.setItem('google_access_token', session.provider_token);
        }
        if (session?.provider_refresh_token) {
          console.log('[useAuth] Storing provider_refresh_token in localStorage');
          localStorage.setItem('google_refresh_token', session.provider_refresh_token);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[useAuth] getSession: provider_token present:', !!session?.provider_token, 'provider_refresh_token present:', !!session?.provider_refresh_token);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_refresh_token');
    await supabase.auth.signOut();
  };

  return { user, session, loading, signOut, isGoogleUser: isGoogleUser(user) };
}

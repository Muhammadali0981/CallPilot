import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [providerToken, setProviderToken] = useState<string | null>(null);
  const [providerRefreshToken, setProviderRefreshToken] = useState<string | null>(null);

  const isGoogleUser = (u: User | null) =>
    u?.app_metadata?.provider === 'google' || u?.app_metadata?.providers?.includes('google');

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        // Capture tokens on sign-in (only available during initial OAuth callback)
        if (session?.provider_token) {
          setProviderToken(session.provider_token);
          localStorage.setItem('google_access_token', session.provider_token);
        }
        if (session?.provider_refresh_token) {
          setProviderRefreshToken(session.provider_refresh_token);
          localStorage.setItem('google_refresh_token', session.provider_refresh_token);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      // Restore persisted tokens
      const storedToken = localStorage.getItem('google_access_token');
      if (storedToken) setProviderToken(storedToken);
      const storedRefresh = localStorage.getItem('google_refresh_token');
      if (storedRefresh) setProviderRefreshToken(storedRefresh);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_refresh_token');
    setProviderToken(null);
    setProviderRefreshToken(null);
    await supabase.auth.signOut();
  };

  return { user, session, loading, signOut, providerToken, providerRefreshToken, isGoogleUser: isGoogleUser(user) };
}

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [providerToken, setProviderToken] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        // Capture provider_token on sign-in (only available during initial OAuth callback)
        if (session?.provider_token) {
          setProviderToken(session.provider_token);
          // Persist it for later use
          localStorage.setItem('google_access_token', session.provider_token);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      // Restore persisted token
      const storedToken = localStorage.getItem('google_access_token');
      if (storedToken) {
        setProviderToken(storedToken);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    localStorage.removeItem('google_access_token');
    setProviderToken(null);
    await supabase.auth.signOut();
  };

  return { user, session, loading, signOut, providerToken };
}

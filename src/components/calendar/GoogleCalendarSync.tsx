import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { CalendarSync, Loader2, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  allDay: boolean;
}

interface GoogleCalendarSyncProps {
  isGoogleUser: boolean;
  onEventsLoaded: (events: CalendarEvent[]) => void;
}

export function GoogleCalendarSync({ isGoogleUser, onEventsLoaded }: GoogleCalendarSyncProps) {
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [synced, setSynced] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null); // null = checking
  const [eventCount, setEventCount] = useState(0);

  // Check if user has connected their calendar (has tokens stored)
  const checkConnection = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('oauth_tokens')
        .select('id')
        .eq('provider', 'google')
        .maybeSingle();

      setConnected(!error && !!data);
    } catch {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Handle OAuth callback — check for code in URL on mount
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (code && state?.startsWith('calendar_')) {
      // Remove params from URL
      url.searchParams.delete('code');
      url.searchParams.delete('state');
      url.searchParams.delete('scope');
      window.history.replaceState({}, '', url.toString());

      // Exchange code for tokens
      handleCodeExchange(code);
    }
  }, []);

  const handleCodeExchange = async (code: string) => {
    setConnecting(true);
    try {
      const redirectUri = window.location.origin;
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: { action: 'exchange_code', code, redirectUri },
      });

      if (error || data?.error) {
        console.error('Token exchange failed:', error || data);
        toast.error(data?.error || 'Failed to connect Google Calendar');
        return;
      }

      setConnected(true);
      toast.success('Google Calendar connected! Click "Sync Calendar" to import events.');
    } catch (err) {
      console.error('Calendar auth failed:', err);
      toast.error('Failed to connect Google Calendar');
    } finally {
      setConnecting(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const redirectUri = window.location.origin;
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: { action: 'get_auth_url', redirectUri },
      });

      if (error || data?.error || !data?.authUrl) {
        console.error('Failed to get auth URL:', error || data);
        toast.error('Failed to start Google Calendar authorization');
        setConnecting(false);
        return;
      }

      // Redirect to Google consent screen
      window.location.href = data.authUrl;
    } catch (err) {
      console.error('Connect failed:', err);
      toast.error('Failed to connect to Google Calendar');
      setConnecting(false);
    }
  };

  const handleSync = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-events', {
        body: {},
      });

      if (error || data?.error) {
        console.error('Calendar sync error:', error || data);

        if (data?.error === 'no_tokens' || data?.error === 'token_expired') {
          setConnected(false);
          toast.error('Calendar access expired. Please reconnect your Google Calendar.');
        } else {
          toast.error(data?.message || 'Failed to fetch calendar events.');
        }
        return;
      }

      const events: CalendarEvent[] = data.events || [];
      setEventCount(events.length);
      setSynced(true);
      onEventsLoaded(events);

      if (events.length > 0) {
        toast.success(`Synced ${events.length} calendar events! Busy times will be excluded.`);
      } else {
        toast.info('No upcoming events found in your calendar.');
      }
    } catch (err) {
      console.error('Calendar sync failed:', err);
      toast.error('Calendar sync failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isGoogleUser) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-secondary/30 p-3 text-sm text-muted-foreground">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>Sign in with Google to import your calendar availability.</span>
      </div>
    );
  }

  // Still checking connection status
  if (connected === null) {
    return (
      <Button variant="outline" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Checking calendar...
      </Button>
    );
  }

  // Not connected — show connect button
  if (!connected) {
    return (
      <div className="space-y-2">
        <Button
          className="gradient-primary border-0"
          onClick={handleConnect}
          disabled={connecting}
        >
          {connecting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ExternalLink className="mr-2 h-4 w-4" />
          )}
          {connecting ? 'Connecting...' : 'Connect Google Calendar'}
        </Button>
        <p className="text-xs text-muted-foreground">
          Opens Google to grant calendar read access. Your data stays private.
        </p>
      </div>
    );
  }

  // Connected — show sync button
  return (
    <div className="space-y-2">
      <Button
        variant={synced ? 'outline' : 'default'}
        className={synced ? '' : 'gradient-primary border-0'}
        onClick={handleSync}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : synced ? (
          <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
        ) : (
          <CalendarSync className="mr-2 h-4 w-4" />
        )}
        {synced ? `Synced (${eventCount} events)` : 'Sync Calendar'}
      </Button>
      {synced && (
        <p className="text-xs text-muted-foreground">
          Your busy times will be excluded from availability sent to providers.
        </p>
      )}
    </div>
  );
}

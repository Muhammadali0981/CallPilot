import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { CalendarSync, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
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

/**
 * Try multiple approaches to get calendar events:
 * 1. Use stored access token directly with Google API
 * 2. Try refreshing the token via edge function
 * 3. Call the edge function without a token (uses gateway)
 */
async function fetchCalendarEvents(): Promise<{ events: CalendarEvent[]; error?: string }> {
  const storedToken = localStorage.getItem('google_access_token');

  // Attempt 1: Use stored access token if available
  if (storedToken) {
    console.log('[calendar-sync] Trying stored access token...');
    const { data, error } = await supabase.functions.invoke('google-calendar-events', {
      body: { googleAccessToken: storedToken },
    });

    if (!error && !data?.error && data?.events) {
      console.log('[calendar-sync] Stored token worked!');
      return { events: data.events };
    }

    console.log('[calendar-sync] Stored token failed, trying refresh...');

    // Attempt 2: Try refreshing the token
    const storedRefresh = localStorage.getItem('google_refresh_token');
    if (storedRefresh) {
      const refreshResult = await supabase.functions.invoke('refresh-google-token', {
        body: { refreshToken: storedRefresh },
      });

      if (!refreshResult.error && refreshResult.data?.access_token) {
        const newToken = refreshResult.data.access_token;
        localStorage.setItem('google_access_token', newToken);
        console.log('[calendar-sync] Token refreshed, retrying...');

        const retryResult = await supabase.functions.invoke('google-calendar-events', {
          body: { googleAccessToken: newToken },
        });

        if (!retryResult.error && !retryResult.data?.error && retryResult.data?.events) {
          return { events: retryResult.data.events };
        }
      }
    }
  }

  // Attempt 3: Call without token — edge function will use gateway
  console.log('[calendar-sync] Trying gateway approach (no token)...');
  const { data, error } = await supabase.functions.invoke('google-calendar-events', {
    body: {},
  });

  if (error || data?.error) {
    console.error('[calendar-sync] All approaches failed:', error || data?.error);
    return { events: [], error: data?.detail || data?.error || error?.message || 'Failed to fetch calendar' };
  }

  return { events: data?.events || [] };
}

export function GoogleCalendarSync({ isGoogleUser, onEventsLoaded }: GoogleCalendarSyncProps) {
  const [loading, setLoading] = useState(false);
  const [synced, setSynced] = useState(false);
  const [eventCount, setEventCount] = useState(0);

  const handleSync = async () => {
    setLoading(true);
    try {
      const result = await fetchCalendarEvents();

      if (result.error) {
        console.error('Calendar sync error:', result.error);
        toast.error('Failed to fetch calendar events. Please sign out and sign in again with Google.');
        return;
      }

      const events = result.events;
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
        {synced ? `Synced (${eventCount} events)` : 'Import Google Calendar'}
      </Button>
      {synced && (
        <p className="text-xs text-muted-foreground">
          Your busy times will be excluded from availability sent to providers.
        </p>
      )}
    </div>
  );
}

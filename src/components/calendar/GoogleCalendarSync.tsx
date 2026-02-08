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
  providerToken: string | null;
  isGoogleUser: boolean;
  onEventsLoaded: (events: CalendarEvent[]) => void;
}

export function GoogleCalendarSync({ providerToken, isGoogleUser, onEventsLoaded }: GoogleCalendarSyncProps) {
  const [loading, setLoading] = useState(false);
  const [synced, setSynced] = useState(false);
  const [eventCount, setEventCount] = useState(0);

  const handleSync = async () => {
    if (!providerToken) {
      toast.error('Calendar access token expired. Please sign out and sign back in with Google.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-events', {
        body: { googleAccessToken: providerToken },
      });

      if (error || data?.error) {
        console.error('Calendar sync error:', error || data);
        if (data?.status === 401 || data?.status === 403) {
          toast.error('Calendar access expired. Please sign out and sign in again with Google.');
          localStorage.removeItem('google_access_token');
        } else {
          toast.error('Failed to fetch calendar events. Make sure you granted calendar access.');
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

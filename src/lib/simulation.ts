import { Provider, CallStatus, TranscriptEntry, TimeSlot } from './types';
import { supabase } from '@/integrations/supabase/client';

/**
 * Simulate a call to a provider using AI-generated dialogue.
 * Real places are "called" but the negotiation is AI-powered.
 */
export function simulateCallSequence(
  provider: Provider,
  onStatusChange: (status: CallStatus) => void,
  onTranscript: (entry: TranscriptEntry) => void,
  onComplete: (offeredSlots: TimeSlot[]) => void,
  requestDescription: string = '',
  userAvailability: TimeSlot[] = [],
): () => void {
  let cancelled = false;

  const run = async () => {
    // Ring phase
    const ringDelay = 500 + Math.random() * 1500;
    await delay(ringDelay);
    if (cancelled) return;

    onStatusChange('ringing');
    onTranscript({ role: 'system', text: `📞 Calling ${provider.name}...`, timestamp: Date.now() });

    // Simulate ring time
    await delay(2000 + Math.random() * 1500);
    if (cancelled) return;

    // 10% chance of no answer
    if (Math.random() < 0.1) {
      onStatusChange('no-answer');
      onTranscript({ role: 'system', text: `${provider.name} did not answer.`, timestamp: Date.now() });
      onComplete([]);
      return;
    }

    onStatusChange('in-progress');
    onTranscript({ role: 'system', text: `🔗 Connected to ${provider.name}`, timestamp: Date.now() });

    try {
      // Call the AI-powered simulation edge function
      const { data, error } = await supabase.functions.invoke('simulate-call', {
        body: {
          provider: {
            name: provider.name,
            category: provider.category,
            address: provider.address,
            phone: provider.phone,
            rating: provider.rating,
          },
          userAvailability,
          requestDescription,
          category: provider.category,
        },
      });

      if (cancelled) return;

      if (error || data?.error) {
        console.error('simulate-call error:', error || data?.error);
        onTranscript({ role: 'system', text: `⚠️ Call to ${provider.name} encountered an issue.`, timestamp: Date.now() });
        onStatusChange('failed');
        onComplete([]);
        return;
      }

      const { messages, result } = data as {
        messages: { role: 'agent' | 'receptionist'; text: string }[];
        result: { hasAvailability: boolean; offeredSlots: TimeSlot[] };
      };

      // Stream messages with realistic delays
      for (const msg of messages) {
        if (cancelled) return;
        // Delay proportional to message length (simulates speaking time)
        const speakDelay = Math.min(800 + msg.text.length * 25, 4000);
        await delay(speakDelay);
        if (cancelled) return;
        onTranscript({ role: msg.role, text: msg.text, timestamp: Date.now() });
      }

      if (cancelled) return;

      // Complete the call
      const offeredSlots = result?.hasAvailability && result?.offeredSlots?.length > 0
        ? result.offeredSlots
        : [];

      onStatusChange(offeredSlots.length > 0 ? 'complete' : 'failed');
      onComplete(offeredSlots);

    } catch (err) {
      console.error('Simulation error for', provider.name, err);
      if (cancelled) return;
      onTranscript({ role: 'system', text: `⚠️ Error during call to ${provider.name}.`, timestamp: Date.now() });
      onStatusChange('failed');
      onComplete([]);
    }
  };

  run();

  return () => { cancelled = true; };
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

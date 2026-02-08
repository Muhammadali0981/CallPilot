import { Provider, CallStatus, TranscriptEntry, TimeSlot } from './types';
import { supabase } from '@/integrations/supabase/client';
import { speakText } from './tts';

// Voice IDs for different roles
const RECEPTIONIST_VOICES: Record<string, string> = {
  medical: 'EXAVITQu4vr4xnSDxMaL',   // Sarah - professional female
  auto: 'nPczCjzI2devNBz1zQrb',        // Brian - casual male
  beauty: 'pFZP5JQG7iQjIQuC4Bku',      // Lily - friendly female
  home: 'TX3LPaxmHKxFdv7VOQHJ',        // Liam - practical male
  fitness: 'IKne3meq5aSn9XLyUdCD',      // Charlie - energetic male
  legal: 'JBFqnCBsd6RMkjVDRZzb',       // George - formal male
};

const AGENT_VOICE = 'onwK4e9ZLuTAKqWW03F9'; // Daniel - professional agent

/**
 * Simulate a call to a provider using AI-generated dialogue (OpenAI via Lovable AI)
 * with ElevenLabs TTS for voice playback.
 */
export function simulateCallSequence(
  provider: Provider,
  onStatusChange: (status: CallStatus) => void,
  onTranscript: (entry: TranscriptEntry) => void,
  onComplete: (offeredSlots: TimeSlot[]) => void,
  requestDescription: string = '',
  userAvailability: TimeSlot[] = [],
  shouldPlayVoice: () => boolean = () => true,
): () => void {
  let cancelled = false;

  const run = async () => {
    // Ring phase
    const ringDelay = 500 + Math.random() * 1500;
    await delay(ringDelay);
    if (cancelled) return;

    onStatusChange('ringing');
    onTranscript({ role: 'system', text: `📞 Calling ${provider.name}...`, timestamp: Date.now() });

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
      // Call the AI-powered simulation edge function (OpenAI generates dialogue)
      console.log(`[simulate] Calling simulate-call for ${provider.name}...`);
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

      const cat = provider.category || 'medical';
      const receptionistVoice = RECEPTIONIST_VOICES[cat] || RECEPTIONIST_VOICES.medical;

      // Stream messages with voice playback
      for (const msg of messages) {
        if (cancelled) return;

        // Show transcript immediately
        onTranscript({ role: msg.role, text: msg.text, timestamp: Date.now() });

        // Play voice via ElevenLabs TTS (waits for playback to finish)
        if (shouldPlayVoice()) {
          const voice = msg.role === 'receptionist' ? receptionistVoice : AGENT_VOICE;
          await speakText(msg.text, voice);
        } else {
          // Without voice, add a reading delay
          const readDelay = Math.min(800 + msg.text.length * 25, 4000);
          await delay(readDelay);
        }

        if (cancelled) return;
      }

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

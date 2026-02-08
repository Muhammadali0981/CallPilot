import { Provider, ProviderCall, CallStatus, TranscriptEntry } from './types';

const receptionistResponses = [
  "Thank you for calling {name}. How can I help you?",
  "Hello, this is {name}. What can I do for you today?",
  "{name}, how may I assist you?",
];

const availabilityResponses = [
  "Let me check our schedule... We have an opening on {day} at {time}. Would that work?",
  "I can see we have availability on {day} from {time}. Shall I book that for you?",
  "We have a slot available on {day} at {time}. Does that fit your schedule?",
];

const confirmResponses = [
  "I've noted that slot. Is there anything else you need?",
  "That slot is available for you. Shall I confirm the booking?",
  "Great, I'll mark that as tentatively held for you.",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatDay(day: string): string {
  const d = new Date(day + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

export function simulateCallSequence(
  provider: Provider,
  onStatusChange: (status: CallStatus) => void,
  onTranscript: (entry: TranscriptEntry) => void,
  onComplete: (offeredSlots: typeof provider.availableSlots) => void
): () => void {
  let cancelled = false;
  const timers: ReturnType<typeof setTimeout>[] = [];

  const schedule = (fn: () => void, delay: number) => {
    const timer = setTimeout(() => { if (!cancelled) fn(); }, delay);
    timers.push(timer);
  };

  // Random delay before ringing (stagger)
  const ringDelay = 500 + Math.random() * 2000;

  schedule(() => {
    onStatusChange('ringing');
    onTranscript({ role: 'system', text: `Calling ${provider.name}...`, timestamp: Date.now() });
  }, ringDelay);

  // Chance of no answer (10%)
  if (Math.random() < 0.1) {
    schedule(() => {
      onStatusChange('no-answer');
      onTranscript({ role: 'system', text: `${provider.name} did not answer.`, timestamp: Date.now() });
      onComplete([]);
    }, ringDelay + 4000);
    return () => { cancelled = true; timers.forEach(clearTimeout); };
  }

  // Pick up
  schedule(() => {
    onStatusChange('in-progress');
    const greeting = pick(receptionistResponses).replace('{name}', provider.name);
    onTranscript({ role: 'receptionist', text: greeting, timestamp: Date.now() });
  }, ringDelay + 2000 + Math.random() * 1000);

  // Agent asks for availability
  schedule(() => {
    onTranscript({
      role: 'agent',
      text: `Hi, I'm calling on behalf of a patient looking for an appointment. Do you have any available slots this week?`,
      timestamp: Date.now(),
    });
  }, ringDelay + 4500);

  // Receptionist offers slots
  const slot = provider.availableSlots.length > 0 ? provider.availableSlots[0] : null;
  schedule(() => {
    if (slot) {
      const resp = pick(availabilityResponses)
        .replace('{day}', formatDay(slot.day))
        .replace('{time}', slot.start);
      onTranscript({ role: 'receptionist', text: resp, timestamp: Date.now() });
    } else {
      onTranscript({ role: 'receptionist', text: "I'm sorry, we don't have any availability this week.", timestamp: Date.now() });
    }
  }, ringDelay + 7000);

  // Agent confirms
  schedule(() => {
    if (slot) {
      onTranscript({
        role: 'agent',
        text: `That sounds great. I'll check with my client and confirm. Thank you!`,
        timestamp: Date.now(),
      });
    } else {
      onTranscript({
        role: 'agent',
        text: `I understand, thank you for your time. Goodbye.`,
        timestamp: Date.now(),
      });
    }
  }, ringDelay + 9500);

  // Receptionist final
  schedule(() => {
    if (slot) {
      onTranscript({ role: 'receptionist', text: pick(confirmResponses), timestamp: Date.now() });
    }
    onStatusChange(slot ? 'complete' : 'failed');
    onComplete(slot ? provider.availableSlots : []);
  }, ringDelay + 11500);

  return () => { cancelled = true; timers.forEach(clearTimeout); };
}

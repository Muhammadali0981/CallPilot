import { Provider, ProviderCall, CallStatus, TranscriptEntry } from './types';

const receptionistResponses = [
  "Thank you for calling {name}. How can I help you?",
  "Hello, this is {name}. What can I do for you today?",
  "{name}, how may I assist you?",
];

const categoryAgentPrompts: Record<string, string> = {
  medical: "Hi, I'm calling on behalf of a patient looking for a medical appointment. Do you have any available slots this week?",
  auto: "Hello, I'm calling for a client who needs to bring their car in for service. Do you have any openings this week?",
  beauty: "Hi there, I'm reaching out on behalf of a client looking to book a beauty appointment. What's your availability like this week?",
  home: "Hello, I'm calling for a homeowner who needs your services. Are you available for a job this week?",
  fitness: "Hi, I'm calling on behalf of someone interested in joining or booking a session. Do you have any openings this week?",
  legal: "Hello, I'm calling to schedule a consultation on behalf of a client. Do you have any available time this week?",
};

const categoryAvailabilityResponses: Record<string, string[]> = {
  medical: [
    "Let me check our appointment book... We have an opening on {day} at {time}. Would that work for your patient?",
    "I can see Dr. Smith has availability on {day} from {time}. Shall I pencil that in?",
  ],
  auto: [
    "Let me check our service bays... We can take the car on {day} at {time}. Does that work?",
    "We have a slot open on {day} starting at {time}. What kind of service does the vehicle need?",
  ],
  beauty: [
    "Let me look at our stylist schedules... We have {day} at {time} available. Would that suit your client?",
    "One of our stylists is free on {day} from {time}. Shall I reserve that?",
  ],
  home: [
    "Let me check our crew schedule... We could come out on {day} around {time}. Would that work?",
    "We have availability on {day} starting at {time}. How big is the job?",
  ],
  fitness: [
    "We have a session open on {day} at {time}. Would that work for them?",
    "Our trainer is available on {day} from {time}. Shall I book that?",
  ],
  legal: [
    "Let me check the attorney's calendar... There's an opening on {day} at {time}. Would that suit your client?",
    "We can schedule a consultation on {day} at {time}. What's the nature of the case?",
  ],
};

const availabilityFallback = [
  "Let me check our schedule... We have an opening on {day} at {time}. Would that work?",
  "I can see we have availability on {day} from {time}. Shall I book that for you?",
];

const confirmResponses = [
  "I've noted that slot. Is there anything else you need?",
  "That slot is available for you. Shall I confirm the booking?",
  "Great, I'll mark that as tentatively held for you.",
];

const noAvailResponses: Record<string, string> = {
  medical: "I'm sorry, the doctors are fully booked this week. Can I put you on a waitlist?",
  auto: "Unfortunately all our bays are booked this week. Would next week work?",
  beauty: "I'm sorry, all our stylists are booked solid this week.",
  home: "Unfortunately our crews are all scheduled out this week.",
  fitness: "We don't have any open sessions this week, I'm afraid.",
  legal: "The attorneys don't have any availability this week. Shall I check next week?",
};

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
  const cat = provider.category || 'medical';

  const schedule = (fn: () => void, delay: number) => {
    const timer = setTimeout(() => { if (!cancelled) fn(); }, delay);
    timers.push(timer);
  };

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

  // Agent asks for availability — category-specific
  schedule(() => {
    const prompt = categoryAgentPrompts[cat] || categoryAgentPrompts.medical;
    onTranscript({ role: 'agent', text: prompt, timestamp: Date.now() });
  }, ringDelay + 4500);

  // Receptionist offers slots — category-specific
  const slot = provider.availableSlots.length > 0 ? provider.availableSlots[0] : null;
  schedule(() => {
    if (slot) {
      const responses = categoryAvailabilityResponses[cat] || availabilityFallback;
      const resp = pick(responses)
        .replace('{day}', formatDay(slot.day))
        .replace('{time}', slot.start);
      onTranscript({ role: 'receptionist', text: resp, timestamp: Date.now() });
    } else {
      const noAvail = noAvailResponses[cat] || "I'm sorry, we don't have any availability this week.";
      onTranscript({ role: 'receptionist', text: noAvail, timestamp: Date.now() });
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

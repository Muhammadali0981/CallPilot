export type Category = 'medical' | 'auto' | 'beauty' | 'home' | 'fitness' | 'legal';

export interface TimeSlot {
  day: string; // e.g. "2026-02-09"
  start: string; // e.g. "09:00"
  end: string; // e.g. "10:00"
}

export interface Provider {
  id: string;
  name: string;
  category: Category;
  address: string;
  city: string;
  zip: string;
  phone: string;
  rating: number;
  distance: number; // miles
  availableSlots: TimeSlot[];
  image?: string;
}

export type CallStatus = 'pending' | 'ringing' | 'in-progress' | 'complete' | 'failed' | 'no-answer';

export interface ProviderCall {
  provider: Provider;
  status: CallStatus;
  startedAt?: number;
  endedAt?: number;
  offeredSlots: TimeSlot[];
  transcript: TranscriptEntry[];
}

export interface TranscriptEntry {
  role: 'agent' | 'receptionist' | 'user' | 'system';
  text: string;
  timestamp: number;
}

export interface BookingRequest {
  id: string;
  description: string;
  category: Category;
  location: string;
  userAvailability: TimeSlot[];
  weights: { availability: number; rating: number; distance: number };
  language: Language;
  createdAt: number;
}

export interface ScoredResult {
  provider: Provider;
  slot: TimeSlot;
  scores: {
    availability: number;
    rating: number;
    distance: number;
    total: number;
  };
}

export interface Booking {
  id: string;
  request: BookingRequest;
  provider: Provider;
  slot: TimeSlot;
  confirmedAt: number;
  status: 'confirmed' | 'cancelled';
}

export type Language = 'en' | 'de' | 'es' | 'tr';

export type AppPage = 'dashboard' | 'new-request' | 'mission-control' | 'results';

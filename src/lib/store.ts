import { create } from 'zustand';
import { BookingRequest, Booking, ProviderCall, Language, AppPage, TranscriptEntry, ScoredResult, Category } from './types';

interface AppState {
  // Navigation
  currentPage: AppPage;
  setPage: (page: AppPage) => void;

  // Language
  language: Language;
  setLanguage: (lang: Language) => void;

  // Current request
  currentRequest: BookingRequest | null;
  setCurrentRequest: (req: BookingRequest | null) => void;

  // Calls in progress
  calls: ProviderCall[];
  setCalls: (calls: ProviderCall[]) => void;
  updateCall: (providerId: string, update: Partial<ProviderCall>) => void;
  addTranscript: (providerId: string, entry: TranscriptEntry) => void;

  // Results
  results: ScoredResult[];
  setResults: (results: ScoredResult[]) => void;

  // Bookings history
  bookings: Booking[];
  addBooking: (booking: Booking) => void;

  // ElevenLabs
  agentId: string;
  setAgentId: (id: string) => void;

  // Voice status
  isVoiceConnected: boolean;
  setVoiceConnected: (connected: boolean) => void;
  isSpeaking: boolean;
  setIsSpeaking: (speaking: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'dashboard',
  setPage: (page) => set({ currentPage: page }),

  language: 'en',
  setLanguage: (language) => set({ language }),

  currentRequest: null,
  setCurrentRequest: (currentRequest) => set({ currentRequest }),

  calls: [],
  setCalls: (calls) => set({ calls }),
  updateCall: (providerId, update) =>
    set((state) => ({
      calls: state.calls.map((c) =>
        c.provider.id === providerId ? { ...c, ...update } : c
      ),
    })),
  addTranscript: (providerId, entry) =>
    set((state) => ({
      calls: state.calls.map((c) =>
        c.provider.id === providerId
          ? { ...c, transcript: [...c.transcript, entry] }
          : c
      ),
    })),

  results: [],
  setResults: (results) => set({ results }),

  bookings: [],
  addBooking: (booking) =>
    set((state) => ({ bookings: [booking, ...state.bookings] })),

  agentId: '',
  setAgentId: (agentId) => set({ agentId }),

  isVoiceConnected: false,
  setVoiceConnected: (isVoiceConnected) => set({ isVoiceConnected }),
  isSpeaking: false,
  setIsSpeaking: (isSpeaking) => set({ isSpeaking }),
}));

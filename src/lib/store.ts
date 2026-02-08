import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BookingRequest, Booking, ProviderCall, Language, AppPage, TranscriptEntry, ScoredResult, Category } from './types';

export interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  allDay: boolean;
}

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

  // Calendar events (persisted across page changes AND refreshes)
  calendarEvents: CalendarEvent[];
  setCalendarEvents: (events: CalendarEvent[]) => void;

  // Calls in progress
  calls: ProviderCall[];
  missionStarted: boolean;
  setCalls: (calls: ProviderCall[]) => void;
  setMissionStarted: (started: boolean) => void;
  updateCall: (providerId: string, update: Partial<ProviderCall>) => void;
  addTranscript: (providerId: string, entry: TranscriptEntry) => void;

  // Results
  results: ScoredResult[];
  setResults: (results: ScoredResult[]) => void;

  // Bookings history
  bookings: Booking[];
  addBooking: (booking: Booking) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentPage: 'dashboard',
      setPage: (page) => set({ currentPage: page }),

      language: 'en',
      setLanguage: (language) => set({ language }),

      currentRequest: null,
      setCurrentRequest: (currentRequest) => set({ currentRequest, missionStarted: false, calls: [] }),

      calendarEvents: [],
      setCalendarEvents: (calendarEvents) => {
        console.log('[store] Setting calendarEvents:', calendarEvents.length, 'events');
        set({ calendarEvents });
      },

      calls: [],
      missionStarted: false,
      setCalls: (calls) => set({ calls }),
      setMissionStarted: (missionStarted) => set({ missionStarted }),
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
    }),
    {
      name: 'callpilot-store',
      // Only persist calendarEvents and language — not navigation or transient state
      partialize: (state) => ({
        calendarEvents: state.calendarEvents,
        language: state.language,
      }),
    }
  )
);

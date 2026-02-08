import { Provider } from './types';

export const providers: Provider[] = [
  // Medical
  { id: 'med-1', name: 'CityHealth Medical Center', category: 'medical', address: '123 Main St', city: 'San Francisco', zip: '94102', phone: '(415) 555-0101', rating: 4.8, distance: 1.2, availableSlots: [{ day: '2026-02-09', start: '09:00', end: '09:30' }, { day: '2026-02-10', start: '14:00', end: '14:30' }, { day: '2026-02-11', start: '11:00', end: '11:30' }] },
  { id: 'med-2', name: 'Bay Area Family Practice', category: 'medical', address: '456 Oak Ave', city: 'San Francisco', zip: '94103', phone: '(415) 555-0102', rating: 4.5, distance: 2.4, availableSlots: [{ day: '2026-02-09', start: '10:30', end: '11:00' }, { day: '2026-02-12', start: '09:00', end: '09:30' }] },
  { id: 'med-3', name: 'Pacific Heights Dental', category: 'medical', address: '789 Pine St', city: 'San Francisco', zip: '94108', phone: '(415) 555-0103', rating: 4.9, distance: 0.8, availableSlots: [{ day: '2026-02-10', start: '08:00', end: '08:30' }, { day: '2026-02-10', start: '15:00', end: '15:30' }, { day: '2026-02-13', start: '10:00', end: '10:30' }] },
  { id: 'med-4', name: 'Marina Wellness Clinic', category: 'medical', address: '321 Marina Blvd', city: 'San Francisco', zip: '94123', phone: '(415) 555-0104', rating: 4.3, distance: 3.1, availableSlots: [{ day: '2026-02-11', start: '13:00', end: '13:30' }] },
  { id: 'med-5', name: 'Sunset Medical Group', category: 'medical', address: '654 Sunset Blvd', city: 'San Francisco', zip: '94116', phone: '(415) 555-0105', rating: 4.6, distance: 5.2, availableSlots: [{ day: '2026-02-09', start: '16:00', end: '16:30' }, { day: '2026-02-14', start: '09:00', end: '09:30' }] },
  // Auto
  { id: 'auto-1', name: 'Golden Gate Auto Service', category: 'auto', address: '100 Geary St', city: 'San Francisco', zip: '94108', phone: '(415) 555-0201', rating: 4.7, distance: 1.5, availableSlots: [{ day: '2026-02-09', start: '08:00', end: '09:00' }, { day: '2026-02-10', start: '10:00', end: '11:00' }] },
  { id: 'auto-2', name: 'Mission District Motors', category: 'auto', address: '200 Mission St', city: 'San Francisco', zip: '94105', phone: '(415) 555-0202', rating: 4.4, distance: 2.8, availableSlots: [{ day: '2026-02-11', start: '09:00', end: '10:00' }, { day: '2026-02-12', start: '14:00', end: '15:00' }] },
  { id: 'auto-3', name: 'Precision Tire & Brake', category: 'auto', address: '300 Van Ness Ave', city: 'San Francisco', zip: '94102', phone: '(415) 555-0203', rating: 4.2, distance: 0.9, availableSlots: [{ day: '2026-02-09', start: '11:00', end: '12:00' }, { day: '2026-02-13', start: '08:00', end: '09:00' }] },
  // Beauty
  { id: 'beauty-1', name: 'Luxe Hair Studio', category: 'beauty', address: '50 Grant Ave', city: 'San Francisco', zip: '94108', phone: '(415) 555-0301', rating: 4.9, distance: 1.0, availableSlots: [{ day: '2026-02-09', start: '10:00', end: '11:00' }, { day: '2026-02-10', start: '13:00', end: '14:00' }, { day: '2026-02-11', start: '16:00', end: '17:00' }] },
  { id: 'beauty-2', name: 'Glow Skin & Spa', category: 'beauty', address: '75 Fillmore St', city: 'San Francisco', zip: '94117', phone: '(415) 555-0302', rating: 4.6, distance: 2.3, availableSlots: [{ day: '2026-02-10', start: '09:00', end: '10:00' }, { day: '2026-02-12', start: '11:00', end: '12:00' }] },
  { id: 'beauty-3', name: 'Nails & Beyond', category: 'beauty', address: '88 Hayes St', city: 'San Francisco', zip: '94102', phone: '(415) 555-0303', rating: 4.1, distance: 1.8, availableSlots: [{ day: '2026-02-09', start: '14:00', end: '15:00' }, { day: '2026-02-13', start: '10:00', end: '11:00' }] },
  // Home Services
  { id: 'home-1', name: 'ProFix Plumbing', category: 'home', address: '500 Howard St', city: 'San Francisco', zip: '94105', phone: '(415) 555-0401', rating: 4.5, distance: 3.5, availableSlots: [{ day: '2026-02-10', start: '08:00', end: '10:00' }, { day: '2026-02-11', start: '13:00', end: '15:00' }] },
  { id: 'home-2', name: 'SparkClean Services', category: 'home', address: '600 Market St', city: 'San Francisco', zip: '94104', phone: '(415) 555-0402', rating: 4.8, distance: 1.1, availableSlots: [{ day: '2026-02-09', start: '09:00', end: '12:00' }, { day: '2026-02-12', start: '09:00', end: '12:00' }] },
  { id: 'home-3', name: 'Bay Electrical Co', category: 'home', address: '700 Folsom St', city: 'San Francisco', zip: '94107', phone: '(415) 555-0403', rating: 4.3, distance: 4.2, availableSlots: [{ day: '2026-02-11', start: '10:00', end: '12:00' }, { day: '2026-02-14', start: '08:00', end: '10:00' }] },
  { id: 'home-4', name: 'Green Thumb Landscaping', category: 'home', address: '800 Divisadero St', city: 'San Francisco', zip: '94117', phone: '(415) 555-0404', rating: 4.7, distance: 2.9, availableSlots: [{ day: '2026-02-13', start: '07:00', end: '10:00' }] },
];

export function getProvidersByCategory(category: string, location?: string): Provider[] {
  let filtered = providers.filter(p => p.category === category);
  if (location && location.trim()) {
    const loc = location.trim().toLowerCase();
    const locationMatched = filtered.filter(p =>
      p.city.toLowerCase().includes(loc) ||
      p.zip.includes(loc) ||
      p.address.toLowerCase().includes(loc)
    );
    // If location matches some providers, use those; otherwise fall back to all in category
    if (locationMatched.length > 0) {
      filtered = locationMatched;
    }
  }
  return filtered;
}

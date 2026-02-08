import { Provider } from './types';
import { supabase } from '@/integrations/supabase/client';

// Static fallback providers for demo/offline use
export const staticProviders: Provider[] = [
  { id: 'med-1', name: 'CityHealth Medical Center', category: 'medical', address: '123 Main St', city: 'San Francisco', zip: '94102', phone: '(415) 555-0101', rating: 4.8, distance: 1.2, availableSlots: [{ day: '2026-02-09', start: '09:00', end: '09:30' }] },
  { id: 'auto-1', name: 'Golden Gate Auto Service', category: 'auto', address: '100 Geary St', city: 'San Francisco', zip: '94108', phone: '(415) 555-0201', rating: 4.7, distance: 1.5, availableSlots: [{ day: '2026-02-09', start: '08:00', end: '09:00' }] },
  { id: 'beauty-1', name: 'Luxe Hair Studio', category: 'beauty', address: '50 Grant Ave', city: 'San Francisco', zip: '94108', phone: '(415) 555-0301', rating: 4.9, distance: 1.0, availableSlots: [{ day: '2026-02-09', start: '10:00', end: '11:00' }] },
  { id: 'home-1', name: 'ProFix Plumbing', category: 'home', address: '500 Howard St', city: 'San Francisco', zip: '94105', phone: '(415) 555-0401', rating: 4.5, distance: 3.5, availableSlots: [{ day: '2026-02-10', start: '08:00', end: '10:00' }] },
];

export async function searchProviders(category: string, location: string): Promise<Provider[]> {
  try {
    const { data, error } = await supabase.functions.invoke('search-providers', {
      body: { category, location },
    });

    if (error) {
      console.error('Edge function error:', error);
      throw error;
    }

    if (data?.providers && data.providers.length > 0) {
      return data.providers as Provider[];
    }

    console.warn('No providers from API, falling back to static data');
    return staticProviders.filter(p => p.category === category);
  } catch (err) {
    console.error('Failed to fetch providers, using fallback:', err);
    return staticProviders.filter(p => p.category === category);
  }
}

// Keep sync version for backward compatibility
export function getProvidersByCategory(category: string, location?: string): Provider[] {
  return staticProviders.filter(p => p.category === category);
}

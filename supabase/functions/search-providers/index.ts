import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map app categories to Mapbox POI search terms — use category + location together
const categorySearchTerms: Record<string, string> = {
  medical: 'hospital clinic',
  auto: 'auto repair garage',
  beauty: 'hair salon spa',
  home: 'plumber electrician',
  fitness: 'gym fitness',
  legal: 'lawyer attorney',
};

function generateSlots(count: number): { day: string; start: string; end: string }[] {
  const slots: { day: string; start: string; end: string }[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const daysAhead = 1 + Math.floor(Math.random() * 7);
    const d = new Date(now);
    d.setDate(d.getDate() + daysAhead);
    const day = d.toISOString().split('T')[0];
    const hour = 8 + Math.floor(Math.random() * 9);
    const start = `${String(hour).padStart(2, '0')}:00`;
    const endHour = hour + 1;
    const end = `${String(endHour).padStart(2, '0')}:00`;
    slots.push({ day, start, end });
  }
  return slots;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const MAPBOX_TOKEN = Deno.env.get('MAPBOX_ACCESS_TOKEN');
    if (!MAPBOX_TOKEN) {
      throw new Error('MAPBOX_ACCESS_TOKEN is not configured');
    }

    const { category, location } = await req.json();
    if (!category || !location) {
      return new Response(JSON.stringify({ error: 'category and location are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const searchText = categorySearchTerms[category] || category;

    // Combine category + location in the query for best results
    const combinedQuery = `${searchText} near ${location}`;
    const encoded = encodeURIComponent(combinedQuery);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${MAPBOX_TOKEN}&limit=10`;
    
    console.log(`Searching Mapbox for: ${combinedQuery}`);

    const response = await fetch(url);
    if (!response.ok) {
      const errText = await response.text();
      console.error(`Mapbox API error [${response.status}]: ${errText}`);
      throw new Error(`Mapbox API error: ${response.status}`);
    }

    const data = await response.json();
    const features = data.features || [];
    console.log(`Found ${features.length} results from Mapbox`);

    const providers = features.map((feature: any, idx: number) => {
      const props = feature.properties || {};
      const context = feature.context || [];
      const city = context.find((c: any) => c.id?.startsWith('place'))?.text || '';
      const zip = context.find((c: any) => c.id?.startsWith('postcode'))?.text || '';
      
      return {
        id: `${category}-mapbox-${idx}`,
        name: feature.text || `Provider ${idx + 1}`,
        category,
        address: feature.place_name?.split(',')[0] || '',
        city,
        zip,
        phone: props.tel || `(555) ${String(100 + idx).padStart(3, '0')}-${String(1000 + Math.floor(Math.random() * 9000))}`,
        rating: +(3.5 + Math.random() * 1.5).toFixed(1),
        distance: +(0.5 + Math.random() * 8).toFixed(1),
        availableSlots: generateSlots(1 + Math.floor(Math.random() * 4)),
      };
    });

    return new Response(JSON.stringify({ providers }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in search-providers:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

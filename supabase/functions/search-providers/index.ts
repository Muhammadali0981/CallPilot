import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map app categories to Geoapify place categories
const categoryMapping: Record<string, string> = {
  medical: 'healthcare.hospital,healthcare.clinic_or_praxis,healthcare.dentist,healthcare.pharmacy',
  auto: 'service.vehicle.repair,service.vehicle.car_wash,service.vehicle.fuel',
  beauty: 'service.beauty.hairdresser,service.beauty.spa,service.beauty.nails',
  home: 'service.construction,service.electricity,service.plumber',
  fitness: 'sport.fitness,sport.gym,leisure.fitness',
  legal: 'office.lawyer,office.notary',
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
    const end = `${String(hour + 1).padStart(2, '0')}:00`;
    slots.push({ day, start, end });
  }
  return slots;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const GEOAPIFY_KEY = '88c2c67b83aa4eb89b05d539a4090390';

    const { category, location, lat, lon } = await req.json();
    if (!category) {
      return new Response(JSON.stringify({ error: 'category is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let userLat = lat;
    let userLon = lon;

    // If no coordinates provided, geocode the location string
    if ((!userLat || !userLon) && location) {
      const geoUrl = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(location)}&limit=1&apiKey=${GEOAPIFY_KEY}`;
      const geoRes = await fetch(geoUrl);
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData.features?.length > 0) {
          const coords = geoData.features[0].geometry.coordinates;
          userLon = coords[0];
          userLat = coords[1];
        }
      }
    }

    if (!userLat || !userLon) {
      // Default to San Francisco
      userLat = 37.7749;
      userLon = -122.4194;
    }

    const categories = categoryMapping[category] || 'commercial';
    
    // Build a bounding box ~10 miles around the user
    const offset = 0.15; // ~10 miles in degrees
    const filter = `rect:${userLon - offset},${userLat + offset},${userLon + offset},${userLat - offset}`;
    
    const url = `https://api.geoapify.com/v2/places?categories=${categories}&filter=${filter}&limit=15&apiKey=${GEOAPIFY_KEY}`;
    console.log(`Searching Geoapify for: ${categories} near [${userLat}, ${userLon}]`);

    const response = await fetch(url);
    if (!response.ok) {
      const errText = await response.text();
      console.error(`Geoapify API error [${response.status}]: ${errText}`);
      throw new Error(`Geoapify API error: ${response.status}`);
    }

    const data = await response.json();
    const features = data.features || [];
    console.log(`Found ${features.length} results from Geoapify`);

    const providers = features.map((feature: any, idx: number) => {
      const props = feature.properties || {};
      const placeLat = props.lat;
      const placeLon = props.lon;
      const dist = (placeLat && placeLon)
        ? haversineDistance(userLat, userLon, placeLat, placeLon)
        : +(0.5 + Math.random() * 8).toFixed(1);

      return {
        id: `${category}-geo-${idx}`,
        name: props.name || props.address_line1 || `Provider ${idx + 1}`,
        category,
        address: props.address_line1 || props.formatted || '',
        city: props.city || props.town || props.village || '',
        zip: props.postcode || '',
        phone: props.contact?.phone || `(555) ${String(100 + idx).padStart(3, '0')}-${String(1000 + Math.floor(Math.random() * 9000))}`,
        rating: +(3.5 + Math.random() * 1.5).toFixed(1),
        distance: +dist.toFixed(1),
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

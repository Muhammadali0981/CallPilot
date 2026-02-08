const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { googleAccessToken, timeMin, timeMax } = await req.json();

    // Default: fetch events for the next 30 days
    const now = new Date();
    const defaultMin = timeMin || now.toISOString();
    const defaultMax = timeMax || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    let calendarUrl: URL;
    let headers: Record<string, string>;

    if (googleAccessToken) {
      // Direct Google API call with user's access token
      calendarUrl = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
      headers = { Authorization: `Bearer ${googleAccessToken}` };
      console.log("[google-calendar] Using direct Google API with access token");
    } else {
      // Fallback: use Lovable gateway (handles auth automatically)
      calendarUrl = new URL("https://gateway.lovable.dev/google_calendar/calendar/v3/calendars/primary/events");
      // Forward the authorization header from the request
      const authHeader = req.headers.get("authorization") || "";
      headers = { Authorization: authHeader };
      console.log("[google-calendar] Using Lovable gateway");
    }

    calendarUrl.searchParams.set("timeMin", defaultMin);
    calendarUrl.searchParams.set("timeMax", defaultMax);
    calendarUrl.searchParams.set("singleEvents", "true");
    calendarUrl.searchParams.set("orderBy", "startTime");
    calendarUrl.searchParams.set("maxResults", "100");

    console.log(`[google-calendar] Fetching events from ${defaultMin} to ${defaultMax}`);

    const response = await fetch(calendarUrl.toString(), { headers });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[google-calendar] API error:", response.status, errorText);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch calendar events",
          status: response.status,
          detail: errorText,
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const events = (data.items || []).map((event: any) => ({
      id: event.id,
      summary: event.summary || "(No title)",
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      allDay: !event.start?.dateTime,
    }));

    console.log(`[google-calendar] Found ${events.length} events`);

    return new Response(
      JSON.stringify({ events }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[google-calendar] Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

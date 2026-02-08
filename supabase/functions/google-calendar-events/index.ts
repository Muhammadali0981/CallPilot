import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { timeMin, timeMax } = await req.json();

    // Authenticate the user
    const authHeader = req.headers.get("authorization") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("[google-calendar] Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized. Please sign in." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[google-calendar] Fetching tokens for user:", user.id);

    // Get stored tokens from database
    const { data: tokenData, error: tokenError } = await supabase
      .from("oauth_tokens")
      .select("access_token, refresh_token, expires_at")
      .eq("user_id", user.id)
      .eq("provider", "google")
      .single();

    if (tokenError || !tokenData) {
      console.error("[google-calendar] No tokens found:", tokenError);
      return new Response(
        JSON.stringify({ error: "no_tokens", message: "Google Calendar not connected. Please connect your calendar first." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let accessToken = tokenData.access_token;

    // Check if token is expired (5 minute buffer)
    const expiresAt = new Date(tokenData.expires_at);
    if (expiresAt <= new Date(Date.now() + 5 * 60 * 1000)) {
      console.log("[google-calendar] Access token expired, refreshing...");

      const clientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
      const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

      const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: tokenData.refresh_token,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      if (!refreshResponse.ok) {
        const errorText = await refreshResponse.text();
        console.error("[google-calendar] Token refresh failed:", refreshResponse.status, errorText);
        
        // If refresh token is invalid, delete stored tokens
        if (refreshResponse.status === 400 || refreshResponse.status === 401) {
          await supabase.from("oauth_tokens").delete().eq("user_id", user.id).eq("provider", "google");
        }
        
        return new Response(
          JSON.stringify({ error: "token_expired", message: "Calendar access expired. Please reconnect your Google Calendar." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const newTokens = await refreshResponse.json();
      accessToken = newTokens.access_token;

      // Update stored tokens
      const newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000).toISOString();
      await supabase
        .from("oauth_tokens")
        .update({
          access_token: newTokens.access_token,
          refresh_token: newTokens.refresh_token ?? tokenData.refresh_token,
          expires_at: newExpiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("provider", "google");

      console.log("[google-calendar] Token refreshed successfully");
    }

    // Fetch calendar events
    const now = new Date();
    const defaultMin = timeMin || now.toISOString();
    const defaultMax = timeMax || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const calendarUrl = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
    calendarUrl.searchParams.set("timeMin", defaultMin);
    calendarUrl.searchParams.set("timeMax", defaultMax);
    calendarUrl.searchParams.set("singleEvents", "true");
    calendarUrl.searchParams.set("orderBy", "startTime");
    calendarUrl.searchParams.set("maxResults", "100");

    console.log(`[google-calendar] Fetching events from ${defaultMin} to ${defaultMax}`);

    const response = await fetch(calendarUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[google-calendar] Google API error:", response.status, errorText);
      
      // If 401, the token might have been revoked
      if (response.status === 401) {
        await supabase.from("oauth_tokens").delete().eq("user_id", user.id).eq("provider", "google");
        return new Response(
          JSON.stringify({ error: "token_expired", message: "Calendar access revoked. Please reconnect." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to fetch calendar events", status: response.status, detail: errorText }),
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

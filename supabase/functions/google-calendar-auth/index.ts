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
    const { action, code, redirectUri } = await req.json();
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      console.error("[google-calendar-auth] Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
      return new Response(
        JSON.stringify({ error: "Google OAuth not configured on server" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ACTION: get_auth_url — generate the Google OAuth consent URL
    if (action === "get_auth_url") {
      const state = crypto.randomUUID();
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "https://www.googleapis.com/auth/calendar.readonly",
        access_type: "offline",
        prompt: "consent",
        state,
        include_granted_scopes: "true",
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      console.log("[google-calendar-auth] Generated auth URL");

      return new Response(
        JSON.stringify({ authUrl, state }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ACTION: exchange_code — exchange authorization code for tokens and store them
    if (action === "exchange_code") {
      if (!code || !redirectUri) {
        return new Response(
          JSON.stringify({ error: "Missing code or redirectUri" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get the authenticated user
      const authHeader = req.headers.get("authorization") || "";
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Verify the user's JWT
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      
      if (userError || !user) {
        console.error("[google-calendar-auth] Auth error:", userError);
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("[google-calendar-auth] Exchanging code for tokens, user:", user.id);

      // Exchange the authorization code for tokens
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("[google-calendar-auth] Token exchange failed:", tokenResponse.status, errorText);
        return new Response(
          JSON.stringify({ error: "Token exchange failed", detail: errorText }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tokens = await tokenResponse.json();
      console.log("[google-calendar-auth] Token exchange success, expires_in:", tokens.expires_in, "has refresh_token:", !!tokens.refresh_token);

      if (!tokens.refresh_token) {
        console.error("[google-calendar-auth] No refresh token received! User may need to revoke access and re-authorize.");
        return new Response(
          JSON.stringify({ error: "No refresh token received. Please revoke app access in Google account settings and try again." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Store tokens in database using service role (bypasses RLS)
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
      const { error: upsertError } = await supabase
        .from("oauth_tokens")
        .upsert({
          user_id: user.id,
          provider: "google",
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id,provider" });

      if (upsertError) {
        console.error("[google-calendar-auth] DB upsert error:", upsertError);
        return new Response(
          JSON.stringify({ error: "Failed to store tokens" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("[google-calendar-auth] Tokens stored successfully for user:", user.id);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use 'get_auth_url' or 'exchange_code'" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[google-calendar-auth] Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface Provider {
  name: string;
  category: string;
  address: string;
  phone: string;
  rating: number;
}

interface TimeSlot {
  day: string;
  start: string;
  end: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { provider, userAvailability, requestDescription, category } = await req.json() as {
      provider: Provider;
      userAvailability: TimeSlot[];
      requestDescription: string;
      category: string;
    };

    console.log(`[simulate-call] Provider: ${provider.name}, Category: ${category}`);
    console.log(`[simulate-call] User availability (${userAvailability.length} slots):`, JSON.stringify(userAvailability));

    const availabilityStr = userAvailability
      .map((s: TimeSlot) => `${s.day} ${s.start}-${s.end}`)
      .join(", ");

    const systemPrompt = `You are simulating a phone call between an AI booking agent and a receptionist at "${provider.name}" (a ${category} provider located at ${provider.address}, rated ${provider.rating}/5).

Generate a realistic phone call transcript as a JSON array of messages. The call should:
1. Start with the receptionist answering the phone (greeting specific to the business type)
2. The AI agent introduces itself and explains it's calling on behalf of a client
3. The agent asks about availability for: ${requestDescription}
4. The receptionist checks their schedule and responds (80% chance they have availability, 20% they don't)
5. If available, the receptionist MUST offer 1-2 specific time slots chosen EXACTLY from this list of the client's FREE windows (these are the ONLY acceptable times — busy periods are already removed):
   ${availabilityStr}
   IMPORTANT: You MUST pick start and end times that fall entirely within one of these windows. Do NOT offer times outside these ranges. For example if free window is "2026-02-10 09:00-12:00", you could offer "2026-02-10 09:00-10:00" or "2026-02-10 10:00-11:00" but NEVER "2026-02-10 13:00-14:00".
6. The agent confirms interest and thanks them
7. Call ends naturally

Each message should have: role ("agent" or "receptionist"), text (the dialogue)
Also include a final "result" object with: hasAvailability (boolean), offeredSlots (array of {day, start, end} objects if available)

The conversation should feel natural, include small talk or realistic pauses (like "Let me check..." or "One moment please..."), and use terminology appropriate for a ${category} business.

Respond with ONLY valid JSON in this format:
{
  "messages": [{"role": "agent"|"receptionist", "text": "..."}],
  "result": {"hasAvailability": true|false, "offeredSlots": [{"day":"2026-02-10","start":"09:00","end":"10:00"}]}
}`;

    const response = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Simulate the phone call now. The business is "${provider.name}", a ${category} provider. The client needs: ${requestDescription}` },
        ],
        temperature: 0.8,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI Gateway error [${response.status}]: ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON from the AI response (handle markdown code blocks)
    let parsed;
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI-generated conversation");
    }

    // Server-side validation: reject offered slots that fall outside user's free windows
    if (parsed.result?.offeredSlots && userAvailability.length > 0) {
      const toMin = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      };

      parsed.result.offeredSlots = parsed.result.offeredSlots.filter((slot: TimeSlot) => {
        const slotStart = toMin(slot.start);
        const slotEnd = toMin(slot.end);
        // Slot must fall entirely within at least one free window
        return userAvailability.some((free: TimeSlot) =>
          free.day === slot.day && toMin(free.start) <= slotStart && slotEnd <= toMin(free.end)
        );
      });

      // Update hasAvailability based on validated slots
      parsed.result.hasAvailability = parsed.result.offeredSlots.length > 0;
      
      if (!parsed.result.hasAvailability) {
        console.log("[simulate-call] All offered slots were outside user availability — rejected");
      }
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("simulate-call error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

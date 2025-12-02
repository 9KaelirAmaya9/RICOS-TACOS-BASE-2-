import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a helpful AI assistant for Axonic Motorworks, a veteran-owned precision auto body shop in Austin, Texas.

SERVICES WE OFFER:
- Automotive Repair (engine, transmission, brakes, and more)
- Bodywork Services (dents, scratches, collision repair)
- Boat Restoration & Marine Services
- Professional Car Painting & Refinishing

KEY INFORMATION:
- Phone: (210) 823-1595
- Email: sales@axonicmoto.com
- Address: 15600 Marsha Street, Building 1 Unit 1A, Austin, TX
- Location: North Austin, Texas
- Veteran-Owned Business

UNIQUE VALUE PROPOSITION:
- NO BULL PRICING - Fair prices with absolutely no hidden fees
- Transparent Communication - You know exactly what you're paying for
- Exceptional Results - Quality work delivered consistently
- Paint Warranty: 2 years on all paint work
- Other Warranties: Evaluated case-by-case per job

BRAND POSITIONING:
We emphasize AFFORDABILITY and TRANSPARENCY as our core differentiators. We reject misleading pricing and focus on delivering fair, honest service.

YOUR ROLE:
- Answer questions about services, pricing, and processes
- Help schedule consultations
- Provide service area information
- Be friendly, professional, and honest
- When customers want to book or need detailed quotes, encourage them to call (210) 823-1595, email sales@axonicmoto.com, or use the booking form on the website
- Emphasize our veteran-owned status as a trust factor
- Highlight our no-bull pricing and fair cost approach

Keep responses concise and helpful. Focus on transparency and customer service excellence.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please contact support." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

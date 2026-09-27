import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product_name, category, brand, options, delivery_time, price } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const optionNames = Array.isArray(options) 
      ? options.filter((o: any) => o.name).map((o: any) => o.name).join(", ")
      : "";

    const systemPrompt = `You are an expert SEO content writer for Smart Digital Hub, a trusted digital subscription service provider in Bangladesh. Generate SEO-optimized content for digital products.

Rules:
- Write in natural, human English. No spammy text.
- Include Bangladesh/BD keywords only when relevant.
- Make content unique, trustworthy, and conversion-focused.
- Use trust signals: fast delivery, secure access, verified service, customer support.
- Avoid keyword stuffing.
- For digital subscription products, structure the long description with these sections:
  1. Introduction
  2. What You Will Receive
  3. Key Features
  4. Why Choose Smart Digital Hub
  5. Important Instructions
  6. Customer Support (Email: hello@sagor.pro.bd, WhatsApp: https://wa.me/+8801322230857)
  7. Call To Action
- Use HTML tags (h2, h3, p, ul, li, strong) for the long description.
- Make the SEO title under 60 characters.
- Make meta description under 160 characters and compelling for CTR.
- Generate 5-10 strong focus keywords as comma-separated values.
- Generate a clean URL slug (lowercase, hyphens, no special chars).`;

    const userPrompt = `Generate SEO content for this product:

Product Name: ${product_name}
Category: ${category || "Digital Products"}
Brand: ${brand || "Smart Digital Hub"}
Price: ৳${price || "N/A"}
Available Options/Plans: ${optionNames || "Standard"}
Delivery: ${delivery_time || "Instant digital delivery (2-30 minutes)"}
Target Country: Bangladesh
Target Audience: Students, freelancers, developers, content creators, professionals`;

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
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_seo_content",
              description: "Return the generated SEO content for the product.",
              parameters: {
                type: "object",
                properties: {
                  seo_title: { type: "string", description: "SEO-friendly product title, under 60 characters" },
                  meta_description: { type: "string", description: "Meta description under 160 characters, compelling for CTR" },
                  focus_keywords: { type: "string", description: "5-10 focus keywords, comma-separated" },
                  long_description: { type: "string", description: "Full SEO product description in HTML format with h2, h3, p, ul, li tags" },
                  slug: { type: "string", description: "Clean URL slug, lowercase with hyphens" },
                  short_description: { type: "string", description: "One-line product summary, under 100 characters" },
                },
                required: ["seo_title", "meta_description", "focus_keywords", "long_description", "slug", "short_description"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_seo_content" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const seoContent = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(seoContent), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-seo error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

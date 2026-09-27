import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");

  if (!slug) {
    return new Response("Missing slug", { status: 400 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Try slug first, then id
  let { data: product } = await supabase
    .from("products")
    .select("name, short_description, description, image_url, price, slug, seo_title, meta_description")
    .eq("slug", slug)
    .maybeSingle();

  if (!product) {
    const res = await supabase
      .from("products")
      .select("name, short_description, description, image_url, price, slug, seo_title, meta_description")
      .eq("id", slug)
      .maybeSingle();
    product = res.data;
  }

  if (!product) {
    return new Response("Product not found", { status: 404 });
  }

  const siteUrl = "https://techsubxbd.lovable.app";
  const productUrl = `${siteUrl}/product/${product.slug || slug}`;
  const title = product.seo_title || product.name || "Smart Digital Hub";
  const description = product.meta_description || product.short_description || 
    (product.description ? product.description.replace(/<[^>]+>/g, "").slice(0, 160) : "Smart Digital Hub - Premium Digital Products");
  const image = product.image_url || `${siteUrl}/logo.png`;

  const escHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const html = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escHtml(title)}</title>
  <meta name="description" content="${escHtml(description)}" />

  <!-- Open Graph -->
  <meta property="og:type" content="product" />
  <meta property="og:title" content="${escHtml(title)}" />
  <meta property="og:description" content="${escHtml(description)}" />
  <meta property="og:image" content="${escHtml(image)}" />
  <meta property="og:url" content="${escHtml(productUrl)}" />
  <meta property="og:site_name" content="TechSubxBD" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escHtml(title)}" />
  <meta name="twitter:description" content="${escHtml(description)}" />
  <meta name="twitter:image" content="${escHtml(image)}" />

  <!-- Redirect humans to actual product page -->
  <meta http-equiv="refresh" content="0;url=${escHtml(productUrl)}" />
  <link rel="canonical" href="${escHtml(productUrl)}" />
</head>
<body>
  <p>Redirecting to <a href="${escHtml(productUrl)}">${escHtml(title)}</a>...</p>
</body>
</html>`;

  return new Response(html, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});

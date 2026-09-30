export interface SeoGeneratedData {
  seo_title: string;
  meta_description: string;
  focus_keywords: string;
  long_description: string;
  short_description: string;
  slug: string;
}

export const generateLocalSeo = (params: {
  product_name: string;
  category?: string;
  brand?: string;
  options?: Array<{ name: string; price?: number }>;
  delivery_time?: string;
  price?: string | number;
}): SeoGeneratedData => {
  const name = params.product_name.trim();
  const brand = params.brand || "Smart Digital Hub";
  const delivery = params.delivery_time || "Instant digital delivery (2-30 minutes)";
  const category = params.category || "Digital Product";
  const optionsText = Array.isArray(params.options) && params.options.length > 0
    ? params.options.map(o => o.name).filter(Boolean).join(", ")
    : "Standard / Premium Plan";

  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  const seo_title = `Buy ${name} in Bangladesh | Best Price - ${brand}`;
  const meta_description = `Buy genuine ${name} at the best price in Bangladesh. ${delivery}, full warranty, bKash/Nagad payment & 24/7 customer support from ${brand}.`;
  
  const keywords = [
    name,
    `${name} Bangladesh`,
    `buy ${name} BD`,
    `${name} price in BD`,
    `${name} subscription`,
    `${name} buy online`,
    category,
    "digital subscriptions BD",
    brand
  ].join(", ");

  const short_description = `100% genuine ${name} with ${delivery.toLowerCase()} and full warranty support.`;

  const long_description = `
<h2>${name} — 100% Genuine Digital Subscription</h2>
<p>Looking to buy <strong>${name}</strong> at the most affordable price in Bangladesh? At <strong>${brand}</strong>, we provide 100% genuine, verified, and premium digital subscriptions with lightning-fast delivery and dedicated customer support.</p>

<h3>✨ What You Will Receive:</h3>
<ul>
  <li><strong>Instant Access:</strong> Login credentials or activation link delivered directly to your email and order dashboard.</li>
  <li><strong>Available Plans:</strong> ${optionsText}.</li>
  <li><strong>Delivery Time:</strong> ${delivery}.</li>
  <li><strong>Full Warranty:</strong> Complete replacement and troubleshooting support during your active validity period.</li>
</ul>

<h3>🚀 Why Choose ${brand}?</h3>
<ul>
  <li>✅ <strong>100% Genuine & Safe:</strong> No cracked or fraudulent accounts. Only legal, premium subscriptions.</li>
  <li>✅ <strong>Fast bKash / Nagad / Rocket Payment:</strong> Instant manual verification within 5-10 minutes.</li>
  <li>✅ <strong>Dedicated Customer Support:</strong> 24/7 live assistance via WhatsApp and Live Chat.</li>
  <li>✅ <strong>Thousands of Satisfied Customers:</strong> Bangladesh's trusted destination for digital subscriptions.</li>
</ul>

<h3>⚠️ Important Usage Guidelines:</h3>
<ul>
  <li>Please do not change the account credentials (email/password/profile) unless explicitly instructed.</li>
  <li>Use only on permitted devices as per your purchased plan.</li>
</ul>

<h3>📞 Need Help?</h3>
<p>If you have any questions or need custom assistance, contact our dedicated support team on WhatsApp at <strong>+8801516524644</strong>.</p>
`.trim();

  return {
    seo_title: seo_title.slice(0, 60),
    meta_description: meta_description.slice(0, 160),
    focus_keywords: keywords,
    long_description,
    short_description,
    slug,
  };
};

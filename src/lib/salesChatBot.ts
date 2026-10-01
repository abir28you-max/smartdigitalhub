/**
 * Smart Digital Hub - Ultra-Intelligent Conversational Sales & Support AI Engine
 * Designed to act naturally like ChatGPT / Claude / Gemini in Bengali & Banglish
 */

export interface ChatBotProduct {
  id?: string;
  name: string;
  price: number;
  stock_status: string;
  short_description?: string | null;
  slug?: string | null;
  category_id?: string | null;
}

export interface ChatBotCategory {
  id: string;
  name: string;
  slug: string;
}

// Built-in catalog fallback (updated live from DB)
export const DEFAULT_CATALOG: ChatBotProduct[] = [
  { name: "Canva Pro", price: 100, stock_status: "in_stock", slug: "canva-pro-subscription-bangladesh" },
  { name: "Youtube Premium", price: 99, stock_status: "in_stock", slug: "youtube-premium" },
  { name: "Duolingo Super", price: 300, stock_status: "in_stock", slug: "duolingo" },
  { name: "Capcut Pro", price: 350, stock_status: "in_stock", slug: "capcut-pro" },
  { name: "Gemini 18 Months", price: 250, stock_status: "in_stock", slug: "gemini-ai" },
  { name: "Prime Video 6 Month", price: 500, stock_status: "in_stock", slug: "prime-video6month" },
  { name: "Crunchyroll", price: 80, stock_status: "in_stock", slug: "crunchyroll-premium-profile-1-month-bd" },
  { name: "Express VPN", price: 300, stock_status: "in_stock", slug: "express-vpn" },
  { name: "HMA VPN", price: 150, stock_status: "in_stock", slug: "hma-vpn" },
  { name: "ChatGPT Plus", price: 600, stock_status: "out_of_stock", slug: "chatgpt" },
  { name: "Claude AI", price: 2850, stock_status: "out_of_stock", slug: "claude" },
  { name: "Midjourney", price: 300, stock_status: "out_of_stock", slug: "midjourney" },
  { name: "Grammarly Premium", price: 300, stock_status: "out_of_stock", slug: "grammerly" },
  { name: "QuillBot Premium", price: 450, stock_status: "out_of_stock", slug: "quillbot" },
  { name: "Perplexity Ai Pro", price: 799, stock_status: "out_of_stock", slug: "perplexity-ai" },
  { name: "Adobe Creative Pro", price: 200, stock_status: "out_of_stock", slug: "adobe-creative-cloud" },
  { name: "Leonardo Ai", price: 400, stock_status: "out_of_stock", slug: "leonardo-ai" },
  { name: "Microsoft 365 & Copilot pro", price: 350, stock_status: "out_of_stock", slug: "microsoft-365" },
  { name: "Replit", price: 350, stock_status: "out_of_stock", slug: "replit-core" },
  { name: "SonyLiv", price: 150, stock_status: "out_of_stock", slug: "sonyliv" },
  { name: "Camscanner Premium", price: 99, stock_status: "out_of_stock", slug: "camscanner-premium-subscription-bd" },
  { name: "iLovePDF", price: 350, stock_status: "out_of_stock", slug: "ilovepdf" },
  { name: "Norton VPN", price: 150, stock_status: "out_of_stock", slug: "norton-vpn-bangladesh-1-month" },
  { name: "Proton VPN", price: 99, stock_status: "out_of_stock", slug: "proton-vpn-premium-1-month" },
  { name: "IPvanish", price: 150, stock_status: "out_of_stock", slug: "buy-ipvanish-vpn-bangladesh" },
  { name: "Mysterium VPN", price: 280, stock_status: "out_of_stock", slug: "mysterium-vpn" },
  { name: "HboMax", price: 350, stock_status: "out_of_stock", slug: "hbo-max-1-month-profile-bd" },
  { name: "Nitro", price: 799, stock_status: "out_of_stock", slug: "nitro" },
  { name: "Hegen AI Pro", price: 300, stock_status: "out_of_stock", slug: "hegen-ai-pro-3-month-subscription" },
];

// Product name / keyword mapping dictionary
interface KeywordMapping {
  keywords: string[];
  productSearchTerm: string;
  displayName: string;
  category: "ai" | "vpn" | "education" | "editing" | "entertainment" | "developer" | "other";
}

const PRODUCT_DICTIONARY: KeywordMapping[] = [
  // AI Tools
  { keywords: ["canva", "ক্যানভা", "canva pro"], productSearchTerm: "canva", displayName: "Canva Pro", category: "editing" },
  { keywords: ["gemini", "জেমিনি", "google gemini", "gemini ai", "gemini advanced"], productSearchTerm: "gemini", displayName: "Gemini AI", category: "ai" },
  { keywords: ["chatgpt", "chat gpt", "gpt 4", "gpt-4", "gpt4", "openai", "open ai", "চ্যাটজিপিটি", "gpt"], productSearchTerm: "chatgpt", displayName: "ChatGPT Plus", category: "ai" },
  { keywords: ["claude", "claude ai", "ক্লদ", "claude pro", "sonnet"], productSearchTerm: "claude", displayName: "Claude AI", category: "ai" },
  { keywords: ["midjourney", "মিডজার্নি", "mid journey"], productSearchTerm: "midjourney", displayName: "Midjourney", category: "ai" },
  { keywords: ["perplexity", "পারপ্লেক্সিটি", "perplexity ai", "perplexity pro"], productSearchTerm: "perplexity", displayName: "Perplexity AI", category: "ai" },
  { keywords: ["leonardo", "লিওনার্দো", "leonardo ai"], productSearchTerm: "leonardo", displayName: "Leonardo AI", category: "ai" },
  { keywords: ["hegen", "হেগেন", "heygen", "hegen ai"], productSearchTerm: "hegen", displayName: "Hegen AI", category: "ai" },

  // Video & Design Editing
  { keywords: ["capcut", "ক্যাপকাট", "capcut pro"], productSearchTerm: "capcut", displayName: "CapCut Pro", category: "editing" },
  { keywords: ["adobe", "অ্যাডোবি", "photoshop", "creative cloud", "illustrator", "premiere pro"], productSearchTerm: "adobe", displayName: "Adobe Creative Cloud", category: "editing" },
  { keywords: ["camscanner", "ক্যামস্ক্যানার", "cam scanner"], productSearchTerm: "camscanner", displayName: "CamScanner", category: "editing" },
  { keywords: ["ilovepdf", "আইলাভপিডিএফ", "i love pdf"], productSearchTerm: "ilovepdf", displayName: "iLovePDF", category: "editing" },

  // Education & Learning
  { keywords: ["duolingo", "ডুওলিঙ্গো", "duolingo super", "duolingo max"], productSearchTerm: "duolingo", displayName: "Duolingo Super", category: "education" },
  { keywords: ["grammarly", "গ্রামারলি", "grammerly"], productSearchTerm: "grammarly", displayName: "Grammarly", category: "education" },
  { keywords: ["quillbot", "কুইলবট", "quill bot"], productSearchTerm: "quillbot", displayName: "QuillBot", category: "education" },

  // VPNs
  { keywords: ["express vpn", "expressvpn", "এক্সপ্রেস ভিপিএন"], productSearchTerm: "express", displayName: "Express VPN", category: "vpn" },
  { keywords: ["hma", "hma vpn", "এইচএমএ ভিপিএন"], productSearchTerm: "hma", displayName: "HMA VPN", category: "vpn" },
  { keywords: ["norton", "নর্ডন", "নর্টন", "norton vpn"], productSearchTerm: "norton", displayName: "Norton VPN", category: "vpn" },
  { keywords: ["proton", "প্রোটন", "proton vpn", "protonvpn"], productSearchTerm: "proton", displayName: "Proton VPN", category: "vpn" },
  { keywords: ["ipvanish", "আইপিভ্যানিশ", "ip vanish"], productSearchTerm: "ipvanish", displayName: "IPVanish", category: "vpn" },
  { keywords: ["mysterium", "মিস্টেরিয়াম", "mysterium vpn"], productSearchTerm: "mysterium", displayName: "Mysterium VPN", category: "vpn" },

  // Entertainment & OTT
  { keywords: ["youtube", "ইউটিউব", "yt", "yt premium", "youtube premium"], productSearchTerm: "youtube", displayName: "YouTube Premium", category: "entertainment" },
  { keywords: ["prime", "prime video", "প্রাইম", "প্রাইম ভিডিও", "amazon prime"], productSearchTerm: "prime", displayName: "Amazon Prime Video", category: "entertainment" },
  { keywords: ["crunchyroll", "ক্রাঞ্চিরোল", "anime", "এনিমে"], productSearchTerm: "cruchyroll", displayName: "Crunchyroll", category: "entertainment" },
  { keywords: ["sonyliv", "সনি লিভ", "sony liv"], productSearchTerm: "sonyliv", displayName: "SonyLiv", category: "entertainment" },
  { keywords: ["hbomax", "hbo max", "hbo", "এইচবিও", "max"], productSearchTerm: "hbo", displayName: "HBO Max", category: "entertainment" },
  { keywords: ["nitro", "discord nitro", "ডিসকর্ড নাইট্রো", "discord"], productSearchTerm: "nitro", displayName: "Discord Nitro", category: "entertainment" },

  // Office & Developer Tools
  { keywords: ["microsoft", "office", "office 365", "copilot", "অফিস", "ms office"], productSearchTerm: "microsoft", displayName: "Microsoft 365 & Copilot", category: "developer" },
  { keywords: ["replit", "রেপ্লিট", "replit core"], productSearchTerm: "replit", displayName: "Replit", category: "developer" },

  // Recognized Digital Services Currently NOT in Store
  { keywords: ["netflix", "net flix", "নেটফ্লিক্স", "নেট ফ্লিক্স"], productSearchTerm: "netflix", displayName: "Netflix", category: "entertainment" },
  { keywords: ["spotify", "স্পটিফাই"], productSearchTerm: "spotify", displayName: "Spotify", category: "entertainment" },
  { keywords: ["linkedin", "লিংকডইন"], productSearchTerm: "linkedin", displayName: "LinkedIn Premium", category: "developer" },
  { keywords: ["freepik", "ফ্রি পিক"], productSearchTerm: "freepik", displayName: "Freepik", category: "editing" },
  { keywords: ["surfshark", "সার্ফশার্ক"], productSearchTerm: "surfshark", displayName: "Surfshark VPN", category: "vpn" },
  { keywords: ["nordvpn", "nord vpn", "নর্ড ভিপিএন"], productSearchTerm: "nordvpn", displayName: "NordVPN", category: "vpn" },
  { keywords: ["coursera", "কোর্সসেরা"], productSearchTerm: "coursera", displayName: "Coursera", category: "education" },
  { keywords: ["skillshare", "স্কিলশেয়ার"], productSearchTerm: "skillshare", displayName: "Skillshare", category: "education" },
  { keywords: ["apple music", "apple tv", "অ্যাপল মিউজিক"], productSearchTerm: "apple", displayName: "Apple Music", category: "entertainment" },
  { keywords: ["turnitin", "টার্নিটিন"], productSearchTerm: "turnitin", displayName: "Turnitin", category: "education" },
  { keywords: ["disney", "disney+", "ডিজনি প্লাস"], productSearchTerm: "disney", displayName: "Disney+", category: "entertainment" },
  { keywords: ["deezer", "ডিজার"], productSearchTerm: "deezer", displayName: "Deezer", category: "entertainment" },
  { keywords: ["truecaller", "ট্রুকলার"], productSearchTerm: "truecaller", displayName: "Truecaller", category: "other" },
  { keywords: ["envato", "elements", "এনভাতো"], productSearchTerm: "envato", displayName: "Envato Elements", category: "editing" },
  { keywords: ["vps", "ভিপিএস", "rdp", "হোস্টিং", "hosting"], productSearchTerm: "vps", displayName: "VPS / RDP", category: "developer" },
  { keywords: ["github copilot", "github", "গিটহাব"], productSearchTerm: "github", displayName: "GitHub Copilot", category: "developer" },
  { keywords: ["jetbrains", "জেটব্রেনস"], productSearchTerm: "jetbrains", displayName: "JetBrains", category: "developer" },
  { keywords: ["shutterstock", "শাটারস্টক"], productSearchTerm: "shutterstock", displayName: "Shutterstock", category: "editing" },
];

/**
 * Main AI Engine for Smart Digital Hub Chatbot
 */
export const getSalesBotResponse = (
  userInput: string,
  liveProducts: ChatBotProduct[] = [],
  liveCategories: ChatBotCategory[] = []
): string => {
  const query = (userInput || "").toLowerCase().trim();
  const catalog = liveProducts && liveProducts.length > 0 ? liveProducts : DEFAULT_CATALOG;

  if (!query) {
    return "আসসালামু আলাইকুম! Smart Digital Hub-এ আপনাকে স্বাগতম। ✨ আপনার কী প্রয়োজন বা কোন প্রিমিয়াম সাবস্ক্রিপশনটি খুঁজছেন বলুন, আমি সাথে সাথে সাহায্য করছি!";
  }

  // ==========================================
  // 1. HUMOR, WITTY & CASUAL / EMOTIONAL INTENTS
  // ==========================================

  // "টাকা নাই" / "গরীব" / "taka nai" / "gorib"
  if (
    query.includes("taka nai") ||
    query.includes("টাকা নাই") ||
    query.includes("টাকা নেই") ||
    query.includes("টাকা নাই ভাই") ||
    query.includes("gorib") ||
    query.includes("গরিব") ||
    query.includes("গরীব") ||
    query.includes("fokir") ||
    query.includes("পকেট ফাকা") ||
    query.includes("পকেট ফাঁকা") ||
    query.includes("pocket faka")
  ) {
    return "আরে ভাইয়া! পকেটে টান তো আমাদের সবারই কম-বেশি থাকে! 😅 কোনো চিন্তা করবেন না। অফার যখনই আসুক বা বাজেট একটু ফ্রি হলেই তখন আমাদের থেকে সাবস্ক্রিপশনটি নিয়েন।\n\nআমরা তো সবসময় এখানেই আছি আপনার জন্য! ❤️ এছাড়া আমাদের ওয়েবসাইটে মাঝে মাঝেই দারুণ অফার ও কুপন ডিসকাউন্ট আসে, সাইটে নিয়মিত চোখ রাখতে পারেন!";
  }

  // "ফ্রিতে দিবা?" / "free te pawa jabe?" / "free diben"
  if (
    query.includes("free te") ||
    query.includes("ফ্রিতে") ||
    query.includes("ফ্রি তে") ||
    query.includes("free diben") ||
    query.includes("ফ্রি দিবা") ||
    query.includes("free pabo") ||
    query.includes("free te pawa")
  ) {
    return "ইশ ভাইয়া, সত্যি বলতে ফ্রিতে দিতে পারলে সবচেয়ে বেশি খুশি আমিই হতাম! 😄\n\nযেহেতু এগুলো ১০০% অফিশিয়াল ও পেইড প্রিমিয়াম সাবস্ক্রিপশন, তাই আমাদেরও অফিশিয়ালি পারচেজ করতে হয়। তবে আমরা চেষ্টা করি বাংলাদেশের সবচেয়ে কম মূল্যে এবং সেরা সার্ভিসের নিশ্চয়তা দিতে যাতে সবার সাধ্যের মধ্যে থাকে। 🤝 আপনার পছন্দের কোনো সাবস্ক্রিপশন লাগলে বলুন, সেরা প্রাইসটা জানিয়ে দিচ্ছি!";
  }

  // Romantic / Funny / Bot Identity questions ("bhalobasa diba", "tumi koto shundor", "manush naki bot")
  if (
    query.includes("valobasha") ||
    query.includes("ভালবাসা") ||
    query.includes("ভালোবাসা") ||
    query.includes("prem") ||
    query.includes("প্রেম") ||
    query.includes("biye") ||
    query.includes("বিয়ে") ||
    query.includes("shundor") ||
    query.includes("সুন্দর") ||
    query.includes("manush naki") ||
    query.includes("manush naki bot") ||
    query.includes("tumi ke") ||
    query.includes("তুমি কে") ||
    query.includes("রোবট")
  ) {
    return "আমি Smart Digital Hub-এর এআই সেলস ও সাপোর্ট অ্যাসিস্ট্যান্ট! 🤖✨\n\nরোবট হলেও মনটা কিন্তু খাঁটি মানুষের মতোই আন্তরিক আর ফ্রেন্ডলি! ❤️\nআপনার পড়াশোনা, বিনোদন বা ফ্রিল্যান্সিং কাজের জন্য কোন প্রিমিয়াম সাবস্ক্রিপশন লাগবে বলুন, চমৎকার সাপোর্ট দিয়ে মন জয় করে নেব ইনশাআল্লাহ!";
  }

  // ==========================================
  // 2. AFTER-SALES SERVICE & TRUST / COMPARISON
  // ==========================================
  if (
    query.includes("after sales") ||
    query.includes("after-sales") ||
    query.includes("আফটার সেলস") ||
    query.includes("service kemon") ||
    query.includes("সার্ভিস কেমন") ||
    query.includes("kno apnader") ||
    query.includes("kno kinbo") ||
    query.includes("কেন কিনব") ||
    query.includes("কেন তোমাদের") ||
    query.includes("scam") ||
    query.includes("স্ক্যাম") ||
    query.includes("trust") ||
    query.includes("বিশ্বাস") ||
    query.includes("trusted") ||
    query.includes("বিশ্বস্ত") ||
    query.includes("প্রতারণা")
  ) {
    return "Smart Digital Hub-এর আফটার সেলস সার্ভিস নিয়ে আপনি একদম ১০০% নিশ্চিন্ত থাকতে পারেন! কারণ:\n\n🛡️ **ফুল মেয়াদের গ্যারান্টিযুক্ত ওয়ারেন্টি:** সাবস্ক্রিপশন চলাকালীন যেকোনো সময় কোনো সমস্যা হলে আমরা সাথে সাথে ফিক্স অথবা ইনস্ট্যান্ট রিপ্লেসমেন্ট প্রদান করি।\n⚡ **সুপার ফাস্ট ডেলিভারি:** অর্ডার কনফার্মেশনের ৫ থেকে ৩০ মিনিটের মধ্যে আপনার ইমেইল ও ড্যাশবোর্ডে ডেলিভারি পৌঁছে যায়।\n🔐 **১০০% জেনুইন ও প্রাইভেট সার্ভিস:** সম্পূর্ণ লিগ্যাল ও নিজস্ব অ্যাকাউন্ট সুবিধা—কোনো হ্যাক বা ক্র্যাক অ্যাকাউন্ট দেওয়া হয় না।\n📞 **ডেডিকেটেড ২৪/৭ সাপোর্ট:** আমাদের লাইভ চ্যাট ছাড়াও যেকোনো প্রয়োজনে সরাসরি হোয়াটসঅ্যাপে (01516524644) রিয়েল হিউম্যান সাপোর্ট পাবেন।\n\nকাস্টমারের সন্তুষ্টিই আমাদের সবচেয়ে বড় অর্জন! একবার সার্ভিস নিয়ে দেখুন, নিরাশ হবেন না ইনশাআল্লাহ। ✨";
  }

  // ==========================================
  // 3. CATEGORY & MULTI-PRODUCT INQUIRIES
  // ==========================================

  // VPN category check
  const isVpnCategoryQuery = 
    query.includes("vpn") ||
    query.includes("ভিপিএন") ||
    query.includes("v p n");

  if (
    isVpnCategoryQuery && 
    (query.includes("ki ki") || query.includes("কী কী") || query.includes("available") || query.includes("list") || query.includes("ভিতরে") || query.includes("আসে") || query.includes("আছে") || query.includes("options") || query.includes("সকল"))
  ) {
    const vpnProducts = catalog.filter(p => {
      const name = p.name.toLowerCase();
      return name.includes("vpn") || name.includes("hma") || name.includes("ipvanish") || name.includes("mysterium") || name.includes("proton") || name.includes("norton") || name.includes("express");
    });

    const inStock = vpnProducts.filter(p => p.stock_status === "in_stock");
    const outStock = vpnProducts.filter(p => p.stock_status !== "in_stock");

    let text = "🛡️ **আমাদের VPN কালেকশন:**\n\n";

    if (inStock.length > 0) {
      text += "🟢 **বর্তমানে ইন-স্টকে যা যা এভেইলেবল আছে:**\n";
      text += inStock.map(p => `• **${p.name.trim()}** — মাত্র ৳${p.price} ⚡`).join("\n");
      text += "\n\n(আপনি এখনই ওয়েবসাইট থেকে সরাসরি 'Buy Now' বাটনে ক্লিক করে বিকাশ, নগদ বা রকেটে অর্ডার করতে পারেন)\n\n";
    }

    if (outStock.length > 0) {
      text += "⏳ **সাময়িকভাবে স্টক আউট (শীঘ্রই রিস্টক হবে):**\n";
      text += outStock.map(p => `• ${p.name.trim()}`).join("\n");
      text += "\n\nস্টক আউট কোনো ভিপিএন লাগলে আমাদের হোয়াটসঅ্যাপে (01516524644) জানিয়ে রাখতে পারেন, স্টক আসা মাত্রই আপনাকে নোটিফাই করা হবে! 😊";
    }

    return text.trim();
  }

  // AI Tools category check
  const isAiCategoryQuery =
    query.includes("ai tool") ||
    query.includes("ai tools") ||
    query.includes("এআই") ||
    query.includes("ai") ||
    query.includes("artificial intelligence");

  if (
    isAiCategoryQuery &&
    (query.includes("ki ki") || query.includes("কী কী") || query.includes("available") || query.includes("list") || query.includes("ভিতরে") || query.includes("আছে") || query.includes("সকল") || query.includes("এভেইলেবল"))
  ) {
    const aiProducts = catalog.filter(p => {
      const name = p.name.toLowerCase();
      return name.includes("ai") || name.includes("chatgpt") || name.includes("claude") || name.includes("gemini") || name.includes("midjourney") || name.includes("perplexity") || name.includes("leonardo") || name.includes("hegen") || name.includes("copilot");
    });

    const inStock = aiProducts.filter(p => p.stock_status === "in_stock");
    const outStock = aiProducts.filter(p => p.stock_status !== "in_stock");

    let text = "🤖 **আমাদের AI Tools কালেকশন:**\n\n";

    if (inStock.length > 0) {
      text += "🟢 **বর্তমানে ইন-স্টকে আছে:**\n";
      text += inStock.map(p => `• **${p.name.trim()}** — মাত্র ৳${p.price} ⚡`).join("\n");
      text += "\n\n(ওয়েবসাইটে 'Buy Now' ক্লিক করে সরাসরি অর্ডার করতে পারেন)\n\n";
    }

    if (outStock.length > 0) {
      text += "⏳ **স্টক আউট / আপকামিং এআই টুলস:**\n";
      text += outStock.map(p => `• ${p.name.trim()} (৳${p.price})`).join("\n");
      text += "\n\nএগুলোর নতুন স্টক আসার সাথে সাথে ওয়েবসাইটে আপডেট পাবেন বা হোয়াটসঅ্যাপে জানিয়ে রাখতে পারেন!";
    }

    return text.trim();
  }

  // Education / Learning Tools check
  if (
    (query.includes("education") || query.includes("লার্নিং") || query.includes("study") || query.includes("পড়াশোনা") || query.includes("student")) &&
    (query.includes("ki ki") || query.includes("কী কী") || query.includes("available") || query.includes("আছে"))
  ) {
    const eduProducts = catalog.filter(p => {
      const name = p.name.toLowerCase();
      return name.includes("duolingo") || name.includes("grammarly") || name.includes("quillbot") || name.includes("camscanner") || name.includes("ilovepdf");
    });

    const inStock = eduProducts.filter(p => p.stock_status === "in_stock");
    const outStock = eduProducts.filter(p => p.stock_status !== "in_stock");

    let text = "📚 **এডুকেশন ও স্টাডি টুলস কালেকশন:**\n\n";
    if (inStock.length > 0) {
      text += "🟢 **ইন-স্টক:**\n";
      text += inStock.map(p => `• **${p.name.trim()}** — ৳${p.price}`).join("\n");
      text += "\n\n";
    }
    if (outStock.length > 0) {
      text += "⏳ **স্টক আউট:**\n";
      text += outStock.map(p => `• ${p.name.trim()}`).join("\n");
    }
    return text.trim();
  }

  // Video / Photo Editing Tools check
  if (
    (query.includes("editing") || query.includes("design") || query.includes("এডিটিং") || query.includes("ডিজাইন")) &&
    (query.includes("ki ki") || query.includes("কী কী") || query.includes("available") || query.includes("আছে"))
  ) {
    const editProducts = catalog.filter(p => {
      const name = p.name.toLowerCase();
      return name.includes("canva") || name.includes("capcut") || name.includes("adobe") || name.includes("leonardo");
    });

    const inStock = editProducts.filter(p => p.stock_status === "in_stock");
    const outStock = editProducts.filter(p => p.stock_status !== "in_stock");

    let text = "🎨 **ডিজাইন ও ভিডিও এডিটিং টুলস কালেকশন:**\n\n";
    if (inStock.length > 0) {
      text += "🟢 **ইন-স্টক:**\n";
      text += inStock.map(p => `• **${p.name.trim()}** — মাত্র ৳${p.price}`).join("\n");
      text += "\n\n";
    }
    if (outStock.length > 0) {
      text += "⏳ **আপকামিং / স্টক আউট:**\n";
      text += outStock.map(p => `• ${p.name.trim()}`).join("\n");
    }
    return text.trim();
  }

  // Entertainment / OTT check
  if (
    (query.includes("ott") || query.includes("entertainment") || query.includes("movie") || query.includes("গান") || query.includes("নাটক") || query.includes("সিনেমা")) &&
    (query.includes("ki ki") || query.includes("কী কী") || query.includes("available") || query.includes("আছে"))
  ) {
    const entProducts = catalog.filter(p => {
      const name = p.name.toLowerCase();
      return name.includes("youtube") || name.includes("prime") || name.includes("crunchyroll") || name.includes("sonyliv") || name.includes("hbo");
    });

    const inStock = entProducts.filter(p => p.stock_status === "in_stock");
    const outStock = entProducts.filter(p => p.stock_status !== "in_stock");

    let text = "🍿 **বিনোদন ও ওটিটি (OTT) সাবস্ক্রিপশন:**\n\n";
    if (inStock.length > 0) {
      text += "🟢 **ইন-স্টক:**\n";
      text += inStock.map(p => `• **${p.name.trim()}** — মাত্র ৳${p.price}`).join("\n");
      text += "\n\n";
    }
    if (outStock.length > 0) {
      text += "⏳ **স্টক আউট:**\n";
      text += outStock.map(p => `• ${p.name.trim()}`).join("\n");
    }
    return text.trim();
  }

  // ==========================================
  // 4. SPECIFIC PRODUCT INQUIRIES (Dictionary & Fuzzy Match)
  // ==========================================
  for (const item of PRODUCT_DICTIONARY) {
    const isMentioned = item.keywords.some(k => query.includes(k));
    if (isMentioned) {
      // Find matching item in current catalog
      const matched = catalog.find(p => 
        p.name.toLowerCase().trim().includes(item.productSearchTerm) ||
        (p.slug && p.slug.toLowerCase().includes(item.productSearchTerm))
      );

      if (matched) {
        const isInStock = matched.stock_status === "in_stock";
        const price = `৳${matched.price}`;

        if (isInStock) {
          return `হ্যাঁ ভাইয়া! 😊 আমাদের **${matched.name.trim()}** বর্তমানে স্টকে সম্পূর্ণ এভেইলেবল আছে।\n\n💰 মূল্য: মাত্র ${price}\n⚡ ডেলিভারি: ৫-৩০ মিনিট (ইনস্ট্যান্ট)\n🛡️ সুবিধা: ফুল মেয়াদের রিপ্লেসমেন্ট ওয়ারেন্টি\n\nআপনি খুব সহজেই আমাদের ওয়েবসাইট থেকে সরাসরি 'Buy Now' বাটনে ক্লিক করে বিকাশ, নগদ বা রকেটে অর্ডার সম্পন্ন করতে পারেন। কোনো প্রশ্ন থাকলে আমাকে জানাতে পারেন!`;
        } else {
          return `না ভাইয়া, দুঃখিত! 😔 আমাদের **${matched.name.trim()}** প্রোডাক্টটি বর্তমানে সাময়িকভাবে **স্টক আউট** আছে।\n\nআমাদের টিম দ্রুত নতুন স্টক আনার জন্য কাজ করছে। নতুন স্টক আসামাত্রই ওয়েবসাইটে দেখতে পাবেন অথবা আমাদের হোয়াটসঅ্যাপে (01516524644) একটু জানিয়ে রাখুন, রিস্টক হওয়ার সাথে সাথে আপনাকে মেসেজ দিয়ে জানিয়ে দেওয়া হবে।`;
        }
      } else {
        // Product recognized (e.g. Netflix, Spotify, Surfshark) but NOT sold on our website
        return `না ভাইয়া, আন্তরিকভাবে দুঃখিত! 😔 এই মুহূর্তে আমাদের ওয়েবসাইটে **${item.displayName}** সার্ভিসটি নেই।\n\nপরবর্তীতে যদি এটি আমাদের ওয়েবসাইটে বা পেজে এভেইলেবল করা হয়, তবে অবশ্যই ওয়েবসাইটের মাধ্যমে জানতে পারবেন। আমাদের ওয়েবসাইটে থাকা অন্যান্য জনপ্রিয় টুলগুলো দেখতে পারেন!`;
      }
    }
  }

  // Direct Fuzzy match on database product names
  for (const prod of catalog) {
    const cleanProdName = prod.name.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
    if (cleanProdName.length > 3 && query.replace(/[^a-z0-9]/g, "").includes(cleanProdName)) {
      const isInStock = prod.stock_status === "in_stock";
      const price = `৳${prod.price}`;

      if (isInStock) {
        return `হ্যাঁ ভাইয়া! 😊 আমাদের **${prod.name.trim()}** বর্তমানে স্টকে সম্পূর্ণ এভেইলেবল আছে।\n\n💰 মূল্য: মাত্র ${price}\n⚡ ডেলিভারি: ৫-৩০ মিনিট\n🛡️ ওয়ারেন্টি: ফুল রিপ্লেসমেন্ট সাপোর্ট\n\nওয়েবসাইটে 'Buy Now' ক্লিক করে বিকাশ, নগদ বা রকেটে সাথে সাথেই নিয়ে নিতে পারেন!`;
      } else {
        return `না ভাইয়া, দুঃখিত! 😔 আমাদের **${prod.name.trim()}** প্রোডাক্টটি বর্তমানে সাময়িকভাবে **স্টক আউট** আছে। খুব শীঘ্রই আবার রিস্টক করা হবে।`;
      }
    }
  }

  // ==========================================
  // 5. GREETINGS & SALAM
  // ==========================================
  if (
    query === "hi" ||
    query === "hello" ||
    query === "hey" ||
    query === "salam" ||
    query === "assalamu alaikum" ||
    query.includes("সালাম") ||
    query.includes("হাই") ||
    query.includes("হ্যালো") ||
    query.includes("kemon achen") ||
    query.includes("কেমন আছেন") ||
    query.includes("valo achen") ||
    query.includes("bhai") ||
    query.includes("vai") ||
    query.includes("ভাই") ||
    query.includes("boss") ||
    query.includes("বস")
  ) {
    return "ওয়ালাইকুম আসসালাম! Smart Digital Hub-এ আপনাকে স্বাগতম। 🌟\n\nআলহামদুলিল্লাহ আমরা ভালো আছি। আপনার জন্য কী করতে পারি বলুন? কোন সাবস্ক্রিপশন বা সার্ভিসের দাম ও স্টক স্ট্যাটাস জানতে চান? নাম লিখলেই আমি বিস্তারিত জানিয়ে দিচ্ছি! 😊";
  }

  // ==========================================
  // 6. GENERAL STOCK OVERVIEW (কী কী আছে / স্টক কি কি?)
  // ==========================================
  if (
    query.includes("stock") ||
    query.includes("স্টক") ||
    query.includes("available") ||
    query.includes("এভেইলেবল") ||
    query.includes("কি কি আছে") ||
    query.includes("কী কী আছে") ||
    query.includes("ki ki ache") ||
    query.includes("all product") ||
    query.includes("সব প্রোডাক্ট")
  ) {
    const inStock = catalog.filter(p => p.stock_status === "in_stock");
    const inStockList = inStock.slice(0, 8).map(p => `• **${p.name.trim()}** — ৳${p.price}`).join("\n");

    return `আমাদের ওয়েবসাইটে বর্তমানে এই জনপ্রিয় প্রোডাক্টগুলো **ইন-স্টক** এভেইলেবল আছে:\n\n${inStockList}\n\n👉 এছাড়া ওয়েবসাইট স্ক্রল করে সম্পূর্ণ তালিকা দেখতে পারেন। আপনার যেটি পছন্দ, সরাসরি 'Buy Now' বাটনে ক্লিক করে মুহূর্তেই অর্ডার করে নিতে পারেন!`;
  }

  // ==========================================
  // 7. HOW TO BUY / ORDER PROCESS
  // ==========================================
  if (
    query.includes("order") ||
    query.includes("kinbo") ||
    query.includes("কিনব") ||
    query.includes("অর্ডার") ||
    query.includes("how to buy") ||
    query.includes("process") ||
    query.includes("kivabe") ||
    query.includes("কিভাবে") ||
    query.includes("নিয়ম") ||
    query.includes("পদ্ধতি")
  ) {
    return "অর্ডার করার নিয়ম একদম সহজ ও দ্রুত:\n\n১️⃣ ওয়েবসাইট থেকে আপনার পছন্দের প্রোডাক্টটির **'Buy Now'** বাটনে ক্লিক করুন।\n২️⃣ আপনার নাম, ফোন নম্বর ও ডেলিভারি ইমেইল দিন।\n৩️⃣ বিকাশ, নগদ বা রকেটের মাধ্যমে পেমেন্ট সম্পন্ন করে TrxID দিন।\n\n⚡ পেমেন্ট সম্পন্ন হওয়ার ৫-৩০ মিনিটের মধ্যে আপনার ইমেইল ও 'My Orders' ড্যাশবোর্ডে অ্যাকাউন্টের অ্যাক্সেস পেয়ে যাবেন। কোনো সমস্যা হলে আমাদের হোয়াটসঅ্যাপেও নক দিতে পারেন!";
  }

  // ==========================================
  // 8. PAYMENT METHODS
  // ==========================================
  if (
    query.includes("bkash") ||
    query.includes("nagad") ||
    query.includes("rocket") ||
    query.includes("payment") ||
    query.includes("বিকাশ") ||
    query.includes("নগদ") ||
    query.includes("রকেট") ||
    query.includes("পেমেন্ট") ||
    query.includes("টাকা পাঠাব") ||
    query.includes("পেমেন্ট মেথড")
  ) {
    return "💳 **পেমেন্ট মাধ্যমসমূহ:**\n\nআমরা বাংলাদেশে **বিকাশ (bKash)**, **নগদ (Nagad)** এবং **রকেট (Rocket)** পেমেন্ট সাপোর্ট করি।\n\nচেকআউট পেজে পার্সোনাল/মার্চেন্ট নম্বর পেয়ে যাবেন এবং সহজেই পেমেন্ট করে ট্রানজেকশন আইডি (TrxID) দিয়ে অর্ডার কমপ্লিট করতে পারবেন।";
  }

  // ==========================================
  // 9. DELIVERY SPEED & TIME
  // ==========================================
  if (
    query.includes("delivery") ||
    query.includes("ডেলিভারি") ||
    query.includes("koto somoy") ||
    query.includes("koto khon") ||
    query.includes("কতক্ষণ") ||
    query.includes("কখন পাব") ||
    query.includes("kokhon pabo")
  ) {
    return "⚡ **সুপার ফাস্ট ডেলিভারি:**\n\nঅর্ডার ও পেমেন্ট কনফার্ম হওয়ার পর সাধারণত **৫ থেকে ৩০ মিনিটের মধ্যে** আপনার ইমেইল এবং আমাদের ওয়েবসাইটের 'My Orders' পেজে লগইন অ্যাক্সেস / সাবস্ক্রিপশন ডেলিভারি হয়ে যায়!";
  }

  // ==========================================
  // 10. WARRANTY, REPLACEMENT & GUARANTEE
  // ==========================================
  if (
    query.includes("warranty") ||
    query.includes("guarantee") ||
    query.includes("ওয়ারেন্টি") ||
    query.includes("গ্যারান্টি") ||
    query.includes("সমস্যা হলে") ||
    query.includes("নষ্ট হলে") ||
    query.includes("replace") ||
    query.includes("রিপ্লেস")
  ) {
    return "🛡️ **ফুল মেয়াদ রিপ্লেসমেন্ট ওয়ারেন্টি:**\n\nSmart Digital Hub-এর প্রতিটি সাবস্ক্রিপশনের সাথে সম্পূর্ণ মেয়াদের অফিশিয়াল রিপ্লেসমেন্ট ওয়ারেন্টি থাকে। যদি মেয়াদের মধ্যে কখনো কোনো টেকনিক্যাল সমস্যা দেখা দেয়, আমাদের হোয়াটসঅ্যাপে (01516524644) জানালেই তাৎক্ষণিক সমাধান বা ফুল রিপ্লেসমেন্ট দেওয়া হয়!";
  }

  // ==========================================
  // 11. DISCOUNTS, COUPONS & SALAMI
  // ==========================================
  if (
    query.includes("discount") ||
    query.includes("ডিসকাউন্ট") ||
    query.includes("coupon") ||
    query.includes("কুপন") ||
    query.includes("salami") ||
    query.includes("সালামি") ||
    query.includes("ছাড়") ||
    query.includes("কম রাখা যাবে")
  ) {
    return "🎁 **স্পেশাল অফার ও কুপন:**\n\nআমাদের ওয়েবসাইটে সবসময়ই সবচেয়ে সাশ্রয়ী মূল্য নির্ধারণ করা থাকে। এছাড়া বিশেষ অফার বা কুপন কোড থাকলে চেকআউট পেজে 'Apply Coupon' বক্সে কোড বসিয়ে সাথে সাথেই অতিরিক্ত ছাড় উপভোগ করতে পারবেন! এছাড়া আমাদের সালামি সেকশন থেকেও লাকি ডিসকাউন্ট নিতে পারেন!";
  }

  // ==========================================
  // 12. HUMAN / ADMIN / WHATSAPP CONTACT
  // ==========================================
  if (
    query.includes("admin") ||
    query.includes("এডমিন") ||
    query.includes("agent") ||
    query.includes("human") ||
    query.includes("manush") ||
    query.includes("মানুষের সাথে") ||
    query.includes("কথা বলব") ||
    query.includes("whatsapp") ||
    query.includes("হোয়াটসঅ্যাপ") ||
    query.includes("number") ||
    query.includes("নম্বর") ||
    query.includes("help") ||
    query.includes("যোগাযোগ")
  ) {
    return "📞 **সরাসরি আমাদের টিমের সাথে কথা বলতে:**\n\n• **WhatsApp:** [01516524644](https://wa.me/8801516524644)\n• **মোবাইল কল:** 01516524644\n• **সাপোর্ট টাইম:** সকাল ১০টা থেকে রাত ১২টা (যেকোনো প্রয়োজনে মেসেজ দিয়ে রাখুন)";
  }

  // ==========================================
  // 13. THANKS & FAREWELL
  // ==========================================
  if (
    query.includes("thanks") ||
    query.includes("thank you") ||
    query.includes("dhonnobad") ||
    query.includes("ধন্যবাদ") ||
    query.includes("shukriya") ||
    query.includes("থ্যাংকস")
  ) {
    return "অনেক অনেক ধন্যবাদ ভাইয়া! ❤️ আপনার যেকোনো প্রয়োজনে Smart Digital Hub সবসময় পাশে আছে। দিনটি আপনার খুব সুন্দর ও ফলপ্রসূ কাটুক! 🌟";
  }

  if (
    query.includes("bye") ||
    query.includes("allah hafez") ||
    query.includes("আল্লাহ হাফেজ") ||
    query.includes("বিদায়") ||
    query.includes("pore kotha hobe")
  ) {
    return "আল্লাহ হাফেজ ভাইয়া! ভালো থাকবেন। ভবিষ্যতে যেকোনো সাবস্ক্রিপশন বা সাপোর্টের জন্য আবার চলে আসবেন Smart Digital Hub-এ! 👋✨";
  }

  // ==========================================
  // 14. POLITE, CONVERSATIONAL DEFAULT FALLBACK
  // ==========================================
  return "ধন্যবাদ আপনার বার্তার জন্য! 😊\n\nআপনি যে ডিজিটাল সাবস্ক্রিপশনটি নিতে চান সেটির নাম বা বিভাগ (যেমন: Canva, YouTube, Duolingo, VPN, AI Tools ইত্যাদি) লিখে মেসেজ দিন। আমি সাথে সাথে দাম ও স্টক স্ট্যাটাস জানিয়ে অর্ডার করতে সাহায্য করব!";
};

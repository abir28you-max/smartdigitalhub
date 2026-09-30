/**
 * Smart Digital Hub - Intelligent Sales & Live Inventory Chatbot
 */

export interface ChatBotProduct {
  id?: string;
  name: string;
  price: number;
  stock_status: string;
  short_description?: string | null;
  slug?: string | null;
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

// Product name / keyword mapping
interface KeywordMapping {
  keywords: string[];
  productSearchTerm: string;
  displayName: string;
}

const PRODUCT_DICTIONARY: KeywordMapping[] = [
  { keywords: ["canva", "ক্যানভা", "canva pro"], productSearchTerm: "canva", displayName: "Canva Pro" },
  { keywords: ["youtube", "ইউটিউব", "yt", "yt premium", "youtube premium"], productSearchTerm: "youtube", displayName: "YouTube Premium" },
  { keywords: ["duolingo", "ডুওলিঙ্গো", "duolingo super", "duolingo max"], productSearchTerm: "duolingo", displayName: "Duolingo" },
  { keywords: ["capcut", "ক্যাপকাট", "capcut pro"], productSearchTerm: "capcut", displayName: "CapCut Pro" },
  { keywords: ["gemini", "জেমিনি", "google gemini", "gemini ai"], productSearchTerm: "gemini", displayName: "Gemini AI" },
  { keywords: ["prime", "prime video", "প্রাইম", "প্রাইম ভিডিও", "amazon prime"], productSearchTerm: "prime", displayName: "Amazon Prime Video" },
  { keywords: ["crunchyroll", "ক্রাঞ্চিরোল", "anime"], productSearchTerm: "cruchyroll", displayName: "Crunchyroll" },
  { keywords: ["express vpn", "expressvpn", "এক্সপ্রেস ভিপিএন"], productSearchTerm: "express", displayName: "Express VPN" },
  { keywords: ["hma", "hma vpn"], productSearchTerm: "hma", displayName: "HMA VPN" },
  { keywords: ["chatgpt", "chat gpt", "gpt 4", "gpt-4", "gpt4", "openai", "open ai", "চ্যাটজিপিটি"], productSearchTerm: "chatgpt", displayName: "ChatGPT Plus" },
  { keywords: ["claude", "claude ai", "ক্লদ"], productSearchTerm: "claude", displayName: "Claude AI" },
  { keywords: ["midjourney", "মিডজার্নি"], productSearchTerm: "midjourney", displayName: "Midjourney" },
  { keywords: ["grammarly", "গ্রামারলি"], productSearchTerm: "grammarly", displayName: "Grammarly" },
  { keywords: ["quillbot", "কুইলবট"], productSearchTerm: "quillbot", displayName: "QuillBot" },
  { keywords: ["perplexity", "পারপ্লেক্সিটি"], productSearchTerm: "perplexity", displayName: "Perplexity AI" },
  { keywords: ["adobe", "অ্যাডোবি", "photoshop", "creative cloud"], productSearchTerm: "adobe", displayName: "Adobe Creative Cloud" },
  { keywords: ["leonardo", "লিওনার্দো"], productSearchTerm: "leonardo", displayName: "Leonardo AI" },
  { keywords: ["microsoft", "office", "office 365", "copilot", "অফিস"], productSearchTerm: "microsoft", displayName: "Microsoft 365 & Copilot" },
  { keywords: ["replit", "রেপ্লিট"], productSearchTerm: "replit", displayName: "Replit" },
  { keywords: ["sonyliv", "সনি লিভ"], productSearchTerm: "sonyliv", displayName: "SonyLiv" },
  { keywords: ["camscanner", "ক্যামস্ক্যানার"], productSearchTerm: "camscanner", displayName: "CamScanner" },
  { keywords: ["ilovepdf", "আইলাভপিডিএফ"], productSearchTerm: "ilovepdf", displayName: "iLovePDF" },
  { keywords: ["norton", "নর্ডন ভিপিএন"], productSearchTerm: "norton", displayName: "Norton VPN" },
  { keywords: ["proton", "প্রোটন ভিপিএন"], productSearchTerm: "proton", displayName: "Proton VPN" },
  { keywords: ["ipvanish", "আইপিভ্যানিশ"], productSearchTerm: "ipvanish", displayName: "IPVanish" },
  { keywords: ["mysterium", "মিস্টেরিয়াম"], productSearchTerm: "mysterium", displayName: "Mysterium VPN" },
  { keywords: ["hbomax", "hbo max", "hbo", "এইচবিও"], productSearchTerm: "hbo", displayName: "HBO Max" },
  { keywords: ["nitro", "discord nitro", "ডিসকর্ড নাইট্রো"], productSearchTerm: "nitro", displayName: "Discord Nitro" },
  { keywords: ["hegen", "হেগেন"], productSearchTerm: "hegen", displayName: "Hegen AI" },

  // Products NOT in catalog (known digital services)
  { keywords: ["netflix", "net flix", "নেটফ্লিক্স", "নেট ফ্লিক্স"], productSearchTerm: "netflix", displayName: "Netflix" },
  { keywords: ["spotify", "স্পটিফাই"], productSearchTerm: "spotify", displayName: "Spotify" },
  { keywords: ["linkedin", "লিংকডইন"], productSearchTerm: "linkedin", displayName: "LinkedIn Premium" },
  { keywords: ["freepik", "ফ্রি পিক"], productSearchTerm: "freepik", displayName: "Freepik" },
  { keywords: ["surfshark", "সার্ফশার্ক"], productSearchTerm: "surfshark", displayName: "Surfshark VPN" },
  { keywords: ["nordvpn", "nord vpn", "নর্ড ভিপিএন"], productSearchTerm: "nordvpn", displayName: "NordVPN" },
  { keywords: ["coursera", "কোর্সসেরা"], productSearchTerm: "coursera", displayName: "Coursera" },
  { keywords: ["skillshare", "স্কিলশেয়ার"], productSearchTerm: "skillshare", displayName: "Skillshare" },
  { keywords: ["apple music", "apple tv", "অ্যাপল মিউজিক"], productSearchTerm: "apple", displayName: "Apple Music" },
  { keywords: ["turnitin", "টার্নিটিন"], productSearchTerm: "turnitin", displayName: "Turnitin" },
  { keywords: ["disney", "disney+", "ডিজনি প্লাস"], productSearchTerm: "disney", displayName: "Disney+" },
  { keywords: ["deezer", "ডিজার"], productSearchTerm: "deezer", displayName: "Deezer" },
  { keywords: ["truecaller", "ট্রুকলার"], productSearchTerm: "truecaller", displayName: "Truecaller" },
  { keywords: ["envato", "elements", "এনভাতো"], productSearchTerm: "envato", displayName: "Envato Elements" },
];

export const getSalesBotResponse = (userInput: string, liveProducts: ChatBotProduct[] = []): string => {
  const query = (userInput || "").toLowerCase().trim();

  // Merge live products with default catalog fallback
  const catalog = liveProducts && liveProducts.length > 0 ? liveProducts : DEFAULT_CATALOG;

  // 1. CHECK IF USER IS ASKING ABOUT A PRODUCT
  for (const item of PRODUCT_DICTIONARY) {
    const isMentioned = item.keywords.some(k => query.includes(k));
    if (isMentioned) {
      // Find matching item in catalog
      const matched = catalog.find(p => 
        p.name.toLowerCase().trim().includes(item.productSearchTerm) ||
        (p.slug && p.slug.toLowerCase().includes(item.productSearchTerm))
      );

      if (matched) {
        const isInStock = matched.stock_status === "in_stock";
        const price = `৳${matched.price}`;

        if (isInStock) {
          return `হ্যাঁ ভাইয়া! 😊 আমাদের **${matched.name.trim()}** বর্তমানে স্টকে এভেইলেবল আছে।\n\n💰 মূল্য: মাত্র ${price}\n⚡ ডেলিভারি: ৫-৩০ মিনিট\n\nআপনি খুব সহজেই আমাদের ওয়েবসাইট থেকে সরাসরি 'Buy Now' বাটনে ক্লিক করে বিকাশ, নগদ বা রকেটে অর্ডার সম্পন্ন করতে পারেন।`;
        } else {
          return `না ভাইয়া, দুঃখিত! 😔 আমাদের **${matched.name.trim()}** প্রোডাক্টটি বর্তমানে সাময়িকভাবে **স্টক আউট** আছে।\n\nআমাদের টিম দ্রুত নতুন স্টক আনার জন্য কাজ করছে। স্টক আসার সাথে সাথে আমাদের ওয়েবসাইটে দেখতে পাবেন অথবা আমাদের হোয়াটসঅ্যাপে (01516524644) একটু মেসেজ দিয়ে রাখুন, রিস্টক হওয়ার সাথে সাথে আপনাকে জানিয়ে দেওয়া হবে।`;
        }
      } else {
        // Product recognized but NOT available on our website
        return `না ভাইয়া, দুঃখিত! 😔 এই মুহূর্তে আমাদের ওয়েবসাইটে **${item.displayName}** প্রোডাক্টটি নেই।\n\nপরবর্তীতে যদি এটি আমাদের ওয়েবসাইটে বা পেজে এভেইলেবল করা হয়, তবে অবশ্যই ওয়েবসাইটের মাধ্যমে জানতে পারবেন।`;
      }
    }
  }

  // 2. CHECK DIRECT PRODUCT NAME IN CATALOG (Fuzzy Match)
  for (const prod of catalog) {
    const cleanProdName = prod.name.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
    if (cleanProdName.length > 3 && query.replace(/[^a-z0-9]/g, "").includes(cleanProdName)) {
      const isInStock = prod.stock_status === "in_stock";
      const price = `৳${prod.price}`;

      if (isInStock) {
        return `হ্যাঁ ভাইয়া! 😊 আমাদের **${prod.name.trim()}** বর্তমানে স্টকে এভেইলেবল আছে।\n\n💰 মূল্য: মাত্র ${price}\n⚡ ডেলিভারি: ৫-৩০ মিনিট\n\nওয়েবসাইট থেকে সরাসরি 'Buy Now' ক্লিক করে অর্ডার করে নিতে পারবেন।`;
      } else {
        return `না ভাইয়া, দুঃখিত! 😔 আমাদের **${prod.name.trim()}** প্রোডাক্টটি বর্তমানে সাময়িকভাবে **স্টক আউট** আছে। নতুন স্টক আসার সাথে সাথে ওয়েবসাইটে আপডেট পাবেন।`;
      }
    }
  }

  // 3. GREETINGS (Hi, Hello, Salam, etc.)
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
    query.includes("bhai") ||
    query.includes("vai") ||
    query.includes("ভাই") ||
    query.includes("boss") ||
    query.includes("বস")
  ) {
    return "আসসালামু আলাইকুম! Smart Digital Hub-এ আপনাকে স্বাগতম। 🌟\n\nআমরা আলহামদুলিল্লাহ ভালো আছি। আপনার কোন প্রিমিয়াম সাবস্ক্রিপশন বা সার্ভিসের প্রয়োজন? প্রোডাক্টের নাম লিখলেই আমি দাম ও স্টক স্ট্যাটাস জানিয়ে দেব। 😊";
  }

  // 4. GENERAL STOCK INQUIRY (কী কী আছে / স্টক কি কি?)
  if (
    query.includes("stock") ||
    query.includes("স্টক") ||
    query.includes("available") ||
    query.includes("এভেইলেবল") ||
    query.includes("কি কি আছে") ||
    query.includes("কী কী আছে")
  ) {
    const inStock = catalog.filter(p => p.stock_status === "in_stock").slice(0, 6);
    const inStockList = inStock.map(p => `• ${p.name.trim()} - ৳${p.price}`).join("\n");

    return `আমাদের ওয়েবসাইটে বর্তমানে এই প্রোডাক্টগুলো ইন স্টক এভেইলেবল আছে:\n\n${inStockList}\n\nআপনার পছন্দের প্রোডাক্টটি সিলেক্ট করে সরাসরি অর্ডার করতে পারেন!`;
  }

  // 5. HOW TO BUY / ORDER PROCESS
  if (
    query.includes("order") ||
    query.includes("kinbo") ||
    query.includes("কিনব") ||
    query.includes("অর্ডার") ||
    query.includes("how to buy") ||
    query.includes("process") ||
    query.includes("kivabe") ||
    query.includes("কিভাবে") ||
    query.includes("নিয়ম")
  ) {
    return "অর্ডার করার নিয়ম খুবই সহজ:\n\n১️⃣ ওয়েবসাইট থেকে প্রোডাক্টের 'Buy Now' বাটনে ক্লিক করুন।\n২️⃣ আপনার নাম, ফোন ও ডেলিভারি ইমেইল দিন।\n৩️⃣ বিকাশ, নগদ বা রকেটে পেমেন্ট সম্পন্ন করে TrxID দিন।\n\nকিছুক্ষণের মধ্যেই আপনার ইমেইল ও ড্যাশবোর্ডে ডেলিভারি পেয়ে যাবেন।";
  }

  // 6. PAYMENT METHODS
  if (
    query.includes("bkash") ||
    query.includes("nagad") ||
    query.includes("rocket") ||
    query.includes("payment") ||
    query.includes("বিকাশ") ||
    query.includes("নগদ") ||
    query.includes("রকেট") ||
    query.includes("পেমেন্ট") ||
    query.includes("টাকা")
  ) {
    return "💳 আমরা বিকাশ (bKash), নগদ (Nagad) এবং রকেট (Rocket) পেমেন্ট সাপোর্ট করি। চেকআউট পেজে নম্বর পেয়ে যাবেন।";
  }

  // 7. DELIVERY SPEED
  if (
    query.includes("delivery") ||
    query.includes("ডেলিভারি") ||
    query.includes("koto somoy") ||
    query.includes("koto khon") ||
    query.includes("কতক্ষণ")
  ) {
    return "⚡ পেমেন্ট সম্পন্ন হওয়ার ৫ থেকে ৩০ মিনিটের মধ্যে আপনার অ্যাকাউন্টের ডেলিভারি ডিটেইলস ইমেইল ও 'My Orders' পেজে পেয়ে যাবেন।";
  }

  // 8. WARRANTY
  if (
    query.includes("warranty") ||
    query.includes("guarantee") ||
    query.includes("ওয়ারেন্টি") ||
    query.includes("গ্যারান্টি") ||
    query.includes("সমস্যা") ||
    query.includes("replace")
  ) {
    return "🛡️ প্রতিটি প্রোডাক্টের সাথে পুরো মেয়াদের রিপ্লেসমেন্ট ওয়ারেন্টি থাকে। কোনো সমস্যা হলে আমাদের হোয়াটসঅ্যাপে জানালে সাথে সাথে সমাধান দেওয়া হয়।";
  }

  // 9. WHATSAPP / CONTACT
  if (
    query.includes("admin") ||
    query.includes("agent") ||
    query.includes("human") ||
    query.includes("কথা") ||
    query.includes("whatsapp") ||
    query.includes("হোয়াটসঅ্যাপ") ||
    query.includes("number")
  ) {
    return "📞 আমাদের হোয়াটসঅ্যাপে সরাসরি যোগাযোগ করতে পারেন:\nWhatsApp: 01516524644 (https://wa.me/8801516524644)\nকল: 01516524644";
  }

  // 10. DEFAULT FALLBACK
  return "ধন্যবাদ আপনার বার্তার জন্য! 😊\n\nআপনি যে সাবস্ক্রিপশনটি নিতে চান সেটির নাম লিখে মেসেজ দিন (যেমন: Canva, YouTube, Duolingo, ChatGPT ইত্যাদি)। আমি সাথে সাথে দাম ও স্টক স্ট্যাটাস জানিয়ে দিচ্ছি।";
};

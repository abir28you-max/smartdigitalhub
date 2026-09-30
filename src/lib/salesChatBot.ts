/**
 * Smart Digital Hub - AI Sales & Support Chatbot Engine
 * Dynamic Product-Aware, Human-like, Engaging & Conversion-Optimized
 */

export interface ChatBotProduct {
  id?: string;
  name: string;
  price: number;
  stock_status: string;
  short_description?: string | null;
  slug?: string | null;
}

// Popular aliases dictionary to recognize digital products from user query
const PRODUCT_ALIASES: Record<string, string[]> = {
  chatgpt: ["chatgpt", "chat gpt", "gpt4", "gpt-4", "gpt 4", "openai", "open ai", "চ্যাটজিপিটি"],
  canva: ["canva", "canva pro", "ক্যানভা", "ক্যানভা প্রো"],
  netflix: ["netflix", "net flix", "নেটফ্লিক্স", "নেট ফ্লিক্স"],
  youtube: ["youtube", "youtube premium", "yt premium", "ইউটিউব", "ইউটিউব প্রিমিয়াম"],
  prime: ["prime", "prime video", "amazon prime", "প্রাইম", "প্রাইম ভিডিও"],
  duolingo: ["duolingo", "duolingo super", "duolingo max", "ডুওলিঙ্গো"],
  telegram: ["telegram", "telegram premium", "টেলিগ্রাম"],
  spotify: ["spotify", "স্পটিফাই"],
  linkedin: ["linkedin", "linkedin premium", "লিংকডইন"],
  grammarly: ["grammarly", "গ্রামারলি"],
  capcut: ["capcut", "capcut pro", "ক্যাপকাট"],
  midjourney: ["midjourney", "মিডজার্নি"],
  claude: ["claude", "claude ai", "ক্লদ"],
  gemini: ["gemini", "gemini advanced", "গুগল জেমিনি"],
  freepik: ["freepik", "ফ্রি পিক"],
  quillbot: ["quillbot", "কুইলবট"],
  nordvpn: ["nordvpn", "nord vpn", "নর্ড ভিপিএন"],
  surfshark: ["surfshark", "সার্ফশার্ক"],
  turnitin: ["turnitin", "টার্নিটিন"],
  coursera: ["coursera", "কোর্সসেরা"],
  skillshare: ["skillshare", "স্কিলশেয়ার"],
  adobe: ["adobe", "photoshop", "illustrator", "creative cloud", "অ্যাডোবি"],
  crunchyroll: ["crunchyroll", "ক্রাঞ্চিরোল"],
  office: ["office 365", "microsoft office", "ms office", "অফিস ৩৬৫"],
  apple: ["apple music", "apple tv", "অ্যাপল মিউজিক"],
  truecaller: ["truecaller", "ট্রুকলার"],
};

export const getSalesBotResponse = (userInput: string, liveProducts: ChatBotProduct[] = []): string => {
  const query = userInput.toLowerCase().trim();
  const cleanQuery = query.replace(/[^\w\s\u0980-\u09FF]/g, " ");

  // 1. PRODUCT SPECIFIC INQUIRY CHECK
  // Check if user is asking about any product that exists or doesn't exist
  let matchedLiveProduct: ChatBotProduct | null = null;
  let detectedProductKeyword = "";

  // Check against live products from DB first
  for (const prod of liveProducts) {
    const prodName = prod.name.toLowerCase();
    // Direct match
    if (query.includes(prodName) || prodName.split(" ").some(word => word.length > 3 && query.includes(word))) {
      matchedLiveProduct = prod;
      detectedProductKeyword = prod.name;
      break;
    }
  }

  // Check through aliases dictionary
  if (!matchedLiveProduct) {
    for (const [key, aliases] of Object.entries(PRODUCT_ALIASES)) {
      if (aliases.some(alias => query.includes(alias.toLowerCase()))) {
        detectedProductKeyword = key;
        // Search in liveProducts for this key
        matchedLiveProduct = liveProducts.find(p => p.name.toLowerCase().includes(key)) || null;
        break;
      }
    }
  }

  // If a specific product was mentioned by the user:
  if (matchedLiveProduct) {
    const isInStock = matchedLiveProduct.stock_status === "in_stock";
    const priceFormatted = `৳${matchedLiveProduct.price}`;
    const desc = matchedLiveProduct.short_description ? `\n📌 বিস্তারিত: ${matchedLiveProduct.short_description}` : "";

    if (isInStock) {
      return `হ্যাঁ বস! 🎉 আমাদের "${matchedLiveProduct.name}" বর্তমানে একদম **ইন স্টক (In Stock)** এভেইলেবল আছে! ⚡\n\n💰 মূল্য: মাত্র ${priceFormatted}${desc}\n\n👉 আপনি খুব সহজেই ওয়েবসাইট থেকে সরাসরি 'Buy Now' বাটনে ক্লিক করে বিকাশ/নগদ/রকেটে অর্ডার সম্পন্ন করতে পারেন। পেমেন্টের পরই দ্রুত ডেলিভারি পেয়ে যাবেন! 😊`;
    } else {
      return `দুঃখিত ভাইয়া/আপু! 😔 আমাদের "${matchedLiveProduct.name}" প্রোডাক্টটি বর্তমানে সাময়িকভাবে **স্টক আউট (Stock Out)** আছে।\n\nআমাদের টিম খুব দ্রুত নতুন স্টক নিয়ে আসার জন্য কাজ করছে। 🚀 স্টক আসার সাথে সাথে জানতে আমাদের ওয়েবসাইটে চোখ রাখুন অথবা আমাদের হোয়াটসঅ্যাপে (01516524644) একটু জানিয়ে রাখুন— রিস্টক হওয়ার সাথে সাথে আপনাকে মেসেজ দিয়ে জানিয়ে দেওয়া হবে!`;
    }
  }

  // If user mentioned a product that is DEFINITELY NOT in the store
  if (detectedProductKeyword && !matchedLiveProduct) {
    return `ধন্যবাদ ভাইয়া আপনার আগ্রহের জন্য! 😊\n\nতবে দুঃখের বিষয় হলো— এই মুহূর্তে আমাদের ওয়েবসাইটে **${userInput.trim()}** প্রোডাক্টটি এভেইলেবল নেই।\n\nপরবর্তীতে যদি এটি আমাদের স্টোরে যুক্ত করা হয়, তবে অবশ্যই ওয়েবসাইটে দেখতে পাবেন এবং নোটিফিকেশন পাবেন। 🔔\n\nতবে আমাদের ওয়েবসাইটে বর্তমানে ChatGPT Plus, Canva Pro, Netflix, YouTube Premium সহ সেরা প্রিমিয়াম প্রোডাক্টগুলো স্টক এভেইলেবল আছে! চাইলে চেক করে দেখতে পারেন। ✨`;
  }

  // 2. Greetings & Halchal (Friendly, cheerful & welcoming)
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
    return "আসসালামু আলাইকুম! Smart Digital Hub-এ আপনাকে স্বাগতম। 🌟\n\nআলহামদুলিল্লাহ, আমরা বেশ ভালো আছি! আপনার দিনটি কেমন কাটছে? 😊\n\nআমাদের ওয়েবসাইটে ChatGPT Plus, Canva Pro, Netflix 4K, YouTube Premium সহ প্রায় সব জনপ্রিয় প্রিমিয়াম সাবস্ক্রিপশন সেরা রেটে ও ইনস্ট্যান্ট ডেলিভারিতে পাওয়া যাচ্ছে।\n\nআজকে আপনার পছন্দের কোন প্রোডাক্টটির প্রয়োজন? জানালে সাহায্য করতে পারি!";
  }

  // 3. Stock Inquiries in General (কী কী স্টক আছে?)
  if (
    query.includes("stock") ||
    query.includes("স্টক") ||
    query.includes("available") ||
    query.includes("এভেইলেবল") ||
    query.includes("কি কি আছে") ||
    query.includes("কী কী আছে")
  ) {
    const inStockList = liveProducts.filter(p => p.stock_status === "in_stock").slice(0, 5);
    const inStockText = inStockList.length > 0
      ? inStockList.map(p => `• ${p.name} (৳${p.price})`).join("\n")
      : "• ChatGPT Plus\n• Canva Pro\n• Netflix 4K UHD\n• YouTube Premium\n• Prime Video";

    return `আমাদের ওয়েবসাইটে বর্তমানে সেরা সেরা সব প্রিমিয়াম সাবস্ক্রিপশন ইন স্টক আছে! ⚡\n\nজনপ্রিয় কিছু প্রোডাক্ট:\n${inStockText}\n\nপছন্দের প্রোডাক্টটি সিলেক্ট করে সরাসরি 'Buy Now' চাপলেই কয়েক মিনিটে পেয়ে যাবেন!`;
  }

  // 4. How to Buy / Order Process
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
    return "অর্ডার করা একদম পানির মতো সহজ! মাত্র ৩টি স্টেপে অর্ডার করুন:\n\n১️⃣ পছন্দের প্রোডাক্টের 'Buy Now' বাটনে ক্লিক করুন।\n২️⃣ আপনার নাম, ফোন ও ডেলিভারি ইমেইল লিখুন।\n৩️⃣ বিকাশ, নগদ বা রকেটে পেমেন্ট করে TrxID দিন।\n\nব্যাস! ৫ থেকে ৩০ মিনিটের মধ্যে আপনার সাবস্ক্রিপশন সরাসরি আপনার ইমেইল ও ড্যাশবোর্ডে ডেলিভারি হয়ে যাবে। 🚀";
  }

  // 5. Payment Methods
  if (
    query.includes("bkash") ||
    query.includes("nagad") ||
    query.includes("rocket") ||
    query.includes("payment") ||
    query.includes("বিকাশ") ||
    query.includes("নগদ") ||
    query.includes("রকেট") ||
    query.includes("পেমেন্ট") ||
    query.includes("টাকা") ||
    query.includes("pay")
  ) {
    return "💳 পেমেন্ট সিস্টেম নিয়ে কোনো চিন্তা নেই!\n\nআমরা সাপোর্ট করি:\n• বিকাশ (bKash)\n• নগদ (Nagad)\n• রকেট (Rocket)\n• মোবাইল ব্যাংকিং\n\nসবকিছু ১০০% নিরাপদ এবং অটো ভেরিফিকেশন সাপোর্টেড।";
  }

  // 6. Delivery Speed & Time
  if (
    query.includes("delivery") ||
    query.includes("ডেলিভারি") ||
    query.includes("koto somoy") ||
    query.includes("koto khon") ||
    query.includes("সময়") ||
    query.includes("কতক্ষণ") ||
    query.includes("instant") ||
    query.includes("speed")
  ) {
    return "⚡ সুপারফাস্ট ডেলিভারি!\n\nপেমেন্ট সাবমিট করার পর সাধারণত ৫ থেকে ৩০ মিনিটের মধ্যেই ডেলিভারি সম্পন্ন হয়। আপনার ইমেইল এবং সাইটের 'My Orders' ড্যাশবোর্ডে ইনস্ট্যান্ট লগইন ডিটেইলস পেয়ে যাবেন।";
  }

  // 7. Warranty & Guarantee
  if (
    query.includes("warranty") ||
    query.includes("guarantee") ||
    query.includes("ওয়ারেন্টি") ||
    query.includes("গ্যারান্টি") ||
    query.includes("জেনুইন") ||
    query.includes("genuine") ||
    query.includes("original") ||
    query.includes("নষ্ট") ||
    query.includes("problem") ||
    query.includes("সমস্যা") ||
    query.includes("রিপ্লেস") ||
    query.includes("replace")
  ) {
    return "🛡️ ১০০% জেনুইন একাউন্ট ও ফুল ডিউরেশন ওয়ারেন্টি!\n\nআমাদের প্রতিটি প্রোডাক্টে মেয়াদের শেষ দিন পর্যন্ত ফুল রিপ্লেসমেন্ট গ্যারান্টি থাকে। কোনো ধরনের টেকনিক্যাল ঝামেলা হলে আমাদের হোয়াটসঅ্যাপে নক দিলেই তাৎক্ষণিক সমাধান পেয়ে যাবেন।";
  }

  // 8. Discount & Offers
  if (
    query.includes("discount") ||
    query.includes("coupon") ||
    query.includes("offer") ||
    query.includes("ডিসকাউন্ট") ||
    query.includes("কুপন") ||
    query.includes("অফার") ||
    query.includes("ছাড়") ||
    query.includes("কম") ||
    query.includes("price") ||
    query.includes("দাম")
  ) {
    return "🎉 বর্তমানে আমাদের সাইটে ধামাকা অফার প্রাইস চলছে!\n\nআপনার কাছে কোনো প্রোমো কোড থাকলে চেকআউট পেজে 'Apply Coupon' দিয়ে অতিরিক্ত ছাড় পেতে পারেন। আর বাল্ক বা একাধিক প্রোডাক্ট নেওয়ার থাকলে আমাদের WhatsApp-এ নক দিন: 01516524644";
  }

  // 9. WhatsApp / Admin Contact
  if (
    query.includes("admin") ||
    query.includes("agent") ||
    query.includes("human") ||
    query.includes("মানুষ") ||
    query.includes("কথা") ||
    query.includes("number") ||
    query.includes("নম্বর") ||
    query.includes("whatsapp") ||
    query.includes("হোয়াটসঅ্যাপ") ||
    query.includes("call")
  ) {
    return "📞 আমাদের কাস্টমার কেয়ার টিমের সাথে সরাসরি কথা বলতে পারেন:\n\n• WhatsApp: 01516524644 (https://wa.me/8801516524644)\n• হটলাইন কল: 01516524644\n• ইমেইল: abir28you@gmail.com\n\nআমরা সবসময় আপনাকে সর্বোচ্চ সহযোগিতা করতে প্রস্তুত!";
  }

  // 10. Default Friendly Conversational Reply
  return "ধন্যবাদ আপনার সুন্দর বার্তার জন্য! 🌟\n\nSmart Digital Hub-এ আপনি পাচ্ছেন ১০০% জেনুইন প্রিমিয়াম সাবস্ক্রিপশন সবচেয়ে সাশ্রয়ী মূল্যে ও দ্রুত ডেলিভারিতে।\n\nওয়েবসাইটের প্রোডাক্ট দেখতে হোমপেজ ভিজিট করুন বা নির্দিষ্ট কোনো প্রোডাক্টের নাম লিখে আমাদের জিজ্ঞাসা করুন। বিশেষ প্রয়োজনে হোয়াটসঅ্যাপ করুন: 01516524644 😊";
};

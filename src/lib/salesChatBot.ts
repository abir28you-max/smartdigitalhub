/**
 * Smart Digital Hub - Ultra-Intelligent Conversational Sales & Support AI Engine
 * Designed to act naturally like ChatGPT / Claude / Gemini in English
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
  { keywords: ["canva", "canva pro"], productSearchTerm: "canva", displayName: "Canva Pro", category: "editing" },
  { keywords: ["gemini", "google gemini", "gemini ai", "gemini advanced"], productSearchTerm: "gemini", displayName: "Gemini AI", category: "ai" },
  { keywords: ["chatgpt", "chat gpt", "gpt 4", "gpt-4", "gpt4", "openai", "open ai", "gpt"], productSearchTerm: "chatgpt", displayName: "ChatGPT Plus", category: "ai" },
  { keywords: ["claude", "claude ai", "claude pro", "sonnet"], productSearchTerm: "claude", displayName: "Claude AI", category: "ai" },
  { keywords: ["midjourney", "mid journey"], productSearchTerm: "midjourney", displayName: "Midjourney", category: "ai" },
  { keywords: ["perplexity", "perplexity ai", "perplexity pro"], productSearchTerm: "perplexity", displayName: "Perplexity AI", category: "ai" },
  { keywords: ["leonardo", "leonardo ai"], productSearchTerm: "leonardo", displayName: "Leonardo AI", category: "ai" },
  { keywords: ["hegen", "heygen", "hegen ai"], productSearchTerm: "hegen", displayName: "Hegen AI", category: "ai" },

  // Video & Design Editing
  { keywords: ["capcut", "capcut pro"], productSearchTerm: "capcut", displayName: "CapCut Pro", category: "editing" },
  { keywords: ["adobe", "photoshop", "creative cloud", "illustrator", "premiere pro"], productSearchTerm: "adobe", displayName: "Adobe Creative Cloud", category: "editing" },
  { keywords: ["camscanner", "cam scanner"], productSearchTerm: "camscanner", displayName: "CamScanner", category: "editing" },
  { keywords: ["ilovepdf", "i love pdf"], productSearchTerm: "ilovepdf", displayName: "iLovePDF", category: "editing" },

  // Education & Learning
  { keywords: ["duolingo", "duolingo super", "duolingo max"], productSearchTerm: "duolingo", displayName: "Duolingo Super", category: "education" },
  { keywords: ["grammarly", "grammerly"], productSearchTerm: "grammarly", displayName: "Grammarly", category: "education" },
  { keywords: ["quillbot", "quill bot"], productSearchTerm: "quillbot", displayName: "QuillBot", category: "education" },

  // VPNs
  { keywords: ["express vpn", "expressvpn"], productSearchTerm: "express", displayName: "Express VPN", category: "vpn" },
  { keywords: ["hma", "hma vpn"], productSearchTerm: "hma", displayName: "HMA VPN", category: "vpn" },
  { keywords: ["norton", "norton vpn"], productSearchTerm: "norton", displayName: "Norton VPN", category: "vpn" },
  { keywords: ["proton", "proton vpn", "protonvpn"], productSearchTerm: "proton", displayName: "Proton VPN", category: "vpn" },
  { keywords: ["ipvanish", "ip vanish"], productSearchTerm: "ipvanish", displayName: "IPVanish", category: "vpn" },
  { keywords: ["mysterium", "mysterium vpn"], productSearchTerm: "mysterium", displayName: "Mysterium VPN", category: "vpn" },

  // Entertainment & OTT
  { keywords: ["youtube", "yt", "yt premium", "youtube premium"], productSearchTerm: "youtube", displayName: "YouTube Premium", category: "entertainment" },
  { keywords: ["prime", "prime video", "amazon prime"], productSearchTerm: "prime", displayName: "Amazon Prime Video", category: "entertainment" },
  { keywords: ["crunchyroll", "anime"], productSearchTerm: "cruchyroll", displayName: "Crunchyroll", category: "entertainment" },
  { keywords: ["sonyliv", "sony liv"], productSearchTerm: "sonyliv", displayName: "SonyLiv", category: "entertainment" },
  { keywords: ["hbomax", "hbo max", "hbo", "max"], productSearchTerm: "hbo", displayName: "HBO Max", category: "entertainment" },
  { keywords: ["nitro", "discord nitro", "discord"], productSearchTerm: "nitro", displayName: "Discord Nitro", category: "entertainment" },

  // Office & Developer Tools
  { keywords: ["microsoft", "office", "office 365", "copilot", "ms office"], productSearchTerm: "microsoft", displayName: "Microsoft 365 & Copilot", category: "developer" },
  { keywords: ["replit", "replit core"], productSearchTerm: "replit", displayName: "Replit", category: "developer" },

  // Recognized Digital Services Currently NOT in Store
  { keywords: ["netflix", "net flix"], productSearchTerm: "netflix", displayName: "Netflix", category: "entertainment" },
  { keywords: ["spotify"], productSearchTerm: "spotify", displayName: "Spotify", category: "entertainment" },
  { keywords: ["linkedin"], productSearchTerm: "linkedin", displayName: "LinkedIn Premium", category: "developer" },
  { keywords: ["freepik"], productSearchTerm: "freepik", displayName: "Freepik", category: "editing" },
  { keywords: ["surfshark"], productSearchTerm: "surfshark", displayName: "Surfshark VPN", category: "vpn" },
  { keywords: ["nordvpn", "nord vpn"], productSearchTerm: "nordvpn", displayName: "NordVPN", category: "vpn" },
  { keywords: ["coursera"], productSearchTerm: "coursera", displayName: "Coursera", category: "education" },
  { keywords: ["skillshare"], productSearchTerm: "skillshare", displayName: "Skillshare", category: "education" },
  { keywords: ["apple music", "apple tv"], productSearchTerm: "apple", displayName: "Apple Music", category: "entertainment" },
  { keywords: ["turnitin"], productSearchTerm: "turnitin", displayName: "Turnitin", category: "education" },
  { keywords: ["disney", "disney+"], productSearchTerm: "disney", displayName: "Disney+", category: "entertainment" },
  { keywords: ["deezer"], productSearchTerm: "deezer", displayName: "Deezer", category: "entertainment" },
  { keywords: ["truecaller"], productSearchTerm: "truecaller", displayName: "Truecaller", category: "other" },
  { keywords: ["envato", "elements"], productSearchTerm: "envato", displayName: "Envato Elements", category: "editing" },
  { keywords: ["vps", "rdp", "hosting"], productSearchTerm: "vps", displayName: "VPS / RDP", category: "developer" },
  { keywords: ["github copilot", "github"], productSearchTerm: "github", displayName: "GitHub Copilot", category: "developer" },
  { keywords: ["jetbrains"], productSearchTerm: "jetbrains", displayName: "JetBrains", category: "developer" },
  { keywords: ["shutterstock"], productSearchTerm: "shutterstock", displayName: "Shutterstock", category: "editing" },
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
    return "Hello and welcome to Smart Digital Hub! ✨ How can I assist you today? Tell me which premium subscription or tool you're looking for, and I'll help you instantly!";
  }

  // ==========================================
  // 1. HUMOR, WITTY & CASUAL / EMOTIONAL INTENTS
  // ==========================================
  if (
    query.includes("taka nai") ||
    query.includes("no money") ||
    query.includes("broke") ||
    query.includes("gorib") ||
    query.includes("poor") ||
    query.includes("fokir") ||
    query.includes("pocket faka")
  ) {
    return "No worries at all! 😅 We all have tight budget moments. Keep an eye on our website for special flash discounts and coupon codes, or grab a subscription whenever you're ready.\n\nWe're always here to support you! ❤️";
  }

  // Free requests
  if (
    query.includes("free") ||
    query.includes("give me free") ||
    query.includes("free te")
  ) {
    return "We wish we could give everything away for free! 😄\n\nBecause all our subscriptions are 100% genuine and officially sourced, we provide them at the lowest possible prices in Bangladesh with full warranty. Let us know which tool you need, and we'll offer you the best deal!";
  }

  // Bot Identity / Casual questions
  if (
    query.includes("who are you") ||
    query.includes("are you a robot") ||
    query.includes("are you bot") ||
    query.includes("manush naki bot") ||
    query.includes("tumi ke")
  ) {
    return "I am the Smart Digital Hub AI Sales & Support Assistant! 🤖✨\n\nI'm here 24/7 to help you discover tools, check live prices and stock availability, and guide your purchases. What subscription are you looking for today?";
  }

  // ==========================================
  // 2. AFTER-SALES SERVICE & TRUST / COMPARISON
  // ==========================================
  if (
    query.includes("after sales") ||
    query.includes("after-sales") ||
    query.includes("service") ||
    query.includes("why buy from you") ||
    query.includes("scam") ||
    query.includes("trust") ||
    query.includes("trusted") ||
    query.includes("warranty") ||
    query.includes("guarantee")
  ) {
    return "You can be 100% confident with Smart Digital Hub! Here's why:\n\n🛡️ **Full-Term Replacement Warranty:** If you face any issues during your subscription duration, we provide immediate fixes or instant replacements.\n⚡ **Super-Fast Delivery:** Delivered to your dashboard & email within 5 to 30 minutes after payment verification.\n🔐 **100% Genuine & Private:** Fully official accounts and activation methods.\n📞 **Dedicated 24/7 Support:** Real assistance available via Live Chat and WhatsApp (+8801516524644).\n\nCustomer satisfaction is our highest priority! ✨";
  }

  // ==========================================
  // 3. CATEGORY & MULTI-PRODUCT INQUIRIES
  // ==========================================

  // VPN category check
  const isVpnCategoryQuery = 
    query.includes("vpn") ||
    query.includes("v p n");

  if (
    isVpnCategoryQuery && 
    (query.includes("what") || query.includes("available") || query.includes("list") || query.includes("all") || query.includes("options") || query.includes("have"))
  ) {
    const vpnProducts = catalog.filter(p => {
      const name = p.name.toLowerCase();
      return name.includes("vpn") || name.includes("hma") || name.includes("ipvanish") || name.includes("mysterium") || name.includes("proton") || name.includes("norton") || name.includes("express");
    });

    const inStock = vpnProducts.filter(p => p.stock_status === "in_stock");
    const outStock = vpnProducts.filter(p => p.stock_status !== "in_stock");

    let text = "🛡️ **Our VPN Collection:**\n\n";

    if (inStock.length > 0) {
      text += "🟢 **Currently In-Stock:**\n";
      text += inStock.map(p => `• **${p.name.trim()}** — Only ৳${p.price} ⚡`).join("\n");
      text += "\n\n(Click 'Buy Now' on our website to order instantly via bKash, Nagad, or Rocket)\n\n";
    }

    if (outStock.length > 0) {
      text += "⏳ **Temporarily Out of Stock (Restocking Soon):**\n";
      text += outStock.map(p => `• ${p.name.trim()}`).join("\n");
      text += "\n\nFeel free to message our WhatsApp (+8801516524644) to get notified upon restock! 😊";
    }

    return text.trim();
  }

  // AI Tools category check
  const isAiCategoryQuery =
    query.includes("ai tool") ||
    query.includes("ai tools") ||
    query.includes("artificial intelligence");

  if (
    isAiCategoryQuery &&
    (query.includes("what") || query.includes("available") || query.includes("list") || query.includes("all") || query.includes("options") || query.includes("have"))
  ) {
    const aiProducts = catalog.filter(p => {
      const name = p.name.toLowerCase();
      return name.includes("ai") || name.includes("chatgpt") || name.includes("claude") || name.includes("gemini") || name.includes("midjourney") || name.includes("perplexity") || name.includes("leonardo") || name.includes("hegen") || name.includes("copilot");
    });

    const inStock = aiProducts.filter(p => p.stock_status === "in_stock");
    const outStock = aiProducts.filter(p => p.stock_status !== "in_stock");

    let text = "🤖 **Our AI Tools Collection:**\n\n";

    if (inStock.length > 0) {
      text += "🟢 **Currently In-Stock:**\n";
      text += inStock.map(p => `• **${p.name.trim()}** — Only ৳${p.price} ⚡`).join("\n");
      text += "\n\n(Click 'Buy Now' to order directly)\n\n";
    }

    if (outStock.length > 0) {
      text += "⏳ **Upcoming / Out of Stock AI Tools:**\n";
      text += outStock.map(p => `• ${p.name.trim()} (৳${p.price})`).join("\n");
      text += "\n\nUpdates are posted on our website once new stock arrives!";
    }

    return text.trim();
  }

  // Education / Learning Tools check
  if (
    (query.includes("education") || query.includes("learning") || query.includes("study") || query.includes("student")) &&
    (query.includes("what") || query.includes("available") || query.includes("list") || query.includes("have"))
  ) {
    const eduProducts = catalog.filter(p => {
      const name = p.name.toLowerCase();
      return name.includes("duolingo") || name.includes("grammarly") || name.includes("quillbot") || name.includes("camscanner") || name.includes("ilovepdf");
    });

    const inStock = eduProducts.filter(p => p.stock_status === "in_stock");
    const outStock = eduProducts.filter(p => p.stock_status !== "in_stock");

    let text = "📚 **Education & Study Tools Collection:**\n\n";
    if (inStock.length > 0) {
      text += "🟢 **In-Stock:**\n";
      text += inStock.map(p => `• **${p.name.trim()}** — ৳${p.price}`).join("\n");
      text += "\n\n";
    }
    if (outStock.length > 0) {
      text += "⏳ **Out of Stock:**\n";
      text += outStock.map(p => `• ${p.name.trim()}`).join("\n");
    }
    return text.trim();
  }

  // Video / Photo Editing Tools check
  if (
    (query.includes("editing") || query.includes("design") || query.includes("video") || query.includes("photo")) &&
    (query.includes("what") || query.includes("available") || query.includes("list") || query.includes("have"))
  ) {
    const editProducts = catalog.filter(p => {
      const name = p.name.toLowerCase();
      return name.includes("canva") || name.includes("capcut") || name.includes("adobe") || name.includes("leonardo");
    });

    const inStock = editProducts.filter(p => p.stock_status === "in_stock");
    const outStock = editProducts.filter(p => p.stock_status !== "in_stock");

    let text = "🎨 **Design & Video Editing Tools:**\n\n";
    if (inStock.length > 0) {
      text += "🟢 **In-Stock:**\n";
      text += inStock.map(p => `• **${p.name.trim()}** — Only ৳${p.price}`).join("\n");
      text += "\n\n";
    }
    if (outStock.length > 0) {
      text += "⏳ **Out of Stock / Upcoming:**\n";
      text += outStock.map(p => `• ${p.name.trim()}`).join("\n");
    }
    return text.trim();
  }

  // Entertainment / OTT check
  if (
    (query.includes("ott") || query.includes("entertainment") || query.includes("movie") || query.includes("streaming")) &&
    (query.includes("what") || query.includes("available") || query.includes("list") || query.includes("have"))
  ) {
    const entProducts = catalog.filter(p => {
      const name = p.name.toLowerCase();
      return name.includes("youtube") || name.includes("prime") || name.includes("crunchyroll") || name.includes("sonyliv") || name.includes("hbo");
    });

    const inStock = entProducts.filter(p => p.stock_status === "in_stock");
    const outStock = entProducts.filter(p => p.stock_status !== "in_stock");

    let text = "🍿 **Entertainment & OTT Subscriptions:**\n\n";
    if (inStock.length > 0) {
      text += "🟢 **In-Stock:**\n";
      text += inStock.map(p => `• **${p.name.trim()}** — Only ৳${p.price}`).join("\n");
      text += "\n\n";
    }
    if (outStock.length > 0) {
      text += "⏳ **Out of Stock:**\n";
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
          return `Yes! 😊 Our **${matched.name.trim()}** is currently in stock.\n\n💰 Price: Only ${price}\n⚡ Delivery: 5–30 Minutes (Instant)\n🛡️ Warranty: Full-term replacement warranty\n\nYou can easily order directly by clicking 'Buy Now' on the website and paying via bKash, Nagad, or Rocket. Let me know if you have any questions!`;
        } else {
          return `Sorry! 😔 **${matched.name.trim()}** is currently **out of stock**.\n\nOur team is working on restocking soon. You can check back shortly or reach out to our WhatsApp (+8801516524644) for restocking alerts.`;
        }
      } else {
        // Product recognized but NOT sold on our website
        return `Sorry! 😔 We do not currently offer **${item.displayName}** on our website.\n\nFeel free to explore our other popular subscriptions and software in our catalog!`;
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
        return `Yes! 😊 Our **${prod.name.trim()}** is available in stock.\n\n💰 Price: Only ${price}\n⚡ Delivery: 5–30 Minutes\n🛡️ Warranty: Full replacement support\n\nClick 'Buy Now' to complete your order instantly!`;
      } else {
        return `Sorry! 😔 **${prod.name.trim()}** is temporarily **out of stock**. It will be restocked soon.`;
      }
    }
  }

  // ==========================================
  // 5. GREETINGS
  // ==========================================
  if (
    query === "hi" ||
    query === "hello" ||
    query === "hey" ||
    query === "salam" ||
    query === "assalamu alaikum" ||
    query.includes("how are you") ||
    query.includes("kemon achen")
  ) {
    return "Hello! Welcome to Smart Digital Hub. 🌟\n\nWe are doing great, thank you! How can we help you today? Inquire about any subscription, check live pricing, or ask any question, and I'll be glad to help! 😊";
  }

  // ==========================================
  // 6. GENERAL STOCK OVERVIEW
  // ==========================================
  if (
    query.includes("stock") ||
    query.includes("available") ||
    query.includes("all products") ||
    query.includes("catalog")
  ) {
    const inStock = catalog.filter(p => p.stock_status === "in_stock");
    const inStockList = inStock.slice(0, 8).map(p => `• **${p.name.trim()}** — ৳${p.price}`).join("\n");

    return `Here are some of our popular products currently **In-Stock**:\n\n${inStockList}\n\n👉 Browse our full catalog on the website and click 'Buy Now' to order instantly!`;
  }

  // ==========================================
  // 7. HOW TO BUY / ORDER PROCESS
  // ==========================================
  if (
    query.includes("order") ||
    query.includes("buy") ||
    query.includes("how to buy") ||
    query.includes("purchase") ||
    query.includes("process")
  ) {
    return "Ordering is fast and simple:\n\n1️⃣ Click **'Buy Now'** on your desired product.\n2️⃣ Enter your name, phone number, and delivery email.\n3️⃣ Send payment via bKash, Nagad, or Rocket and enter your Transaction ID (TrxID).\n\n⚡ Within 5–30 minutes, your account login credentials will appear in your 'My Orders' dashboard and email. Contact our WhatsApp if you need any assistance!";
  }

  // ==========================================
  // 8. PAYMENT METHODS
  // ==========================================
  if (
    query.includes("bkash") ||
    query.includes("nagad") ||
    query.includes("rocket") ||
    query.includes("payment") ||
    query.includes("pay")
  ) {
    return "💳 **Payment Methods:**\n\nWe accept **bKash**, **Nagad**, and **Rocket** in Bangladesh.\n\nOn the checkout page, you will find the account numbers to transfer and enter your Transaction ID (TrxID) to confirm your order.";
  }

  // ==========================================
  // 9. DELIVERY SPEED & TIME
  // ==========================================
  if (
    query.includes("delivery") ||
    query.includes("time") ||
    query.includes("how long") ||
    query.includes("speed")
  ) {
    return "⚡ **Super Fast Delivery:**\n\nOnce your payment is verified, your subscription credentials are delivered within **5 to 30 minutes** to your email and the 'My Orders' dashboard on our website!";
  }

  // ==========================================
  // 10. DISCOUNTS, COUPONS
  // ==========================================
  if (
    query.includes("discount") ||
    query.includes("coupon") ||
    query.includes("promo") ||
    query.includes("offer")
  ) {
    return "🎁 **Special Offers & Coupons:**\n\nAll our prices are already discounted to the best rates. If you have an active promo code, enter it in the 'Apply Coupon' field during checkout to receive an instant extra discount!";
  }

  // ==========================================
  // 11. HUMAN / ADMIN / WHATSAPP CONTACT
  // ==========================================
  if (
    query.includes("admin") ||
    query.includes("agent") ||
    query.includes("human") ||
    query.includes("whatsapp") ||
    query.includes("call") ||
    query.includes("number") ||
    query.includes("contact")
  ) {
    return "📞 **Direct Contact with our Team:**\n\n• **WhatsApp:** [01516524644](https://wa.me/8801516524644)\n• **Direct Call:** 01516524644\n• **Support Hours:** 10:00 AM – 12:00 AM (Feel free to leave a message anytime)";
  }

  // ==========================================
  // 12. THANKS & FAREWELL
  // ==========================================
  if (
    query.includes("thanks") ||
    query.includes("thank you") ||
    query.includes("appreciate")
  ) {
    return "You're very welcome! ❤️ Smart Digital Hub is always here for you. Have a wonderful day ahead! 🌟";
  }

  if (
    query.includes("bye") ||
    query.includes("goodbye") ||
    query.includes("see you")
  ) {
    return "Goodbye! Have a great day, and feel free to return whenever you need subscriptions or support at Smart Digital Hub! 👋✨";
  }

  // ==========================================
  // 13. POLITE, CONVERSATIONAL DEFAULT FALLBACK
  // ==========================================
  return "Thank you for reaching out! 😊\n\nPlease let me know the name or category of the digital subscription you are looking for (such as Canva, YouTube, Duolingo, VPNs, AI Tools, etc.), and I'll immediately assist you with prices and stock availability!";
};


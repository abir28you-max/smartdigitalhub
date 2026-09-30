/**
 * Smart Digital Hub - AI Sales & Support Chatbot Engine
 * Designed to answer customer queries instantly, recommend products, and maximize conversions.
 */

interface BotResponse {
  reply: string;
  suggestedActions?: { label: string; text: string }[];
}

export const getSalesBotResponse = (userInput: string): string => {
  const query = userInput.toLowerCase().trim();

  // 1. Greetings & Pleasantries
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
    query.includes("ভাই")
  ) {
    return "আসসালামু আলাইকুম! Smart Digital Hub-এ আপনাকে স্বাগতম। 🌟\n\nআমরা ChatGPT Plus, Canva Pro, Netflix, YouTube Premium, Prime Video সহ সকল জনপ্রিয় প্রিমিয়াম সাবস্ক্রিপশন সবচেয়ে সাশ্রয়ী মূল্যে ও দ্রুত ডেলিভারিতে দিচ্ছি।\n\nআজকে আপনার কোন সাবস্ক্রিপশন বা সার্ভিসের প্রয়োজন? 😊";
  }

  // 2. How to Buy / Order Process
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
    return "অর্ডার করার নিয়ম খুবই সহজ! মাত্র ৩টি ধাপে অর্ডার করুন:\n\n১️⃣ ওয়েবসাইট থেকে আপনার পছন্দের প্রোডাক্ট সিলেক্ট করে 'Buy Now' বা 'কার্ট'-এ যোগ করুন।\n২️⃣ চেকআউট পেজে আপনার নাম, ইমেইল ও ফোন নম্বর দিন।\n৩️⃣ বিকাশ, নগদ বা রকেটে পেমেন্ট সম্পন্ন করলেই কিছুক্ষণের মধ্যে আপনার ইমেইল ও ড্যাশবোর্ডে অ্যাক্সেস পেয়ে যাবেন।\n\nঅর্ডার করতে কোনো সমস্যা হলে আমাদের জানান!";
  }

  // 3. Payment Methods & Verification
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
    return "💳 আমাদের পেমেন্ট সিস্টেম সম্পূর্ণ নিরাপদ ও সহজ!\n\nআমরা সাপোর্ট করি:\n• বিকাশ (bKash)\n• নগদ (Nagad)\n• রকেট (Rocket)\n• ম্যানুয়াল মোবাইল ব্যাংকিং\n\nচেকআউটের সময় সেন্ড মানি বা পেমেন্ট করে TrxID বসালেই আপনার অর্ডার কনফার্ম হয়ে যাবে।";
  }

  // 4. Delivery Speed & Time
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
    return "⚡ সুপারফাস্ট ডেলিভারি!\n\nপেমেন্ট ভেরিফাই হওয়ার ৫ থেকে ৩০ মিনিটের মধ্যে আপনার সাবস্ক্রিপশন অ্যাক্সেস আপনার ইমেইলে পাঠিয়ে দেওয়া হবে। পাশাপাশি আপনার অ্যাকাউন্টের 'My Orders' পেজেও দেখতে পাবেন।";
  }

  // 5. Warranty & Guarantee & Authenticity
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
    return "🛡️ ১০০% জেনুইন ও ফুল ওয়ারেন্টি গ্যারান্টি!\n\nআমাদের প্রতিটি সাবস্ক্রিপশন প্যাকেজের সাথে পাচ্ছেন পুরো মেয়াদের রিপ্লেসমেন্ট ওয়ারেন্টি। ব্যবহারের সময় যেকোনো সমস্যায় আমাদের হোয়াটসঅ্যাপে জানালে দ্রুত সমাধান বা ইনস্ট্যান্ট রিপ্লেসমেন্ট দেওয়া হয়।";
  }

  // 6. Discount, Coupon & Offers
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
    return "🎉 বর্তমানে সাইটে আকর্ষণীয় ছাড় ও অফার প্রাইস চলছে!\n\nআপনার কাছে প্রোমো কোড বা কুপন থাকলে চেকআউটের সময় 'Apply Coupon' অপশনে বসিয়ে অতিরিক্ত ছাড় উপভোগ করতে পারেন। স্পেশাল বাল্ক অর্ডারের ডিসকাউন্টের জন্য আমাদের হোয়াটসঅ্যাপে নক দিন: 01516524644";
  }

  // 7. Product Specific: ChatGPT
  if (query.includes("chatgpt") || query.includes("gpt") || query.includes("openai")) {
    return "🤖 ChatGPT Plus / Team সাবস্ক্রিপশন:\n\n• GPT-4o, DALL·E 3 এবং অ্যাডভান্সড ডেটা অ্যানালাইসিস সুবিধা\n• সম্পূর্ণ নিজস্ব বা প্রাইভেট প্রোফাইল\n• ফুল মেয়াদ ওয়ারেন্টি সহ\n\nওয়েবসাইটের প্রোডাক্ট লিস্ট থেকে আজই সেরা মূল্যে অর্ডার করুন!";
  }

  // 8. Product Specific: Canva
  if (query.includes("canva") || query.includes("ক্যানভা")) {
    return "🎨 Canva Pro সাবস্ক্রিপশন:\n\n• আপনার নিজস্ব পার্সোনাল ইমেইলেই অ্যাক্টিভ হবে\n• আনলিমিটেড প্রিমিয়াম টেমপ্লেট, ফন্ট ও ব্যাকগ্রাউন্ড রিমুভার\n• ১ মাস / ৬ মাস / ১ বছর মেয়াদের সেরা অফার\n\nঅর্ডার করতে 'Products' থেকে Canva Pro সিলেক্ট করুন!";
  }

  // 9. Product Specific: Netflix
  if (query.includes("netflix") || query.includes("নেটফ্লিক্স")) {
    return "🍿 Netflix 4K UHD সাবস্ক্রিপশন:\n\n• Ultra HD 4K স্ট্রিমিং ও ব্যক্তিগত পিন লক প্রোফাইল\n• মোবাইল, ল্যাপটপ, টিভি সব ডিভাইসে চলবে\n• ফুল ডিউরেশন রিপ্লেসমেন্ট গ্যারান্টি\n\nস্টক সীমিত! এখনই আপনার স্লট বুক করুন।";
  }

  // 10. Product Specific: YouTube
  if (query.includes("youtube") || query.includes("yt") || query.includes("ইউটিউব")) {
    return "📺 YouTube Premium:\n\n• কোনো অ্যাড ছাড়া ব্যাকগ্রাউন্ড প্লেব্যাক ও ভিডিও ডাউনলোড\n• সাথে YouTube Music Premium সম্পূর্ণ ফ্রি\n• আপনার নিজস্ব জিমেইলে ফ্যামিলি ইনভাইটের মাধ্যমে অ্যাক্টিভেশন\n\nওয়েবসাইট থেকে খুব সহজেই অর্ডার করতে পারেন!";
  }

  // 11. Product Specific: Prime Video
  if (query.includes("prime") || query.includes("amazon") || query.includes("প্রাইম")) {
    return "🎬 Amazon Prime Video:\n\n• 4K Ultra HD স্ট্রিমিং\n• আলাদা প্রোফাইল ও ফুল ওয়ারেন্টি\n• সেরা রেটে দ্রুত ডেলিভারি\n\nঅর্ডার করতে সরাসরি সাইটের প্রোডাক্ট পেজে যান!";
  }

  // 12. Human Agent / WhatsApp / Contact
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
    return "📞 আমাদের কাস্টমার কেয়ার টিম সবসময় আপনার সেবায় প্রস্তুত!\n\nসরাসরি কথা বলতে বা দ্রুত সাপোর্টের জন্য:\n• WhatsApp: 01516524644 (https://wa.me/8801516524644)\n• কল: 01516524644\n• ইমেইল: abir28you@gmail.com\n\nআপনার যেকোনো প্রয়োজনে আমরা সাথে আছি!";
  }

  // 13. Refund / Safety Policy
  if (query.includes("refund") || query.includes("ফেরত") || query.includes("টাকা ফেরত") || query.includes("নিরাপদ")) {
    return "🤝 আমাদের রিফান্ড ও রিপ্লেসমেন্ট পলিসি ১০০% গ্রাহকবান্ধব!\n\nযদি সার্ভিসে কোনো অনাকাঙ্ক্ষিত টেকনিক্যাল ত্রুটি ঘটে এবং আমরা সমাধান দিতে ব্যর্থ হই, তবে শর্তানুযায়ী দ্রুত রিফান্ড বা বিকল্প সেবা প্রদান করা হয়।";
  }

  // 14. Default Smart Sales Pitch
  return "ধন্যবাদ আপনার বার্তার জন্য! 🌟\n\nSmart Digital Hub-এ আপনি পাচ্ছেন ১০০% জেনুইন ডিজিটাল সাবস্ক্রিপশন (ChatGPT, Canva, Netflix, YouTube Premium, Prime Video ইত্যাদি) সবচেয়ে কম দামে ও ইনস্ট্যান্ট ডেলিভারিতে।\n\n👉 অর্ডার করতে পছন্দের প্রোডাক্টের 'Buy Now' বাটনে ক্লিক করুন।\n👉 বিশেষ কোনো প্রশ্ন থাকলে সরাসরি আমাদের হোয়াটসঅ্যাপে মেসেজ দিন: 01516524644";
};

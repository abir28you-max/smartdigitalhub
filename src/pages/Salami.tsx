import { useState, useMemo, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import eidImage from "@/assets/eid-ul-adha.jpg";
import { Gift, Moon, Star, Sparkles, CheckCircle2 } from "lucide-react";

const BD_NAMES = [
  "রাহাত হোসেন", "তানভীর আহমেদ", "সাবরিনা আক্তার", "মোঃ আরিফ", "নুসরাত জাহান",
  "ফারহান ইসলাম", "তাসনিম আরা", "মাহমুদুল হাসান", "জান্নাতুল ফেরদৌস", "শাকিল আহমেদ",
  "ফাতেমা খাতুন", "রিফাত হোসেন", "মারিয়া আক্তার", "আবু সাঈদ", "সুমাইয়া ইসলাম",
  "কামরুল হাসান", "নাফিসা তাবাসসুম", "ইমরান হোসেন", "সাদিয়া আফরিন", "জাহিদ হাসান",
  "রুমানা পারভীন", "আশরাফুল আলম", "মিথিলা রহমান", "সোহেল রানা", "তাহমিনা বেগম",
  "আনিসুর রহমান", "শারমিন সুলতানা", "মোস্তাফিজুর রহমান", "আফরোজা বেগম", "রাকিবুল ইসলাম",
];

const AMOUNTS = [50, 80, 100, 120, 150, 200, 250, 300];

function generateFakeReceivers(count: number) {
  const results = [];
  for (let i = 0; i < count; i++) {
    const nameIdx = (i * 7 + 42) % BD_NAMES.length;
    const amountIdx = (i * 3 + 42) % AMOUNTS.length;
    const mid = String((i * 137 + 5678) % 10000).padStart(4, "0");
    const last = String((i * 89 + 12) % 100).padStart(2, "0");
    const prefix = ["1756", "1712", "1845", "1678", "1912", "1534", "1812"][(i * 5) % 7];
    results.push({
      name: BD_NAMES[nameIdx],
      number: `0${prefix}${mid.slice(0, 2)}xxxx${last}`,
      amount: AMOUNTS[amountIdx],
    });
  }
  return results;
}

const Salami = () => {
  const [name, setName] = useState("");
  const [bkash, setBkash] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const receiverCount = useMemo(() => 78 + Math.floor(Math.random() * 15), []);
  const allReceivers = useMemo(() => generateFakeReceivers(receiverCount), [receiverCount]);
  const [currentPopup, setCurrentPopup] = useState<{ name: string; number: string; amount: number } | null>(null);
  const [popupVisible, setPopupVisible] = useState(false);

  // Rotating popup notification
  useEffect(() => {
    let idx = 0;
    const show = () => {
      const r = allReceivers[idx % allReceivers.length];
      setCurrentPopup(r);
      setPopupVisible(true);
      setTimeout(() => setPopupVisible(false), 3000);
      idx++;
    };
    show();
    const interval = setInterval(show, 5000);
    return () => clearInterval(interval);
  }, [allReceivers]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = bkash.trim();
    if (!trimmed) {
      toast({ title: "bKash নম্বর দিন", variant: "destructive" });
      return;
    }
    if (!/^01[3-9]\d{8}$/.test(trimmed)) {
      toast({ title: "সঠিক bKash নম্বর দিন", description: "11 ডিজিটের বাংলাদেশি নম্বর দিন", variant: "destructive" });
      return;
    }

    setLoading(true);

    // Check duplicate (secure RPC — no public read access)
    const { data: existing } = await supabase.rpc("salami_number_exists", {
      p_bkash_number: trimmed,
    });

    if (existing === true) {
      toast({ title: "আপনি ইতিমধ্যে সাবমিট করেছেন!", description: "একই bKash নম্বর দিয়ে একবারই সাবমিট করা যায়।", variant: "destructive" });
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("salami_submissions").insert({
      bkash_number: trimmed,
      name: name.trim() || null,
      note: note.trim() || null,
    });

    if (error) {
      if (error.code === "23505") {
        toast({ title: "আপনি ইতিমধ্যে সাবমিট করেছেন!", variant: "destructive" });
      } else {
        toast({ title: "সমস্যা হয়েছে", description: error.message, variant: "destructive" });
      }
    } else {
      setSubmitted(true);
      toast({ title: "ধন্যবাদ! ✨", description: "আপনার তথ্য সফলভাবে জমা হয়েছে।" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-green-50 to-lime-50 relative overflow-hidden">
      {/* Floating popup notification */}
      <div
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${
          popupVisible && currentPopup
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-full pointer-events-none"
        }`}
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-emerald-200 px-4 py-3 flex items-center gap-3 min-w-[280px] max-w-[360px]">
          <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 truncate">{currentPopup?.name}</p>
            <p className="text-xs text-gray-500 font-mono">{currentPopup?.number}</p>
          </div>
          <span className="text-sm font-bold text-green-600 shrink-0">৳{currentPopup?.amount}</span>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-10 left-6 text-emerald-400/40 animate-pulse text-3xl">🐄</div>
      <div className="absolute top-32 right-6 text-emerald-400/40 animate-pulse delay-300 text-3xl">🐐</div>
      <div className="absolute bottom-32 right-[10%] text-emerald-500/30 animate-pulse delay-500"><Moon className="h-7 w-7" /></div>
      <div className="absolute bottom-48 left-8 text-amber-400/40 animate-pulse delay-700"><Star className="h-6 w-6" /></div>

      <div className="max-w-md mx-auto px-4 py-8 relative z-10">
        {/* Eid Image */}
        <div className="flex justify-center mb-6">
          <img
            src={eidImage}
            alt="Eid ul Adha Mubarak"
            width={1024}
            height={1024}
            className="w-64 h-64 object-contain rounded-2xl shadow-xl shadow-emerald-200/50"
          />
        </div>

        {/* Eid Greeting */}
        <div className="text-center mb-6 space-y-2">
          <h1 className="text-3xl font-bold text-emerald-800 font-display" style={{ lineHeight: "1.2" }}>
            ঈদুল আযহা মোবারক! 🐄🐐
          </h1>
          <p className="text-emerald-700/80 text-sm leading-relaxed">
            কুরবানির ঈদের শুভেচ্ছা জানাই সকলকে। ত্যাগ ও কুরবানির এই
            পবিত্র দিনে আল্লাহ আমাদের সকল কুরবানি কবুল করুন। ঈদের
            সালামি গ্রহণ করতে নিচে আপনার bKash নম্বর দিন।
          </p>
          <div className="flex items-center justify-center gap-2 text-emerald-700 text-xs pt-1">
            <Gift className="h-4 w-4" />
            <span>কুরবানি ঈদ সালামি</span>
            <Gift className="h-4 w-4" />
          </div>
        </div>

        {submitted ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 text-center shadow-lg border border-emerald-200/50 space-y-3">
            <div className="text-5xl">🐄🐐</div>
            <h2 className="text-xl font-bold text-emerald-800">জাযাকাল্লাহু খাইরান!</h2>
            <p className="text-emerald-700/70 text-sm">
              আপনার তথ্য সফলভাবে জমা হয়েছে। কুরবানি ঈদের শুভেচ্ছা রইলো! 🌙
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-emerald-200/50 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-emerald-800">
                নাম <span className="text-emerald-500 text-xs">(optional)</span>
              </label>
              <Input
                placeholder="আপনার নাম"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                className="border-emerald-200 focus-visible:ring-emerald-400 bg-white/70"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-emerald-800">
                bKash নম্বর <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="01XXXXXXXXX"
                value={bkash}
                onChange={(e) => setBkash(e.target.value.replace(/\D/g, "").slice(0, 11))}
                maxLength={11}
                required
                className="border-emerald-200 focus-visible:ring-emerald-400 bg-white/70 text-lg tracking-wider"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-emerald-800">
                নোট <span className="text-emerald-500 text-xs">(optional)</span>
              </label>
              <Textarea
                placeholder="কোনো কিছু বলতে চাইলে..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                rows={3}
                className="border-emerald-200 focus-visible:ring-emerald-400 bg-white/70 resize-none"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white font-semibold py-5 rounded-xl shadow-md"
            >
              {loading ? "সাবমিট হচ্ছে..." : "সালামি নিন 🎁"}
            </Button>
          </form>
        )}


        <p className="text-center text-emerald-700/50 text-xs mt-6">
          © Smart Digital Hub — ঈদুল আযহা ২০২৬
        </p>
      </div>
    </div>
  );
};

export default Salami;

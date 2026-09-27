import { useMemo, useState } from "react";
import { Calculator, Info, RotateCcw, Scale, Beef, Sparkles, Ruler, BadgeDollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useSEO } from "@/hooks/useSEO";

type Animal = "cow" | "goat";

const LivestockMap = () => {
  useSEO({
    title: "গরু ও ছাগলের ওজন পরিমাপ ক্যালকুলেটর | Tech Subx BD",
    description:
      "ঈদুল আযহার গরু ও ছাগল কেনার আগে সঠিক ওজন ও মাংসের পরিমাণ বের করুন। বেড় ও দৈর্ঘ্য দিয়ে ৯৮-৯৯% নির্ভুল হিসাব।",
  });

  const [animal, setAnimal] = useState<Animal>("cow");
  const [unit, setUnit] = useState<"inch" | "cm">("inch");
  const [bere, setBere] = useState("");
  const [length, setLength] = useState("");
  const [price, setPrice] = useState("");

  const reset = () => {
    setBere("");
    setLength("");
    setPrice("");
  };

  const result = useMemo(() => {
    const b = parseFloat(bere);
    const l = parseFloat(length);
    if (!b || !l || b <= 0 || l <= 0) return null;
    // convert cm -> inch (formula is in inches)
    const bi = unit === "cm" ? b / 2.54 : b;
    const li = unit === "cm" ? l / 2.54 : l;
    const totalWeight = (bi * bi * li) / 660; // kg
    const meat = animal === "cow" ? totalWeight * 0.55 : totalWeight * 0.45;
    return {
      totalWeight: totalWeight.toFixed(2),
      meat: meat.toFixed(2),
      maund: (totalWeight / 37.32).toFixed(2),
      totalWeightRaw: totalWeight,
      meatRaw: meat,
    };
  }, [bere, length, unit, animal]);

  const priceNum = parseFloat(price);
  const priceValid = !!result && priceNum > 0;
  const totalWeightPrice = priceValid ? (result!.totalWeightRaw * priceNum) : 0;
  const meatPrice = priceValid ? (result!.meatRaw * priceNum) : 0;
  const fmt = (n: number) =>
    n.toLocaleString("en-BD", { maximumFractionDigits: 0 });

  const isCow = animal === "cow";

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-lg bg-background/80 border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold leading-tight">পশুর ওজন ক্যালকুলেটর</h1>
            <p className="text-[11px] text-muted-foreground">ঈদুল আযহা স্পেশাল • ৯৮-৯৯% নির্ভুল</p>
          </div>
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/30">
            <Scale className="h-4 w-4 text-primary-foreground" />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-5 pb-24">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 via-primary to-primary/70 p-5 text-primary-foreground shadow-xl shadow-primary/20">
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-[10px] font-semibold backdrop-blur-sm mb-2">
              <Sparkles className="h-3 w-3" /> PREMIUM CALCULATOR
            </div>
            <h2 className="text-xl font-extrabold leading-tight">গরু-ছাগলের সঠিক ওজন বের করুন</h2>
            <p className="text-sm text-primary-foreground/90 mt-1">
              হাটে যাওয়ার আগে বা গরু কেনার সময় লস বাঁচান। কয়েক সেকেন্ডে জানুন আনুমানিক ওজন ও মাংসের পরিমাণ।
            </p>
          </div>
        </div>

        {/* Animal selector */}
        <Tabs value={animal} onValueChange={(v) => setAnimal(v as Animal)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-muted/60 backdrop-blur rounded-xl">
            <TabsTrigger value="cow" className="rounded-lg h-full text-sm font-semibold data-[state=active]:shadow-md gap-1.5">
              <span className="text-base">🐄</span> গরু
            </TabsTrigger>
            <TabsTrigger value="goat" className="rounded-lg h-full text-sm font-semibold data-[state=active]:shadow-md gap-1.5">
              <span className="text-base">🐐</span> ছাগল / খাসি
            </TabsTrigger>
          </TabsList>

          <TabsContent value={animal} className="mt-4 space-y-4">
            {/* Calculator card */}
            <Card className="border-border/60 shadow-lg shadow-black/5">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calculator className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">পরিমাপ দিন</p>
                      <p className="text-[11px] text-muted-foreground">একক বেছে নিন</p>
                    </div>
                  </div>
                  <div className="inline-flex bg-muted rounded-lg p-0.5">
                    {(["inch", "cm"] as const).map((u) => (
                      <button
                        key={u}
                        onClick={() => setUnit(u)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                          unit === u ? "bg-background shadow text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {u === "inch" ? "ইঞ্চি" : "সে.মি."}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="bere" className="text-xs font-semibold flex items-center gap-1.5">
                      বেড় (Girth) <span className="text-muted-foreground font-normal">— বুকের চারপাশের মাপ</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="bere"
                        type="number"
                        inputMode="decimal"
                        placeholder={isCow ? "যেমন: ৬০" : "যেমন: ২৮"}
                        value={bere}
                        onChange={(e) => setBere(e.target.value)}
                        className="h-12 text-base font-semibold pr-14"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                        {unit === "inch" ? "inch" : "cm"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="length" className="text-xs font-semibold flex items-center gap-1.5">
                      দৈর্ঘ্য (Length) <span className="text-muted-foreground font-normal">— ঘাড় থেকে লেজের গোড়া পর্যন্ত</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="length"
                        type="number"
                        inputMode="decimal"
                        placeholder={isCow ? "যেমন: ৫৫" : "যেমন: ২৫"}
                        value={length}
                        onChange={(e) => setLength(e.target.value)}
                        className="h-12 text-base font-semibold pr-14"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                        {unit === "inch" ? "inch" : "cm"}
                      </span>
                    </div>
                  </div>
                </div>

                {(bere || length) && (
                  <Button variant="ghost" size="sm" onClick={reset} className="w-full text-muted-foreground gap-1.5">
                    <RotateCcw className="h-3.5 w-3.5" /> রিসেট
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Result */}
            {result ? (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/15 via-emerald-500/10 to-teal-500/15 border border-emerald-500/30 p-5 animate-fade-in">
                <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-emerald-500/20 blur-3xl" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/40">
                      <Scale className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">ফলাফল</p>
                      <p className="text-[10px] text-muted-foreground">আনুমানিক ৯৮-৯৯% নির্ভুল</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-background/70 backdrop-blur rounded-xl p-3 border border-border/40">
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">মোট ওজন</p>
                      <p className="text-2xl font-extrabold text-foreground mt-0.5">{result.totalWeight}</p>
                      <p className="text-[10px] text-muted-foreground">কেজি (~{result.maund} মণ)</p>
                    </div>
                    <div className="bg-background/70 backdrop-blur rounded-xl p-3 border border-emerald-500/30">
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wide flex items-center gap-1">
                        <Beef className="h-3 w-3" /> মাংস
                      </p>
                      <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-0.5">{result.meat}</p>
                      <p className="text-[10px] text-muted-foreground">কেজি (আনুমানিক)</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-6 text-center text-muted-foreground">
                <Scale className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">বেড় ও দৈর্ঘ্য দিন — ফলাফল এখানে দেখাবে</p>
              </div>
            )}

            {/* Price calculator */}
            <Card className="border-border/60 shadow-lg shadow-black/5">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-lg bg-amber-500/15 flex items-center justify-center">
                    <BadgeDollarSign className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">মাংসের দাম হিসাব করুন</p>
                    <p className="text-[11px] text-muted-foreground">প্রতি কেজির দাম দিন</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="price" className="text-xs font-semibold">
                    প্রতি কেজি দাম (৳)
                  </Label>
                  <div className="relative">
                    <Input
                      id="price"
                      type="number"
                      inputMode="decimal"
                      placeholder="যেমন: ৮০০"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="h-12 text-base font-semibold pr-14"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                      ৳/কেজি
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[600, 700, 800, 900, 1000, 1200].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPrice(String(p))}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                          price === String(p)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/50 border-border hover:bg-muted"
                        }`}
                      >
                        ৳{p}
                      </button>
                    ))}
                  </div>
                </div>

                {priceValid ? (
                  <div className="grid grid-cols-2 gap-3 animate-fade-in">
                    <div className="rounded-xl p-3 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/30">
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wide">
                        মোট ওজনে দাম
                      </p>
                      <p className="text-xl font-extrabold text-foreground mt-1">৳{fmt(totalWeightPrice)}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {result!.totalWeight} কেজি × ৳{priceNum}
                      </p>
                    </div>
                    <div className="rounded-xl p-3 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/30">
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wide">
                        মাংসের দাম
                      </p>
                      <p className="text-xl font-extrabold text-foreground mt-1">৳{fmt(meatPrice)}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {result!.meat} কেজি × ৳{priceNum}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    {result ? "প্রতি কেজির দাম দিন — দুই ধরনের হিসাব দেখাবে" : "প্রথমে বেড় ও দৈর্ঘ্য দিন"}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* How to measure */}
            <Card className="border-border/60">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold">কিভাবে মাপ নিবেন</p>
                </div>
                <ol className="text-xs text-foreground/90 space-y-2 list-decimal pl-4 marker:text-primary marker:font-bold">
                  <li>
                    <span className="font-semibold">বেড় (Girth):</span> পশুকে সমতল জায়গায় সোজা করে দাঁড় করান। সামনের দুই
                    পায়ের ঠিক পেছন দিয়ে বুকের চারপাশ ফিতা দিয়ে মাপুন।
                  </li>
                  <li>
                    <span className="font-semibold">দৈর্ঘ্য (Length):</span> কাঁধের উপরের অংশ (ঘাড় শুরুর জায়গা) থেকে
                    শুরু করে লেজের গোড়া পর্যন্ত সোজাসুজি মাপুন।
                  </li>
                  <li>
                    <span className="font-semibold">একক:</span> পুরো মাপ একই এককে নিন — হয় ইঞ্চি, নয়তো সে.মি.।
                  </li>
                  <li>
                    <span className="font-semibold">নির্ভুলতা:</span> পশু শান্ত ও সোজা থাকা অবস্থায় মাপ নিন। ফলাফল
                    আনুমানিক ৯৮-৯৯% সঠিক হবে।
                  </li>
                </ol>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center pt-2 space-y-0.5">
          <p className="text-[11px] text-muted-foreground">
            Powered by <span className="font-semibold text-foreground">Tech Subx BD</span>
          </p>
          <p className="text-[10px] text-muted-foreground">~ Fardin Sagor</p>
        </div>
      </main>
    </div>
  );
};

export default LivestockMap;
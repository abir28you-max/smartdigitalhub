import { useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Clock, Search, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { fireConfetti } from "@/lib/confetti";

const OrderSuccess = () => {
  useEffect(() => {
    // Fire confetti on order success
    fireConfetti();
    const timer = setTimeout(() => {
      fireConfetti();
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      <div className="container flex flex-col items-center justify-center py-12 md:py-16 text-center px-4">
        {/* Animated Pop Checkmark */}
        <div className="relative mb-4">
          <div className="animate-success-pop h-24 w-24 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shadow-lg mx-auto">
            <CheckCircle2 className="h-14 w-14 text-emerald-600 animate-pulse" />
          </div>
          <Sparkles className="h-6 w-6 text-amber-500 absolute -top-1 -right-1 animate-bounce" />
        </div>

        <h1 className="font-display text-2xl sm:text-3xl font-extrabold mb-2 text-foreground">
          Order Placed Successfully! 🎉
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-md mb-6 leading-relaxed">
          আপনার অর্ডারটি সফলভাবে গৃহীত হয়েছে। আমাদের টিম পেমেন্ট ভেরিফাই করে দ্রুত ডেলিভারি প্রদান করবে।
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md justify-center">
          <Button asChild size="lg" className="w-full rounded-xl gap-2 font-bold shadow-md hover:scale-[1.02] active:scale-95 transition-all">
            <Link to="/orders">
              <Search className="h-4 w-4" />
              My Orders Dashboard (ড্যাশবোর্ড)
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full rounded-xl hover:scale-[1.02] active:scale-95 transition-all">
            <Link to="/">Back to Home</Link>
          </Button>
        </div>

        <Card className="mt-6 w-full max-w-md border-amber-300/80 dark:border-amber-800/70 bg-amber-500/10 dark:bg-amber-950/30 shadow-xs animate-fade-in-up">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-500 text-white p-2.5 shadow-xs">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="font-display font-bold text-base text-foreground text-left">
                পেমেন্ট ভেরিফিকেশন ও ডেলিভারি
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed text-left">
              আপনার পেমেন্ট ভেরিফাই করতে <span className="font-bold text-foreground">৫–১০ মিনিট</span> সময় লাগবে। উপরের <strong>My Orders Dashboard</strong> এ গেলে আপনি লাইভ স্ট্যাটাস দেখতে পাবেন এবং ভেরিফাই হওয়ার সাথে সাথে সেখানেই আপনার অ্যাকাউন্ট চলে আসবে।
            </p>
          </CardContent>
        </Card>
      </div>
      <BottomNav />
    </div>
  );
};

export default OrderSuccess;

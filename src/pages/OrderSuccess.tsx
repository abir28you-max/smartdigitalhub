import { Link } from "react-router-dom";
import { CheckCircle2, Clock, Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

const OrderSuccess = () => {
  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      <div className="container flex flex-col items-center justify-center py-12 md:py-16 text-center px-4">
        {/* Simple Clean Checkmark (No Confetti, No Bouncing, No Animation) */}
        <div className="mb-4">
          <div className="h-20 w-20 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shadow-xs mx-auto">
            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          </div>
        </div>

        <h1 className="font-display text-2xl sm:text-3xl font-extrabold mb-2 text-foreground">
          Order Placed Successfully!
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-md mb-6 leading-relaxed">
          Your order has been placed successfully. Our team will verify your payment and complete your delivery promptly.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md justify-center">
          <Button asChild size="lg" className="w-full rounded-xl gap-2 font-bold shadow-xs">
            <Link to="/orders">
              <Search className="h-4 w-4" />
              My Orders Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full rounded-xl">
            <Link to="/">Back to Home</Link>
          </Button>
        </div>

        <Card className="mt-6 w-full max-w-md border-amber-300/80 dark:border-amber-800/70 bg-amber-500/10 dark:bg-amber-950/30 shadow-xs">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-500 text-white p-2.5 shadow-xs">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="font-display font-bold text-base text-foreground text-left">
                Payment Verification & Delivery
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed text-left">
              Payment verification typically takes <span className="font-bold text-foreground">5–10 minutes</span>. You can track live updates in your <strong>My Orders Dashboard</strong>, where your credentials will automatically appear upon completion.
            </p>
          </CardContent>
        </Card>
      </div>
      <BottomNav />
    </div>
  );
};

export default OrderSuccess;

import { Link } from "react-router-dom";
import { CheckCircle, Clock, Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

const OrderSuccess = () => (
  <div className="min-h-screen bg-background pb-16 md:pb-0">
    <Header />
    <div className="container flex flex-col items-center justify-center py-16 text-center px-4">
      <CheckCircle className="h-20 w-20 text-accent mb-4" />
      <h1 className="font-display text-2xl font-bold mb-2">Order Placed Successfully!</h1>
      <p className="text-muted-foreground mb-6">We will verify your payment and deliver your product soon.</p>
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md justify-center">
        <Button asChild size="lg" className="w-full rounded-xl gap-2 font-bold shadow-md">
          <Link to="/orders">
            <Search className="h-4 w-4" />
            My Orders Dashboard (ড্যাশবোর্ড)
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="w-full rounded-xl">
          <Link to="/">Back to Home</Link>
        </Button>
      </div>

      <Card className="mt-6 w-full max-w-md border-amber-300 dark:border-amber-800/70 bg-amber-500/10 dark:bg-amber-950/30 shadow-sm">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-500 text-white p-2.5 shadow-xs">
              <Clock className="h-5 w-5" />
            </div>
            <h3 className="font-display font-bold text-base text-foreground text-left">
              পেমেন্ট ভেরিফিকেশন ও ডেলিভারি
            </h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed text-left">
            আপনার পেমেন্ট ভেরিফাই করতে <span className="font-bold text-foreground">৫–১০ মিনিট</span> সময় লাগবে। উপরের <strong>My Orders Dashboard</strong> এ গেলে আপনি লাইভ স্ট্যাটাস দেখতে পাবেন এবং ভেরিফাই হওয়ার সাথে সাথে সেখানেই আপনার অ্যাকাউন্ট চলে আসবে।
          </p>
        </CardContent>
      </Card>
    </div>
    <BottomNav />
  </div>
);

export default OrderSuccess;

import { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, Loader2, Send } from "lucide-react";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      toast({
        title: "Please enter a valid email",
        description: "A valid email address is required to subscribe.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate quick subscription delay or future backend sync
      await new Promise((r) => setTimeout(r, 600));
      setSubscribed(true);
      setEmail("");
      toast({
        title: "Subscribed Successfully! 🎉",
        description: "Thank you for subscribing to Smart Digital Hub. You'll receive our latest offers & discounts!",
      });
    } catch {
      toast({
        title: "Subscription failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Your Opinion Matters - separate section above footer */}
      <section className="bg-background py-6 md:py-12 px-4">
        <div className="container text-center space-y-3">
          <h2 className="font-display text-lg md:text-3xl font-black text-foreground">Your Opinion Matters</h2>
          <p className="text-muted-foreground text-sm">Share your experience on Trustpilot.</p>
          <Link
            to="/reviews"
            className="inline-flex items-center gap-2 border-2 border-emerald-500 rounded-lg px-6 py-3 text-lg font-semibold text-foreground hover:bg-emerald-500/10 transition-colors"
          >
            Review us on
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-emerald-500 fill-current" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
            </svg>
            <span className="font-bold">Trustpilot</span>
          </Link>
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-100 dark:bg-card dark:text-foreground border-t border-slate-800 dark:border-border py-6 pb-16 md:py-8 md:pb-8 mt-6">
        <div className="container text-center space-y-4">
          <div>
            <p className="font-display text-lg md:text-2xl font-bold tracking-tight">Smart Digital Hub</p>
            <p className="opacity-75 text-xs">The Digital Product Store</p>
          </div>

          <form onSubmit={handleSubscribe} className="flex max-w-md mx-auto gap-2">
            <label htmlFor="footer-email" className="sr-only">Email address</label>
            <Input
              id="footer-email"
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (subscribed) setSubscribed(false);
              }}
              placeholder="Enter your email"
              className="bg-slate-800/80 border-slate-700 text-slate-100 placeholder:text-slate-400 dark:bg-background dark:border-border dark:text-foreground dark:placeholder:text-muted-foreground"
            />
            <Button
              type="submit"
              variant="default"
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shrink-0 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : subscribed ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-1 text-emerald-300" />
                  Subscribed
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5 mr-1" />
                  Subscribe
                </>
              )}
            </Button>
          </form>

          <nav aria-label="Footer navigation" className="flex flex-wrap justify-center gap-4 text-sm opacity-80">
            <Link to="/" className="hover:opacity-100 transition-opacity">Home</Link>
            <Link to="/about" className="hover:opacity-100 transition-opacity">About Us</Link>
            <Link to="/privacy" className="hover:opacity-100 transition-opacity">Privacy Policy</Link>
            <Link to="/terms" className="hover:opacity-100 transition-opacity">Terms &amp; Conditions</Link>
            <Link to="/refund" className="hover:opacity-100 transition-opacity">Refund Policy</Link>
            <Link to="/dmca" className="hover:opacity-100 text-primary font-semibold transition-opacity">DMCA &amp; Copyright</Link>
          </nav>

          {/* Legal Disclaimer & Protection Badge */}
          <div className="max-w-xl mx-auto pt-2 pb-1 text-[11px] text-slate-400 dark:text-muted-foreground leading-relaxed">
            <p>
              Disclaimer: All third-party product names, logos, and brands (such as Netflix, Canva, ChatGPT) are trademarks of their respective owners. Smart Digital Hub is an independent digital service provider and reseller.
            </p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Link
                to="/dmca"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-[10px] font-semibold hover:border-primary/50 transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>DMCA Protected</span>
              </Link>
            </div>
          </div>

          <div className="space-y-1.5 pt-1 border-t border-slate-800/60 dark:border-border/60">
            <p className="text-xs opacity-60">© 2026 Smart Digital Hub. All rights reserved.</p>
            <p className="text-xs text-slate-300 dark:text-muted-foreground">
              Designed &amp; Developed by{" "}
              <a
                href="https://www.facebook.com/share/1Hqkd68ccr/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary hover:underline hover:text-primary/90 transition-colors"
              >
                Abir Roy
              </a>
            </p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
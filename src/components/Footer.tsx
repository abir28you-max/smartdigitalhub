import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Footer = () => (
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

        <form onSubmit={(e) => e.preventDefault()} className="flex max-w-md mx-auto gap-2">
          <label htmlFor="footer-email" className="sr-only">Email address</label>
          <Input id="footer-email" type="email" placeholder="Enter your email" className="bg-slate-800/80 border-slate-700 text-slate-100 placeholder:text-slate-400 dark:bg-background dark:border-border dark:text-foreground dark:placeholder:text-muted-foreground" />
          <Button type="submit" variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">Subscribe</Button>
        </form>

        <nav aria-label="Footer navigation" className="flex flex-wrap justify-center gap-4 text-sm opacity-80">
          <Link to="/" className="hover:opacity-100 transition-opacity">Home</Link>
          <Link to="/about" className="hover:opacity-100 transition-opacity">About Us</Link>
          <Link to="/privacy" className="hover:opacity-100 transition-opacity">Privacy Policy</Link>
          <Link to="/terms" className="hover:opacity-100 transition-opacity">Terms & Conditions</Link>
        </nav>

        <div className="space-y-1.5 pt-1">
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

export default Footer;
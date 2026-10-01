import { lazy, Suspense, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Headset, Phone, Mail, X, Bot, Sparkles, ChevronRight } from "lucide-react";

const LiveChatWidget = lazy(() => import("./LiveChatWidget"));

// Official brand SVG icons
const WhatsAppIcon = () => (
  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.972.531 1.761.815 2.796.815 3.183 0 5.768-2.587 5.768-5.766.001-3.182-2.584-5.768-5.768-5.768zm0-2.172c4.418 0 8 3.582 8 8 0 1.411-.365 2.738-1.006 3.896l1.006 3.676-3.765-.988c-1.289.789-2.802 1.248-4.235 1.248-4.418 0-8-3.582-8-8 0-4.418 3.582-8 8-8zm3.385 11.238c-.144-.072-.853-.42-1.003-.492-.151-.072-.261-.108-.371.108-.11.216-.425.534-.521.642-.096.108-.192.12-.336.048-.144-.072-.608-.224-1.158-.715-.429-.382-.718-.854-.802-.998-.084-.144-.009-.222.063-.294.065-.064.144-.168.216-.252.072-.084.096-.144.144-.24.048-.096.024-.18-.012-.252-.036-.072-.371-.894-.508-1.224-.134-.322-.27-.278-.371-.283l-.316-.005c-.11 0-.287.042-.437.204-.15.162-.572.559-.572 1.363s.586 1.58 1.58 2.574c.994.994 2.298 1.298 2.658 1.394.36.096.792.054 1.092-.048.371-.126.853-.42 1.003-.894.15-.474.15-.882.108-.954-.042-.072-.156-.114-.3-.186z" />
  </svg>
);

const GmailIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="#EA4335" />
  </svg>
);

const NeedHelpButton = () => {
  const [open, setOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const location = useLocation();

  // Close popup menu when route changes
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Hide on admin and checkout/order-specific routes
  const hiddenRoutes = ["/orders", "/my-orders", "/track-order", "/order-success", "/account", "/salami", "/2fa", "/map"];
  if (location.pathname.startsWith("/admin") || hiddenRoutes.includes(location.pathname)) return null;

  return (
    <>
      {chatOpen && (
        <Suspense fallback={null}>
          <LiveChatWidget onClose={() => setChatOpen(false)} />
        </Suspense>
      )}

      {/* Backdrop overlay when menu is open (click anywhere outside to close) */}
      {open && (
        <div
          className="fixed inset-0 z-[54] bg-black/40 backdrop-blur-[2px] transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="fixed bottom-16 sm:bottom-6 right-3 sm:right-6 z-[55] flex flex-col items-end">
        {/* Support Menu Sheet / Card */}
        {open && (
          <div className="mb-3 w-[290px] sm:w-[320px] bg-card/95 backdrop-blur-md border border-border/80 rounded-2xl shadow-2xl p-3.5 space-y-2 animate-scale-in text-card-foreground">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-foreground">সহায়তা প্রয়োজন? (24/7 Support)</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="h-6 w-6 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close menu"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Quick Action Buttons */}
            <div className="space-y-1.5 pt-1">
              {/* AI Live Chat */}
              <button
                onClick={() => {
                  setChatOpen(true);
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-all group text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-foreground">স্মার্ট AI লাইভ চ্যাট</p>
                      <span className="text-[10px] bg-primary/20 text-primary font-semibold px-1.5 py-0.2 rounded">Fast</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">স্টক ও ইনস্ট্যান্ট উত্তর পান</p>
                  </div>
                </div>
                <Sparkles className="h-4 w-4 text-primary group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* WhatsApp Support */}
              <a
                href="https://wa.me/8801516524644?text=Hello%20Smart%20Digital%20Hub,%20I%20need%20help%20with%20a%20subscription."
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-emerald-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                    <WhatsAppIcon />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">WhatsApp মেসেজ</p>
                    <p className="text-[10px] text-muted-foreground">+8801516524644</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
              </a>

              {/* Direct Call */}
              <a
                href="tel:01516524644"
                onClick={() => setOpen(false)}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-secondary/80 border border-border/40 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-blue-500 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">সরাসরি ফোন কল</p>
                    <p className="text-[10px] text-muted-foreground">01516524644</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </a>

              {/* Email Support */}
              <a
                href="mailto:abir28you@gmail.com"
                onClick={() => setOpen(false)}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-secondary/80 border border-border/40 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                    <GmailIcon />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">ইমেইল সহায়তা</p>
                    <p className="text-[10px] text-muted-foreground">abir28you@gmail.com</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </div>
        )}

        {/* Main Floating Button (FAB) */}
        <button
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close support menu" : "Need Help? Contact Support"}
          className={`relative group h-13 w-13 sm:h-14 sm:w-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
            open
              ? "bg-secondary text-foreground hover:bg-secondary/80 rotate-90"
              : "bg-gradient-to-r from-primary to-indigo-600 text-primary-foreground hover:scale-105 hover:shadow-primary/30"
          }`}
        >
          {/* Active green ping indicator */}
          {!open && (
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-background" />
            </span>
          )}

          {open ? (
            <X className="h-6 w-6" />
          ) : (
            <Headset className="h-6 w-6 group-hover:rotate-12 transition-transform" />
          )}
        </button>
      </div>
    </>
  );
};

export default NeedHelpButton;

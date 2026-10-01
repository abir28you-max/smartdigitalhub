import { lazy, Suspense, useState } from "react";
import { useLocation } from "react-router-dom";
import { Headset, Phone, Mail, X, MessagesSquare } from "lucide-react";

const LiveChatWidget = lazy(() => import("./LiveChatWidget"));

// 100% transparent vector WhatsApp icon matching the requested logo
const WhatsAppIcon = ({ className = "h-7 w-7 text-[#25D366]" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.886 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c-.001 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.414z" />
  </svg>
);

const NeedHelpButton = () => {
  const [open, setOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const location = useLocation();

  // Hide on admin, orders dashboard, account, and specific routes
  const hiddenRoutes = ["/orders", "/my-orders", "/track-order", "/order-success", "/account", "/salami", "/2fa", "/map"];
  if (location.pathname.startsWith("/admin") || hiddenRoutes.includes(location.pathname)) return null;

  return (
    <>
      {chatOpen && (
        <Suspense fallback={null}>
          <LiveChatWidget onClose={() => setChatOpen(false)} />
        </Suspense>
      )}

      <div className="fixed bottom-20 right-4 z-[55] flex flex-col items-center gap-4">
        {open && (
          <>
            <button
              onClick={() => { setChatOpen(true); setOpen(false); }}
              aria-label="Open live chat"
              className="h-14 w-14 rounded-full bg-card border border-border shadow-lg flex items-center justify-center hover:scale-110 transition-transform animate-fade-in"
              style={{ animationDelay: "0.2s", animationFillMode: "both" }}
            >
              <MessagesSquare className="h-6 w-6 text-primary" />
            </button>
            <a
              href="tel:01516524644"
              aria-label="Call us"
              className="h-14 w-14 rounded-full bg-card border border-border shadow-lg flex items-center justify-center hover:scale-110 transition-transform animate-fade-in"
              style={{ animationDelay: "0.15s", animationFillMode: "both" }}
            >
              <Phone className="h-6 w-6 text-primary" />
            </a>
            <a
              href="https://wa.me/8801516524644?text=subscriptions%20%E0%A6%AC%E0%A6%BF%E0%A6%B7%E0%A6%AF%E0%A6%BC%20%E0%A6%B8%E0%A6%AE%E0%A7%8D%E0%A6%AA%E0%A6%B0%E0%A7%8D%E0%A6%95%E0%A7%87%20%E0%A6%9C%E0%A6%BE%E0%A6%A8%E0%A6%BE%E0%A6%B0%20%E0%A6%9B%E0%A6%BF%E0%A6%B2"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp chat"
              className="h-14 w-14 rounded-full bg-card border border-border shadow-lg flex items-center justify-center hover:scale-110 transition-transform animate-fade-in"
              style={{ animationDelay: "0.08s", animationFillMode: "both" }}
            >
              <WhatsAppIcon className="h-7 w-7 text-[#25D366]" />
            </a>
            <a
              href="mailto:abir28you@gmail.com"
              aria-label="Send email"
              className="h-14 w-14 rounded-full bg-card border border-border shadow-lg flex items-center justify-center hover:scale-110 transition-transform animate-fade-in"
              style={{ animationDelay: "0s", animationFillMode: "both" }}
            >
              <Mail className="h-6 w-6 text-destructive" />
            </a>
          </>
        )}

        <div className="relative flex items-center justify-center">
          {!open && (
            <>
              {/* Expanding Radar Ripple Rings */}
              <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping opacity-60 pointer-events-none" />
              <span className="absolute -inset-1.5 rounded-full bg-primary/20 animate-pulse opacity-80 pointer-events-none" />
            </>
          )}

          <button
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close help menu" : "Need help? Open support options"}
            className={`relative z-10 bg-primary text-primary-foreground rounded-full h-14 w-14 flex items-center justify-center shadow-xl transition-all duration-300 ${
              open ? "rotate-90 bg-secondary text-foreground hover:bg-secondary/80" : "hover:scale-110 active:scale-95 hover:shadow-primary/40"
            }`}
          >
            {open ? <X className="h-6 w-6 animate-scale-in" /> : <Headset className="h-6 w-6 animate-pulse" />}
          </button>
        </div>
        {!open && (
          <span className="text-xs font-bold text-foreground -mt-2 bg-background/90 backdrop-blur-sm px-2 py-0.5 rounded-full border border-border/70 shadow-sm">
            Need Help?
          </span>
        )}
      </div>
    </>
  );
};

export default NeedHelpButton;

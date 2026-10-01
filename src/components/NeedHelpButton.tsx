import { lazy, Suspense, useState } from "react";
import { useLocation } from "react-router-dom";
import { Headset, Phone, MessageCircle, Mail, X, MessagesSquare } from "lucide-react";
const LiveChatWidget = lazy(() => import("./LiveChatWidget"));

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
              className="h-14 w-14 rounded-full bg-card border border-border shadow-lg flex items-center justify-center hover:scale-110 transition-transform animate-fade-in p-2.5 overflow-hidden"
              style={{ animationDelay: "0.08s", animationFillMode: "both" }}
            >
              <img src="/whatsapp-logo.png" alt="WhatsApp" className="h-full w-full object-contain" />
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

        <button
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close help menu" : "Need help? Open support options"}
          className="bg-primary text-primary-foreground rounded-full h-14 w-14 flex items-center justify-center shadow-lg hover:opacity-90 transition-all"
        >
          {open ? <X className="h-6 w-6 animate-scale-in" /> : <Headset className="h-6 w-6" />}
        </button>
        {!open && (
          <span className="text-xs font-bold text-foreground -mt-2">Need Help?</span>
        )}
      </div>
    </>
  );
};

export default NeedHelpButton;

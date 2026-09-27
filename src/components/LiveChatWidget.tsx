import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, PhoneOff, MessageCircleMore, MessageCircle, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatInput from "@/components/chat/ChatInput";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  id: string;
  sender_type: string;
  message: string;
  created_at: string;
}

const getSessionId = () => {
  let id = localStorage.getItem("chat_session_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("chat_session_id", id);
  }
  return id;
};

const LiveChatWidget = ({ onClose }: { onClose: () => void }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatEnded, setChatEnded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sessionId = getSessionId();
  const { user } = useAuth();

  const customerName = localStorage.getItem("chat_name") || user?.user_metadata?.name || user?.email?.split("@")[0] || "Customer";
  const customerPhone = localStorage.getItem("chat_phone") || user?.user_metadata?.phone || "N/A";

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase.rpc("get_chat_messages", {
        p_session_id: sessionId,
      });
      if (data && !error) {
        setMessages(data as Message[]);
        if (data.some((m: any) => m.sender_type === "system" && m.message.includes("chat ended"))) {
          setChatEnded(true);
        }
      }
    } catch (e) {
      console.error("Failed to load chat messages:", e);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (msg: string) => {
    if (chatEnded || !msg.trim()) return;
    const tempId = crypto.randomUUID();
    const newMsg: Message = {
      id: tempId,
      sender_type: "customer",
      message: msg,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMsg]);

    const { error } = await supabase.from("chat_messages").insert({
      session_id: sessionId,
      sender_type: "customer",
      message: msg,
      customer_name: customerName,
      customer_phone: customerPhone,
    });

    if (error) {
      console.error("Send message error:", error);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } else {
      supabase.functions
        .invoke("telegram-notify", {
          body: { type: "support", data: { name: customerName, phone: customerPhone, message: msg } },
        })
        .catch(() => {});
    }
  };

  const handleEndChat = async () => {
    await supabase.from("chat_messages").insert({
      session_id: sessionId,
      sender_type: "system",
      message: "🔴 chat ended by customer",
      customer_name: customerName,
      customer_phone: customerPhone,
    });
    setChatEnded(true);
  };

  const handleNewChat = () => {
    localStorage.removeItem("chat_session_id");
    setChatEnded(false);
    setMessages([]);
    setTimeout(() => {
      fetchMessages();
    }, 100);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 z-[95] sm:hidden backdrop-blur-xs animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed bottom-16 sm:bottom-6 right-2 sm:right-6 left-2 sm:left-auto z-[100] sm:w-[380px] h-[520px] max-h-[calc(100vh-5.5rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
              <MessageCircleMore className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm leading-tight truncate">Smart Digital Hub Support</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <p className="text-[11px] text-primary-foreground/85">Active • ২-৫ মিনিটে রিপ্লাই</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!chatEnded && messages.length > 0 && (
              <button
                type="button"
                onClick={handleEndChat}
                className="h-8 w-8 rounded-full hover:bg-primary-foreground/15 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="End chat"
                title="End Chat"
              >
                <PhoneOff className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-full hover:bg-primary-foreground/15 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Quick Contact Bar */}
        <div className="bg-muted/80 border-b border-border px-3 py-1.5 flex items-center justify-between gap-2 text-xs">
          <a
            href="https://wa.me/8801516524644?text=Hello%20Smart%20Digital%20Hub"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-semibold hover:underline"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            WhatsApp
          </a>
          <span className="text-muted-foreground">•</span>
          <a
            href="tel:01516524644"
            className="flex items-center gap-1.5 text-primary font-semibold hover:underline"
          >
            <Phone className="h-3.5 w-3.5" />
            01516524644
          </a>
          <span className="text-muted-foreground">•</span>
          <a
            href="mailto:abir28you@gmail.com"
            className="flex items-center gap-1.5 text-muted-foreground font-semibold hover:underline"
          >
            <Mail className="h-3.5 w-3.5" />
            Email
          </a>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-background/50">
          {/* Welcome message */}
          <div className="flex gap-2 max-w-[88%]">
            <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-xs font-bold">
              SDH
            </div>
            <div className="bg-card border border-border p-3 rounded-2xl rounded-tl-none text-xs text-foreground leading-relaxed shadow-sm">
              স্বাগতম! <strong>Smart Digital Hub</strong> লাইভ সাপোর্টে আপনাকে স্বাগতম। আপনি যেকোনো সাবস্ক্রিপশন, পেমেন্ট বা অর্ডার সম্পর্কে জানতে মেসেজ পাঠান। আমরা দ্রুত উত্তর দেব। 😊
            </div>
          </div>

          {messages.map((m) => (
            <ChatMessage key={m.id} senderType={m.sender_type} message={m.message} />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Footer / Input */}
        {chatEnded ? (
          <div className="p-3 border-t border-border flex flex-col items-center gap-2 flex-shrink-0 bg-muted/40">
            <p className="text-xs text-muted-foreground">এই চ্যাট সেশনটি শেষ হয়েছে</p>
            <Button size="sm" variant="default" onClick={handleNewChat} className="rounded-xl">
              নতুন চ্যাট শুরু করুন
            </Button>
          </div>
        ) : (
          <ChatInput
            onSendText={(text) => sendMessage(text)}
            onSendImage={(base64) => sendMessage(`[img]${base64}`)}
            onSendVoice={(base64) => sendMessage(`[voice]${base64}`)}
            disabled={chatEnded}
          />
        )}
      </div>
    </>
  );
};

export default LiveChatWidget;

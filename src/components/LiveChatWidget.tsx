import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, PhoneOff, MessageCircleMore, MessageCircle, Phone, Mail, Bot, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatInput from "@/components/chat/ChatInput";
import { useAuth } from "@/contexts/AuthContext";
import { getSalesBotResponse } from "@/lib/salesChatBot";

interface Message {
  id: string;
  sender_type: string;
  message: string;
  created_at: string;
}

const QUICK_SUGGESTIONS = [
  { label: "🛍️ কীভাবে কিনব?", text: "কীভাবে অর্ডার করব এবং কিনব?" },
  { label: "💳 পেমেন্ট নিয়ম", text: "পেমেন্ট কিভাবে করতে হয়?" },
  { label: "⚡ ডেলিভারি সময়", text: "অর্ডার করার পর ডেলিভারি কতক্ষণ লাগবে?" },
  { label: "🛡️ ওয়ারেন্টি পলিসি", text: "সাবস্ক্রিপশনের ওয়ারেন্টি সুবিধা কি?" },
  { label: "💬 WhatsApp সাপোর্ট", text: "এডমিনের সাথে হোয়াটসঅ্যাপে কথা বলতে চাই" },
];

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
  const [isBotTyping, setIsBotTyping] = useState(false);
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
  }, [messages, isBotTyping]);

  const triggerBotReply = async (userMsg: string) => {
    // Check if voice or image
    if (userMsg.startsWith("[voice]") || userMsg.startsWith("[img]")) {
      return;
    }

    setIsBotTyping(true);
    setTimeout(async () => {
      try {
        const replyText = getSalesBotResponse(userMsg);
        const botTempId = crypto.randomUUID();
        const botMsg: Message = {
          id: botTempId,
          sender_type: "agent",
          message: replyText,
          created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, botMsg]);
        setIsBotTyping(false);

        // Save AI Bot reply to DB
        await supabase.from("chat_messages").insert({
          session_id: sessionId,
          sender_type: "agent",
          message: replyText,
          customer_name: customerName,
          customer_phone: customerPhone,
        });
      } catch (err) {
        console.error("Bot reply error:", err);
        setIsBotTyping(false);
      }
    }, 750);
  };

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
      // Trigger AI sales assistant reply
      triggerBotReply(msg);

      // Notify Telegram channel for human admin backup
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

      <div className="fixed bottom-16 sm:bottom-6 right-2 sm:right-6 left-2 sm:left-auto z-[100] sm:w-[390px] h-[540px] max-h-[calc(100vh-5.5rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <div className="h-9 w-9 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                SDH
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-400 border-2 border-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-sm leading-tight truncate">Smart Digital Hub</p>
                <span className="bg-primary-foreground/20 text-[10px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                  <Sparkles className="h-2.5 w-2.5" /> AI
                </span>
              </div>
              <p className="text-[11px] text-primary-foreground/85 mt-0.5">ইনস্ট্যান্ট AI সেলস ও লাইভ সাপোর্ট</p>
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
          <div className="flex gap-2 max-w-[90%]">
            <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
              AI
            </div>
            <div className="bg-card border border-border p-3 rounded-2xl rounded-tl-none text-xs text-foreground leading-relaxed shadow-xs">
              স্বাগতম! <strong>Smart Digital Hub</strong> এআই সেলস ও সাপোর্টে আপনাকে স্বাগতম। ✨<br />
              যেকোনো সাবস্ক্রিপশন, অফার, পেমেন্ট বা অর্ডার সংক্রান্ত বিষয়ে জিজ্ঞাসা করতে নিচে লিখুন বা বাটন চাপুন।
            </div>
          </div>

          {/* Quick Suggestions Chips (only if low message count or starting) */}
          {messages.length < 3 && (
            <div className="pt-1 pb-1">
              <p className="text-[11px] text-muted-foreground mb-1.5 font-medium px-1">দ্রুত জানতে ট্যাপ করুন:</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_SUGGESTIONS.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => sendMessage(chip.text)}
                    className="text-xs bg-muted/80 hover:bg-primary/10 hover:text-primary hover:border-primary/40 text-foreground border border-border px-2.5 py-1 rounded-full transition-all text-left cursor-pointer"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <ChatMessage key={m.id} senderType={m.sender_type} message={m.message} />
          ))}

          {/* Typing Indicator */}
          {isBotTyping && (
            <div className="flex gap-2 items-center max-w-[80%] animate-fade-in">
              <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 text-[10px]">
                <Bot className="h-3.5 w-3.5 animate-bounce" />
              </div>
              <div className="bg-muted px-3 py-2 rounded-2xl rounded-tl-none text-xs text-muted-foreground flex items-center gap-1">
                <span>Smart AI টাইপ করছে</span>
                <span className="inline-flex gap-1 items-center ml-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
                </span>
              </div>
            </div>
          )}

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

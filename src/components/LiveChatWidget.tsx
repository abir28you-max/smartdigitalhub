import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, PhoneOff, MessageCircleMore, MessageCircle, Phone, Mail, Bot, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatInput from "@/components/chat/ChatInput";
import { useAuth } from "@/contexts/AuthContext";
import { getSalesBotResponse, ChatBotProduct, ChatBotCategory, DEFAULT_CATALOG } from "@/lib/salesChatBot";
import { safeUUID } from "@/lib/utils";

interface Message {
  id: string;
  sender_type: string;
  message: string;
  created_at: string;
}

const QUICK_SUGGESTIONS = [
  { label: "🛍️ How to buy?", text: "How do I place an order and purchase?" },
  { label: "🛡️ After-Sales Support", text: "How is your after-sales support and warranty?" },
  { label: "🤖 AI Tools Available", text: "What AI subscription tools do you have available?" },
  { label: "🔒 VPN Collection", text: "What VPN services are currently available?" },
  { label: "⚡ Delivery Time", text: "How long does delivery take after ordering?" },
  { label: "💬 WhatsApp Support", text: "I want to chat with an admin directly on WhatsApp" },
];

const getSessionId = () => {
  try {
    let id = localStorage.getItem("chat_session_id");
    if (!id) {
      id = safeUUID();
      localStorage.setItem("chat_session_id", id);
    }
    return id;
  } catch {
    return safeUUID();
  }
};

const LiveChatWidget = ({ onClose }: { onClose: () => void }) => {
  const { user } = useAuth();

  const [savedName, setSavedName] = useState(() => {
    try {
      return localStorage.getItem("chat_name") || user?.user_metadata?.name || "";
    } catch {
      return "";
    }
  });

  const [savedPhone, setSavedPhone] = useState(() => {
    try {
      return localStorage.getItem("chat_phone") || user?.user_metadata?.phone || "";
    } catch {
      return "";
    }
  });
  
  const [isFormSubmitted, setIsFormSubmitted] = useState(() => {
    try {
      return Boolean(localStorage.getItem("chat_name") && localStorage.getItem("chat_phone"));
    } catch {
      return false;
    }
  });

  const [nameInput, setNameInput] = useState(savedName);
  const [phoneInput, setPhoneInput] = useState(savedPhone);
  const [formError, setFormError] = useState("");

  const [messages, setMessages] = useState<Message[]>([]);
  const [chatEnded, setChatEnded] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [liveProducts, setLiveProducts] = useState<ChatBotProduct[]>(DEFAULT_CATALOG);
  const [liveCategories, setLiveCategories] = useState<ChatBotCategory[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sessionId = getSessionId();

  const customerName = savedName || "Customer";
  const customerPhone = savedPhone || "N/A";

  // Load live products and categories for chatbot awareness
  useEffect(() => {
    const loadData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          supabase.from("products").select("id, name, price, stock_status, short_description, slug, category_id"),
          supabase.from("categories").select("id, name, slug"),
        ]);
        if (prodRes.data) {
          setLiveProducts(prodRes.data as ChatBotProduct[]);
        }
        if (catRes.data) {
          setLiveCategories(catRes.data as ChatBotCategory[]);
        }
      } catch (err) {
        console.error("Chatbot data fetch error:", err);
      }
    };
    loadData();
  }, []);

  const fetchMessages = async () => {
    if (!isFormSubmitted) return;
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
    if (isFormSubmitted) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [sessionId, isFormSubmitted]);

  useEffect(() => {
    if (isFormSubmitted) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isBotTyping, isFormSubmitted]);

  const handleStartChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      setFormError("Please enter your name");
      return;
    }
    if (!phoneInput.trim() || phoneInput.trim().length < 6) {
      setFormError("Please enter a valid phone number");
      return;
    }

    setFormError("");
    try {
      localStorage.setItem("chat_name", nameInput.trim());
      localStorage.setItem("chat_phone", phoneInput.trim());
    } catch {}
    setSavedName(nameInput.trim());
    setSavedPhone(phoneInput.trim());
    setIsFormSubmitted(true);
  };

  const triggerBotReply = async (userMsg: string) => {
    if (userMsg.startsWith("[voice]") || userMsg.startsWith("[img]")) {
      return;
    }

    setIsBotTyping(true);
    setTimeout(async () => {
      try {
        const replyText = getSalesBotResponse(userMsg, liveProducts, liveCategories);
        const botTempId = safeUUID();
        const botMsg: Message = {
          id: botTempId,
          sender_type: "agent",
          message: replyText,
          created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, botMsg]);
        setIsBotTyping(false);

        // Save AI Bot reply to Supabase
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
    }, 700);
  };

  const sendMessage = async (msg: string) => {
    if (chatEnded || !msg.trim()) return;
    const tempId = safeUUID();
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
      triggerBotReply(msg);

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
    try {
      localStorage.removeItem("chat_session_id");
    } catch {}
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
        className="fixed inset-0 bg-black/50 z-[95] sm:hidden backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed bottom-16 sm:bottom-6 right-2 sm:right-6 left-2 sm:left-auto z-[100] sm:w-[390px] h-[550px] max-h-[calc(100vh-5.5rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in">
        {/* Top Header */}
        <div className="bg-primary text-primary-foreground px-4 py-3.5 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 text-primary-foreground">
              <MessageCircleMore className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-base leading-tight truncate">Live Support</p>
              <p className="text-[12px] text-primary-foreground/90 mt-0.5">Typically replies in minutes</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isFormSubmitted && !chatEnded && messages.length > 0 && (
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

        {/* Initial Form Screen if not submitted */}
        {!isFormSubmitted ? (
          <div className="flex-1 flex flex-col justify-center px-6 py-6 bg-background overflow-y-auto">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-foreground flex items-center justify-center gap-2">
                Chat with Us <span className="text-2xl">💬</span>
              </h3>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                Provide your details to get instant assistance!
              </p>
            </div>

            <form onSubmit={handleStartChat} className="space-y-4 max-w-sm mx-auto w-full">
              {formError && (
                <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs text-center font-medium">
                  {formError}
                </div>
              )}

              <div>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm text-foreground placeholder:text-muted-foreground/70 transition-all"
                  required
                />
              </div>

              <div>
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm text-foreground placeholder:text-muted-foreground/70 transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-xl text-base shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Start Chat</span>
              </button>
            </form>

            <div className="mt-8 pt-4 border-t border-border flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <a
                href="https://wa.me/8801516524644"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-green-600 transition-colors font-medium"
              >
                <MessageCircle className="h-4 w-4 text-green-500" />
                WhatsApp
              </a>
              <span>•</span>
              <a
                href="tel:01516524644"
                className="flex items-center gap-1.5 hover:text-primary transition-colors font-medium"
              >
                <Phone className="h-4 w-4 text-primary" />
                01516524644
              </a>
            </div>
          </div>
        ) : (
          /* Active Chat Screen */
          <>
            {/* Quick Contact Sub-bar */}
            <div className="bg-muted/80 border-b border-border px-3 py-1.5 flex items-center justify-between gap-2 text-xs flex-shrink-0">
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
              <span className="text-[11px] text-muted-foreground font-medium truncate">
                👤 {customerName}
              </span>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-background/50">
              {/* Welcome message */}
              <div className="flex gap-2 max-w-[90%]">
                <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                  AI
                </div>
                <div className="bg-card border border-border p-3 rounded-2xl rounded-tl-none text-xs text-foreground leading-relaxed shadow-xs">
                  Welcome {customerName}! Welcome to <strong>Smart Digital Hub</strong> AI Sales & Support. ✨<br />
                  Ask any questions regarding subscriptions, prices, stock status, or your orders below!
                </div>
              </div>

              {/* Quick Suggestions Chips */}
              {messages.length < 3 && (
                <div className="pt-1 pb-1">
                  <p className="text-[11px] text-muted-foreground mb-1.5 font-medium px-1">Quick Questions:</p>
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
                    <span>Smart AI is typing</span>
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
                <p className="text-xs text-muted-foreground">This chat session has ended</p>
                <Button size="sm" variant="default" onClick={handleNewChat} className="rounded-xl">
                  Start New Chat
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
          </>
        )}
      </div>
    </>
  );
};

export default LiveChatWidget;

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Send, ArrowLeft, Trash2, PhoneOff, ImagePlus, Mic, MicOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ChatMessage from "@/components/chat/ChatMessage";

interface ChatSession {
  session_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  last_message: string;
  last_time: string;
  unread: number;
}

interface Message {
  id: string;
  sender_type: string;
  message: string;
  created_at: string;
}

const AdminLiveChat = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionEnded, setSessionEnded] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSessions = async () => {
    const { data } = await supabase
      .from("chat_messages")
      .select("session_id, customer_name, customer_phone, message, created_at, is_read, sender_type")
      .order("created_at", { ascending: false });
    if (!data) return;

    const map = new Map<string, ChatSession>();
    for (const m of data) {
      const existing = map.get(m.session_id);
      if (!existing) {
        map.set(m.session_id, {
          session_id: m.session_id,
          customer_name: m.customer_name,
          customer_phone: m.customer_phone,
          last_message: m.message.startsWith("[img]") ? "📷 Photo" : m.message.startsWith("[voice]") ? "🎤 Voice" : m.message,
          last_time: m.created_at,
          unread: (!m.is_read && m.sender_type === "customer") ? 1 : 0,
        });
      } else {
        if (!m.is_read && m.sender_type === "customer") existing.unread++;
        if (!existing.customer_name && m.customer_name) existing.customer_name = m.customer_name;
        if (!existing.customer_phone && m.customer_phone) existing.customer_phone = m.customer_phone;
      }
    }
    setSessions(Array.from(map.values()));
  };

  useEffect(() => {
    fetchSessions();
    const channel = supabase
      .channel("admin-chat-sessions")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, () => fetchSessions())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const openSession = async (sessionId: string) => {
    setActiveSession(sessionId);
    const { data } = await supabase
      .from("chat_messages")
      .select("id, sender_type, message, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });
    if (data) {
      setMessages(data);
      setSessionEnded(data.some(m => m.sender_type === "system" && m.message.includes("chat ended")));
    }
    await supabase.from("chat_messages").update({ is_read: true }).eq("session_id", sessionId).eq("sender_type", "customer");
    fetchSessions();
  };

  useEffect(() => {
    if (!activeSession) return;
    setSessionEnded(false);
    const checkEnded = messages.some(m => m.sender_type === "system" && m.message.includes("chat ended"));
    if (checkEnded) setSessionEnded(true);

    const channel = supabase
      .channel(`admin-chat-${activeSession}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `session_id=eq.${activeSession}` }, async (payload) => {
        const msg = payload.new as Message;
        if (msg.sender_type === "system" && msg.message.includes("chat ended")) setSessionEnded(true);
        // For large messages (voice/image), refetch from DB to avoid realtime truncation
        if (msg.message && (msg.message.indexOf("[voice]") === 0 || msg.message.indexOf("[img]") === 0)) {
          const { data } = await supabase
            .from("chat_messages")
            .select("id, sender_type, message, created_at")
            .eq("id", msg.id)
            .single();
          if (data) {
            setMessages((prev) => [...prev, data]);
          }
        } else {
          setMessages((prev) => [...prev, msg]);
        }
        if (msg.sender_type === "customer") {
          supabase.from("chat_messages").update({ is_read: true }).eq("id", msg.id).then();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeSession]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendAdminMsg = async (msg: string) => {
    if (!activeSession || sessionEnded) return;
    await supabase.from("chat_messages").insert({ session_id: activeSession, sender_type: "admin", message: msg });
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const msg = input.trim();
    setInput("");
    await sendAdminMsg(msg);
  };

  const handleEndChat = async () => {
    if (!activeSession) return;
    await supabase.from("chat_messages").insert({ session_id: activeSession, sender_type: "system", message: "🔴 chat ended by admin" });
    setSessionEnded(true);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("Delete this chat session?")) return;
    await supabase.from("chat_messages").delete().eq("session_id", sessionId);
    if (activeSession === sessionId) { setActiveSession(null); setMessages([]); }
    toast({ title: "Chat deleted" });
    fetchSessions();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 600;
        let w = img.width, h = img.height;
        if (w > maxSize || h > maxSize) {
          if (w > h) { h = (h * maxSize) / w; w = maxSize; } else { w = (w * maxSize) / h; h = maxSize; }
        }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        sendAdminMsg(`[img]${canvas.toDataURL("image/jpeg", 0.7)}`);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";
      const mr = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType });
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          if (result) sendAdminMsg(`[voice]${result}`);
        };
        reader.readAsDataURL(blob);
      };
      mr.start(1000);
      mediaRecorderRef.current = mr;
      setRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch { /* mic denied */ }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setRecordingTime(0);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const activeSessionData = sessions.find((s) => s.session_id === activeSession);

  if (!activeSession) {
    return (
      <div className="p-3">
        <h2 className="font-display text-base font-bold mb-3">Conversations</h2>
        <div className="space-y-2">
          {sessions.map((s) => (
            <div key={s.session_id} className="bg-card rounded-lg border border-border p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => openSession(s.session_id)}>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{s.customer_name || "Unknown"}</span>
                    {s.unread > 0 && <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">{s.unread}</span>}
                  </div>
                  {s.customer_phone && <div className="text-xs text-muted-foreground">📞 {s.customer_phone}</div>}
                  <p className="text-xs text-muted-foreground mt-1 truncate">{s.last_message}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-muted-foreground">{new Date(s.last_time).toLocaleDateString()}</span>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.session_id); }}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {sessions.length === 0 && <p className="text-center text-muted-foreground py-8">No chat sessions yet.</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-3 border-b border-border flex-shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setActiveSession(null)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <span className="font-medium text-sm">{activeSessionData?.customer_name || "Customer"}</span>
          {activeSessionData?.customer_phone && <span className="text-xs text-muted-foreground ml-2">{activeSessionData.customer_phone}</span>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-2">
        {messages.map((m) => (
          <ChatMessage key={m.id} senderType={m.sender_type === "admin" ? "customer" : m.sender_type === "customer" ? "other" : m.sender_type} message={m.message} />
        ))}
        <div ref={bottomRef} />
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />

      {sessionEnded ? (
        <div className="p-3 border-t border-border text-center flex-shrink-0">
          <p className="text-xs text-muted-foreground">চ্যাট শেষ হয়েছে</p>
        </div>
      ) : recording ? (
        <div className="p-3 border-t border-border flex items-center gap-3 flex-shrink-0 bg-destructive/5">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" />
          <span className="text-sm font-medium text-destructive">{formatTime(recordingTime)}</span>
          <span className="text-xs text-muted-foreground flex-1">রেকর্ডিং...</span>
          <Button size="sm" variant="destructive" onClick={stopRecording} className="gap-1.5">
            <MicOff className="h-3.5 w-3.5" /> পাঠান
          </Button>
        </div>
      ) : (
        <div className="p-2.5 border-t border-border flex items-center gap-1.5 flex-shrink-0">
          <button onClick={() => fileInputRef.current?.click()} className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors">
            <ImagePlus className="h-[18px] w-[18px]" />
          </button>
          <button onClick={startRecording} className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors">
            <Mic className="h-[18px] w-[18px]" />
          </button>
          <input
            type="text" placeholder="Reply..." value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 h-8 px-3 text-sm rounded-full border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
          <Button size="icon" className="h-8 w-8 rounded-full" onClick={handleSend} disabled={!input.trim()}>
            <Send className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full" onClick={handleEndChat} title="End Chat">
            <PhoneOff className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdminLiveChat;

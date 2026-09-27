import { useState, useRef, useCallback } from "react";
import { Send, Mic, MicOff, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSendText: (text: string) => void;
  onSendImage: (base64: string) => void;
  onSendVoice: (base64: string) => void;
  disabled?: boolean;
}

const ChatInput = ({ onSendText, onSendImage, onSendVoice, disabled }: ChatInputProps) => {
  const [input, setInput] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSendText = () => {
    if (!input.trim() || disabled) return;
    onSendText(input.trim());
    setInput("");
  };

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || disabled) return;
    
    // Compress image
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 600;
        let w = img.width, h = img.height;
        if (w > maxSize || h > maxSize) {
          if (w > h) { h = (h * maxSize) / w; w = maxSize; }
          else { w = (w * maxSize) / h; h = maxSize; }
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL("image/jpeg", 0.7);
        onSendImage(compressed);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [onSendImage, disabled]);

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
      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          if (result) onSendVoice(result);
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorder.start(1000);
      mediaRecorderRef.current = mediaRecorder;
      setRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch {
      // Mic permission denied
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setRecordingTime(0);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (recording) {
    return (
      <div className="p-3 border-t border-border flex items-center gap-3 flex-shrink-0 bg-destructive/5">
        <div className="flex items-center gap-2 flex-1">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" />
          <span className="text-sm font-medium text-destructive">{formatTime(recordingTime)}</span>
          <span className="text-xs text-muted-foreground">রেকর্ডিং...</span>
        </div>
        <Button size="sm" variant="destructive" onClick={stopRecording} className="gap-1.5">
          <MicOff className="h-3.5 w-3.5" />
          পাঠান
        </Button>
      </div>
    );
  }

  return (
    <div className="p-2.5 border-t border-border flex items-end gap-1.5 flex-shrink-0">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelect}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className="h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors flex-shrink-0 disabled:opacity-40"
        aria-label="Send photo"
      >
        <ImagePlus className="h-[18px] w-[18px]" />
      </button>
      <button
        onClick={startRecording}
        disabled={disabled}
        className="h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors flex-shrink-0 disabled:opacity-40"
        aria-label="Record voice"
      >
        <Mic className="h-[18px] w-[18px]" />
      </button>
      <div className="flex-1 relative">
        <input
          type="text"
          placeholder="মেসেজ লিখুন..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendText()}
          disabled={disabled}
          className="w-full h-9 px-3.5 text-sm rounded-full border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-40"
        />
      </div>
      <Button
        size="icon"
        onClick={handleSendText}
        disabled={disabled || !input.trim()}
        className="h-9 w-9 rounded-full flex-shrink-0"
        aria-label="Send"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ChatInput;

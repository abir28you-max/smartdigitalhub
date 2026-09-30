import { useRef, useState } from "react";
import { Play, Pause, Image as ImageIcon, X } from "lucide-react";

interface ChatMessageProps {
  senderType: string;
  message: string;
}

const ChatMessage = ({ senderType, message }: ChatMessageProps) => {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  const trimmedMessage = (message || "").trim();
  const isImage = trimmedMessage.indexOf("[img]") === 0;
  const isVoice = trimmedMessage.indexOf("[voice]") === 0;
  const isSystem = senderType === "system";
  const isCustomer = senderType === "customer";

  const toggleAudio = () => {
    if (!audioRef.current) {
      const src = trimmedMessage.replace("[voice]", "");
      audioRef.current = new Audio(src);
      audioRef.current.onended = () => setPlaying(false);
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  if (isSystem) {
    return (
      <div className="flex justify-center my-1">
        <span className="bg-muted/60 text-muted-foreground text-[11px] italic px-3 py-1 rounded-full">
          {message}
        </span>
      </div>
    );
  }

  const bubbleClass = isCustomer
    ? "bg-primary text-primary-foreground rounded-2xl rounded-br-sm ml-8"
    : "bg-muted text-foreground rounded-2xl rounded-bl-sm mr-8";

  if (isImage) {
    const src = trimmedMessage.replace("[img]", "");
    return (
      <div className={`flex ${isCustomer ? "justify-end" : "justify-start"}`}>
        <div className={`${bubbleClass} p-1.5 max-w-[70%] overflow-hidden`}>
          {!imgLoaded && (
            <div className="w-40 h-28 bg-muted/30 rounded-xl flex items-center justify-center">
              <ImageIcon className="h-5 w-5 text-muted-foreground/50" />
            </div>
          )}
          <img
            src={src}
            alt="Shared"
            className={`rounded-xl max-w-full max-h-48 object-cover cursor-pointer ${imgLoaded ? "" : "hidden"}`}
            onLoad={() => setImgLoaded(true)}
            onClick={() => setLightbox(true)}
          />
        </div>
        {lightbox && (
          <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(false)}>
            <button className="absolute top-4 right-4 text-white h-10 w-10 rounded-full bg-white/20 flex items-center justify-center" onClick={() => setLightbox(false)}>
              <X className="h-5 w-5" />
            </button>
            <img src={src} alt="Full" className="max-w-full max-h-full object-contain rounded-lg" />
          </div>
        )}
      </div>
    );
  }

  if (isVoice) {
    return (
      <div className={`flex ${isCustomer ? "justify-end" : "justify-start"}`}>
        <div className={`${bubbleClass} px-3 py-2 flex items-center gap-2 min-w-[120px]`}>
          <button
            onClick={toggleAudio}
            className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              isCustomer ? "bg-primary-foreground/20" : "bg-primary/10"
            }`}
          >
            {playing ? (
              <Pause className="h-3.5 w-3.5" />
            ) : (
              <Play className="h-3.5 w-3.5 ml-0.5" />
            )}
          </button>
          <div className="flex-1 flex items-center gap-0.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className={`w-1 rounded-full ${isCustomer ? "bg-primary-foreground/40" : "bg-foreground/30"}`}
                style={{ height: `${6 + Math.random() * 12}px` }}
              />
            ))}
          </div>
          <span className={`text-[10px] ${isCustomer ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
            🎤
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isCustomer ? "justify-end" : "justify-start"}`}>
      <div className={`${bubbleClass} px-3.5 py-2.5 max-w-[85%] text-[13px] leading-relaxed whitespace-pre-line shadow-xs`}>
        {message}
      </div>
    </div>
  );
};

export default ChatMessage;

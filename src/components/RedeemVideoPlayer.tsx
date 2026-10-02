import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlayCircle, Video, ExternalLink, Sparkles, X } from "lucide-react";

interface RedeemVideoPlayerProps {
  videoUrl?: string | null;
  productName?: string;
  variant?: "button" | "card" | "inline";
  className?: string;
}

export const parseVideoSource = (url: string) => {
  if (!url) return null;
  const cleanUrl = url.trim();

  // YouTube Shorts: https://www.youtube.com/shorts/VIDEO_ID or https://youtube.com/shorts/VIDEO_ID
  const shortsMatch = cleanUrl.match(/(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]+)/);
  if (shortsMatch && shortsMatch[1]) {
    return {
      type: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${shortsMatch[1]}?autoplay=1&rel=0&modestbranding=1`,
      isShorts: true,
    };
  }

  // YouTube standard or youtu.be
  const ytMatch = cleanUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([a-zA-Z0-9_-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return {
      type: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0&modestbranding=1`,
      isShorts: false,
    };
  }

  // Loom
  const loomMatch = cleanUrl.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/);
  if (loomMatch && loomMatch[1]) {
    return {
      type: "loom",
      embedUrl: `https://www.loom.com/embed/${loomMatch[1]}?autoplay=1`,
      isShorts: false,
    };
  }

  // Google Drive
  const gdriveMatch = cleanUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (gdriveMatch && gdriveMatch[1]) {
    return {
      type: "gdrive",
      embedUrl: `https://drive.google.com/file/d/${gdriveMatch[1]}/preview`,
      isShorts: false,
    };
  }

  // Direct video file (MP4, WebM, etc.) or Cloud storage
  return {
    type: "direct",
    embedUrl: cleanUrl,
    isShorts: false,
  };
};

export const RedeemVideoPlayer: React.FC<RedeemVideoPlayerProps> = ({
  videoUrl,
  productName,
  variant = "card",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!videoUrl || !videoUrl.trim()) return null;

  const parsed = parseVideoSource(videoUrl);
  if (!parsed) return null;

  return (
    <>
      {variant === "card" && (
        <div
          className={`group relative overflow-hidden rounded-xl border border-rose-200 dark:border-rose-900/60 bg-gradient-to-r from-rose-500/10 via-pink-500/10 to-purple-500/10 p-3 sm:p-3.5 transition-all hover:border-rose-300 dark:hover:border-rose-800 ${className}`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-rose-600 to-pink-500 text-white flex items-center justify-center shadow-xs shrink-0 animate-pulse">
                <Video className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h5 className="text-xs sm:text-sm font-bold text-rose-950 dark:text-rose-200">
                    রিডিম গাইড ভিডিও টিউটোরিয়াল
                  </h5>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white uppercase">
                    ভিডিও গাইড
                  </span>
                </div>
                <p className="text-[11px] text-rose-800/80 dark:text-rose-300 mt-0.5">
                  কীভাবে কোড/আইডি রিডিম বা ব্যবহার করবেন তা ২০ সেকেন্ডে দেখে নিন
                </p>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => setIsOpen(true)}
              className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs gap-1.5 w-full sm:w-auto"
            >
              <PlayCircle className="h-4 w-4" /> ভিডিও দেখুন (Watch)
            </Button>
          </div>
        </div>
      )}

      {variant === "button" && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsOpen(true)}
          className={`border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/40 text-xs font-semibold gap-1.5 rounded-lg ${className}`}
        >
          <PlayCircle className="h-3.5 w-3.5" /> ভিডিও টিউটোরিয়াল
        </Button>
      )}

      {variant === "inline" && (
        <div className={`rounded-xl overflow-hidden border border-border bg-black/5 dark:bg-black/40 ${className}`}>
          {parsed.type === "direct" ? (
            <video
              src={parsed.embedUrl}
              controls
              playsInline
              className="w-full max-h-[360px] object-contain rounded-xl bg-black"
            />
          ) : (
            <div className={`relative w-full ${parsed.isShorts ? "aspect-[9/16] max-h-[480px] mx-auto" : "aspect-video"}`}>
              <iframe
                src={parsed.embedUrl}
                title="Redeem Tutorial Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full rounded-xl border-0"
              />
            </div>
          )}
        </div>
      )}

      {/* Full Video Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden bg-background border-border">
          <DialogHeader className="p-4 pb-2 border-b border-border flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-rose-600 text-white flex items-center justify-center">
                <Video className="h-4 w-4" />
              </div>
              <DialogTitle className="text-sm sm:text-base font-bold text-foreground">
                {productName ? `${productName} — রিডিম গাইড ভিডিও` : "প্রোডাক্ট রিডিম গাইড ভিডিও টিউটোরিয়াল"}
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="p-3 sm:p-5 bg-muted/30">
            {parsed.type === "direct" ? (
              <video
                src={parsed.embedUrl}
                controls
                autoPlay
                playsInline
                className="w-full max-h-[450px] object-contain rounded-xl bg-black shadow-md"
              />
            ) : (
              <div className={`relative w-full rounded-xl overflow-hidden shadow-md bg-black ${parsed.isShorts ? "aspect-[9/16] max-h-[500px] mx-auto" : "aspect-video"}`}>
                <iframe
                  src={parsed.embedUrl}
                  title="Redeem Tutorial Video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full border-0"
                />
              </div>
            )}

            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>💡 ভিডিও অনুযায়ী রিডিম কোড বা অ্যাকাউন্ট লগইন করুন</span>
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1 font-medium"
              >
                নতুন ট্যাবে খুলুন <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RedeemVideoPlayer;

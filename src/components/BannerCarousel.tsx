import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getOptimizedImageUrl } from "@/lib/image";

interface Banner {
  id: string;
  title: string | null;
  image_url: string;
  link: string | null;
  sort_order: number;
}

const BannerCarousel = ({ initialBanners }: { initialBanners?: Banner[] }) => {
  const [banners, setBanners] = useState<Banner[]>(initialBanners || []);
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    if (initialBanners && initialBanners.length > 0) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (data && data.length > 0) setBanners(data);
    };
    fetch();
  }, [initialBanners]);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  // Auto-slide every 4.5 seconds (pauses on hover or touch)
  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;
    const interval = setInterval(next, 4500);
    return () => clearInterval(interval);
  }, [banners.length, next, isPaused]);

  // Mobile Touch Swipe Handlers
  const minSwipeDistance = 40;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (touchStart === null || touchEnd === null) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      next();
    } else if (isRightSwipe) {
      prev();
    }
  };

  if (banners.length === 0) return null;

  return (
    <section className="container mt-2 md:mt-3">
      <div
        className="relative w-full rounded-xl md:rounded-2xl overflow-hidden bg-muted md:shadow-lg group select-none aspect-[16/9] sm:aspect-[16/7.5] md:aspect-[16/7]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Horizontal Sliding Track */}
        <div
          className="flex w-full h-full transition-transform duration-700 ease-out will-change-transform"
          style={{
            transform: `translateX(-${current * 100}%)`,
            transitionTimingFunction: "cubic-bezier(0.25, 1, 0.5, 1)",
          }}
        >
          {banners.map((b, i) => {
            const imageElement = (
              <div className="w-full h-full relative overflow-hidden bg-card flex items-center justify-center">
                {/* Ambient blur background for seamless fit */}
                <img
                  src={getOptimizedImageUrl(b.image_url, { width: 300, quality: 35 })}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-125 pointer-events-none"
                />
                <img
                  src={getOptimizedImageUrl(b.image_url, { width: 1400, quality: 80 })}
                  alt={b.title || "Promotional banner"}
                  loading={i === 0 ? "eager" : "lazy"}
                  fetchPriority={i === 0 ? "high" : undefined}
                  width="1400"
                  height="612"
                  decoding="async"
                  draggable={false}
                  className="relative w-full h-full object-cover object-center pointer-events-none"
                />
              </div>
            );

            if (b.link) {
              const isExternal = b.link.startsWith("http");
              return isExternal ? (
                <a
                  key={b.id}
                  href={b.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-full shrink-0 block"
                >
                  {imageElement}
                </a>
              ) : (
                <Link key={b.id} to={b.link} className="w-full h-full shrink-0 block">
                  {imageElement}
                </Link>
              );
            }

            return (
              <div key={b.id} className="w-full h-full shrink-0 block">
                {imageElement}
              </div>
            );
          })}
        </div>

        {/* Navigation Arrows */}
        {banners.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                prev();
              }}
              className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background/95 text-foreground backdrop-blur-xs rounded-full p-2 sm:p-2.5 transition-all shadow-md opacity-90 sm:opacity-0 sm:group-hover:opacity-100 hover:scale-105 active:scale-95"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                next();
              }}
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background/95 text-foreground backdrop-blur-xs rounded-full p-2 sm:p-2.5 transition-all shadow-md opacity-90 sm:opacity-0 sm:group-hover:opacity-100 hover:scale-105 active:scale-95"
              aria-label="Next Slide"
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            {/* Pagination Indicators (Pill Dots) */}
            <div className="absolute bottom-2.5 sm:bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/25 backdrop-blur-xs">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrent(i);
                  }}
                  className={`transition-all duration-300 rounded-full ${
                    i === current
                      ? "bg-primary w-6 h-2 shadow-xs"
                      : "bg-white/60 hover:bg-white/90 w-2 h-2"
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default BannerCarousel;

import { useEffect, useState, useCallback } from "react";
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

  // Auto-slide every 4 seconds
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(next, 4000);
    return () => clearInterval(interval);
  }, [banners.length, next]);

  if (banners.length === 0) return null;

  const banner = banners[current];

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    if (banner.link) {
      const isExternal = banner.link.startsWith("http");
      if (isExternal) {
        return <a href={banner.link} target="_blank" rel="noopener noreferrer" className="block">{children}</a>;
      }
      return <Link to={banner.link} className="block">{children}</Link>;
    }
    return <>{children}</>;
  };

  return (
    <section className="container mt-2 md:mt-3">
      <div className="relative rounded-xl md:rounded-2xl overflow-hidden bg-muted md:shadow-lg">
        <Wrapper>
          <div className="relative w-full aspect-[16/7]">
            {banners.map((b, i) => (
              <img
                key={b.id}
                src={getOptimizedImageUrl(b.image_url, { width: 1400, quality: 75 })}
                alt={b.title || "Promotional banner"}
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : undefined}
                width="1280"
                height="560"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ease-in-out"
                style={{ opacity: i === current ? 1 : 0 }}
              />
            ))}
          </div>
        </Wrapper>

        {banners.length > 1 && (
          <>
            <button
              onClick={(e) => { e.preventDefault(); prev(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background/90 rounded-full p-1.5 transition"
              aria-label="Previous"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); next(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background/90 rounded-full p-1.5 transition"
              aria-label="Next"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === current ? "bg-primary w-5" : "bg-background/60"}`}
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

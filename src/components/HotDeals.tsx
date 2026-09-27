import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getOptimizedImageUrl } from "@/lib/image";

interface HotDeal {
  id: string;
  name: string;
  image_url: string;
  product_id: string | null;
  product_slug: string | null;
}

const HotDeals = ({ initialDeals = [] }: { initialDeals?: HotDeal[] }) => {
  const [deals, setDeals] = useState<HotDeal[]>(initialDeals);

  useEffect(() => {
    if (initialDeals.length > 0) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("hot_deals")
        .select("id, name, image_url, product_id, products(slug)")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (data && data.length > 0) setDeals(data.map((d: any) => ({ ...d, product_slug: d.products?.slug || null })));
    };
    fetch();
  }, [initialDeals]);

  if (deals.length === 0) return null;

  // Duplicate items multiple times for seamless infinite scroll
  const items = [...deals, ...deals];

  return (
    <section className="container mt-8">
      <h2 className="font-display text-xl md:text-2xl font-black text-center mb-4">Hot Deals</h2>
      <div className="overflow-hidden">
        <div className="flex gap-4 animate-marquee" style={{ width: 'max-content' }}>
          {items.map((deal, i) => {
            const content = (
              <div className="min-w-[90px] max-w-[90px] md:min-w-[120px] md:max-w-[120px] flex-shrink-0 flex flex-col items-center gap-1 md:gap-2">
                <div className="w-[80px] h-[80px] md:w-[104px] md:h-[104px] rounded-lg md:rounded-xl bg-card border border-border overflow-hidden flex items-center justify-center p-1.5 md:p-2 transition-transform hover:-translate-y-1 hover:shadow-md">
                  <img
                    src={getOptimizedImageUrl(deal.image_url, { width: 96, quality: 68 })}
                    alt={deal.name}
                    loading="lazy"
                    width="80"
                    height="80"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-xs md:text-sm font-semibold text-center leading-tight">{deal.name}</span>
              </div>
            );

            if (deal.product_id) {
              return (
                <Link key={`${deal.id}-${i}`} to={`/product/${deal.product_slug || deal.product_id}`} className="block">
                  {content}
                </Link>
              );
            }
            return <div key={`${deal.id}-${i}`}>{content}</div>;
          })}
        </div>
      </div>
    </section>
  );
};

export default HotDeals;

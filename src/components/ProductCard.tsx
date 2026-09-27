import { Link } from "react-router-dom";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { getOptimizedImageUrl } from "@/lib/image";

interface ProductCardProps {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock_status: string;
  slug?: string | null;
  priority?: boolean;
}

const ProductCard = ({ id, name, description, price, image_url, stock_status, slug, priority }: ProductCardProps) => {
  const productUrl = `/product/${slug || id}`;
  const { formatPrice } = useCurrency();
  const queryClient = useQueryClient();
  const cardImage = getOptimizedImageUrl(image_url, { width: 320, quality: 68 });

  const prefetchProduct = () => {
    const key = slug || id;
    // Warm the lazily-loaded ProductDetail route chunk too, so navigation is instant.
    import("@/pages/ProductDetail");
    const cached = queryClient.getQueryData(["product", key]);
    if (!cached) {
      queryClient.prefetchQuery({
        queryKey: ["product", key],
        queryFn: async () => {
          const { data } = await supabase.from("products").select("*").eq(slug ? "slug" : "id", key).maybeSingle();
          return data;
        },
        staleTime: 120_000,
      });
    }
  };

  return (
    <div className="group bg-card rounded-lg md:rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-lg md:hover:-translate-y-1 transition-all duration-200 h-full flex flex-col">
      <Link to={productUrl} className="relative" onMouseEnter={prefetchProduct} onTouchStart={prefetchProduct}>
        <div className="aspect-[4/3] bg-muted flex items-center justify-center p-3 md:p-6 overflow-hidden">
          {image_url ? (
            <img
              src={cardImage}
              alt={name}
              width="200"
              height="150"
              className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
              decoding="async"
            />
          ) : (
            <div className="w-16 h-16 bg-muted-foreground/20 rounded-full" />
          )}
        </div>
        {stock_status === "in_stock" ? (
          <span className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            In Stock
          </span>
        ) : (
          <span className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
            Stock Out
          </span>
        )}
      </Link>
      <div className="p-3 md:p-4 flex flex-col flex-1">
        <h3 className="font-display font-semibold text-sm md:text-base truncate">{name}</h3>
        {description && <p className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-2">{description.replace(/<[^>]+>/g, "")}</p>}
        <p className="text-price font-bold mt-2 md:text-lg">{formatPrice(price)}</p>
        <div className="mt-auto pt-3 md:pt-4">
          <Button size="sm" variant="outline" className="w-full text-xs border-primary text-primary hover:bg-primary hover:text-primary-foreground" asChild>
            <Link to={productUrl}>
              <ExternalLink className="h-3 w-3 mr-1" />
              View Details
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

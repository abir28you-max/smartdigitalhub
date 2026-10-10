import { Link } from "react-router-dom";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
    <Link
      to={productUrl}
      onMouseEnter={prefetchProduct}
      onTouchStart={prefetchProduct}
      className="group bg-card rounded-xl border border-border/80 overflow-hidden shadow-xs hover:border-primary/50 hover:shadow-md hover:-translate-y-1 active:scale-[0.98] h-full flex flex-col cursor-pointer transition-[transform,box-shadow,border-color] duration-200 ease-out select-none gpu-smooth"
    >
      <div className="relative aspect-[4/3] bg-muted/60 flex items-center justify-center p-3.5 md:p-6 overflow-hidden">
        {image_url ? (
          <img
            src={cardImage}
            alt={name}
            width="200"
            height="150"
            className="w-full h-full object-contain transition-transform duration-300 ease-out group-hover:scale-105 gpu-smooth"
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
          />
        ) : (
          <div className="w-16 h-16 bg-muted-foreground/20 rounded-full" />
        )}

        {stock_status === "in_stock" ? (
          <span className="absolute top-2.5 left-2.5 bg-emerald-500/90 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
            In Stock
          </span>
        ) : (
          <span className="absolute top-2.5 left-2.5 bg-destructive/90 backdrop-blur-xs text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
            Stock Out
          </span>
        )}
      </div>

      <div className="p-3.5 md:p-4 flex flex-col flex-1">
        <h3 className="font-display font-semibold text-sm md:text-base truncate group-hover:text-primary transition-colors duration-150">
          {name}
        </h3>
        {description && (
          <p className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
            {description.replace(/<[^>]+>/g, "")}
          </p>
        )}
        <p className="text-primary font-bold mt-2 text-base md:text-lg">
          {formatPrice(price)}
        </p>

        <div className="mt-auto pt-3 md:pt-4">
          <div className="w-full h-8 px-3 text-xs font-semibold border border-primary/60 text-primary group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center rounded-lg shadow-xs transition-colors duration-150">
            <ExternalLink className="h-3 w-3 mr-1" />
            View Details
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;

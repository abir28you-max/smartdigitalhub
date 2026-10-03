import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { fetchHomeShell, fetchHomeRest } from "@/lib/homePrefetch";
import { sortProductsByStock } from "@/lib/productSort";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import CategoryCard from "@/components/CategoryCard";
import BannerCarousel from "@/components/BannerCarousel";
import HotDeals from "@/components/HotDeals";
import { Shield, Lock, ChevronRight, DollarSign, Award } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock_status: string;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

interface Banner {
  id: string;
  title: string | null;
  image_url: string;
  link: string | null;
  sort_order: number;
}

interface HotDeal {
  id: string;
  name: string;
  image_url: string;
  product_id: string | null;
  product_slug: string | null;
}

const Index = () => {
  useSEO({
    title: "Smart Digital Hub - Buy Genuine Digital Products & Subscriptions in Bangladesh",
    description: "Smart Digital Hub is Bangladesh's trusted store for 100+ genuine digital products including ChatGPT, Netflix, Spotify, VPNs, and AI tools with instant delivery and 24/7 support.",
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [hotDeals, setHotDeals] = useState<HotDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [shellLoading, setShellLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;

    // 1) Above-the-fold shell first: banners + categories render as soon as they
    // arrive. These requests were already started in main.tsx, so this usually
    // resolves immediately.
    const fetchShell = async () => {
      try {
        const { categories, banners } = await fetchHomeShell();
        if (cancelled) return;
        setCategories(categories);
        setBanners(banners);
      } catch (e) {
        console.error("Failed to load home shell:", e);
      } finally {
        if (!cancelled) setShellLoading(false);
      }
    };

    // 2) Products + hot deals stream in right after, without blocking the shell.
    const fetchRest = async () => {
      try {
        const { products: rawProducts, hotDeals: rawDeals } = await fetchHomeRest();
        if (cancelled) return;

        const normalizedProducts = sortProductsByStock(rawProducts.map((p: any) => ({
          ...p,
          description: p.short_description ?? null,
        })));

        setProducts(normalizedProducts);
        normalizedProducts.forEach((p: any) => {
          queryClient.setQueryData(["product", p.slug || p.id], p);
        });

        setHotDeals(
          rawDeals.map((d: any) => ({ ...d, product_slug: d.products?.slug || null }))
        );
      } catch (e) {
        console.error("Failed to load products:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchShell();
    fetchRest();

    return () => {
      cancelled = true;
    };
  }, [queryClient]);

  const getProductsByCategory = (catId: string) =>
    sortProductsByStock(products.filter((p) => p.category_id === catId)).slice(0, 4);

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />

      {shellLoading && (
        <div className="container mt-6 space-y-6">
          {/* Banner skeleton */}
          <div className="w-full aspect-[16/7] bg-muted rounded-xl md:rounded-2xl animate-pulse" />
          {/* Category skeleton */}
          <div className="flex gap-3 overflow-hidden">
            {[1,2,3,4].map(i => <div key={i} className="w-20 h-20 rounded-lg bg-muted animate-pulse flex-shrink-0" />)}
          </div>
          {/* Product grid skeleton */}
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="aspect-[4/3] bg-muted animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!shellLoading && (
        <>
          <h1 className="sr-only">
            Smart Digital Hub — Genuine Digital Product Subscriptions in Bangladesh
          </h1>

          <BannerCarousel initialBanners={banners} />

          {categories.length > 0 && (
            <section className="container mt-8 md:mt-14 animate-fade-in-up">
              <h2 className="font-display text-xl md:text-3xl font-black text-center mb-4 md:mb-6">Product Categories</h2>
              <div className="flex gap-3 md:gap-4 overflow-x-auto md:overflow-visible md:flex-wrap md:justify-center pb-2 scrollbar-none">
                {categories.map((cat) => (
                  <CategoryCard key={cat.id} {...cat} />
                ))}
              </div>
            </section>
          )}

          <HotDeals initialDeals={hotDeals} />

          {loading && (
            <div className="container mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-card rounded-lg border border-border overflow-hidden">
                  <div className="aspect-[4/3] bg-muted animate-pulse" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {categories.map((cat) => {
            const catProducts = getProductsByCategory(cat.id);
            if (catProducts.length === 0) return null;
            return (
              <section key={cat.id} className="container mt-8 md:mt-14 animate-fade-in-up">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <h2 className="font-display text-xl md:text-2xl font-bold">{cat.name}</h2>
                  <Link to={`/category/${cat.slug}`} className="text-primary text-sm font-medium flex items-center gap-1 hover:translate-x-0.5 transition-transform">
                    View all <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
                  {catProducts.map((p, i) => (
                    <ProductCard key={p.id} {...p} priority={i < 2} />
                  ))}
                </div>
              </section>
            );
          })}

          {categories.length === 0 && products.length > 0 && (
            <section className="container mt-8 md:mt-14 animate-fade-in-up">
              <h2 className="font-display text-xl md:text-2xl font-bold mb-4 md:mb-6">All Products</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
                {products.map((p, i) => (
                  <ProductCard key={p.id} {...p} priority={i < 2} />
                ))}
              </div>
            </section>
          )}

          <section className="container mt-8 md:mt-16 mb-6 md:mb-12 animate-fade-in-up">
            <h2 className="font-display text-xl md:text-3xl font-black text-center mb-4 md:mb-8">Why Choose Us</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-5">
              <div className="bg-card rounded-xl border border-border p-3 md:p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/30">
                <div className="w-10 h-10 md:w-14 md:h-14 mx-auto mb-2 md:mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 md:h-7 md:w-7 text-primary" />
                </div>
                <h3 className="font-display font-bold text-sm md:text-base mb-1 md:mb-2">Affordable Price</h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">Get top-tier content without breaking the bank. Quality education for everyone.</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-3 md:p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/30">
                <div className="w-10 h-10 md:w-14 md:h-14 mx-auto mb-2 md:mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                  <Award className="h-5 w-5 md:h-7 md:w-7 text-primary" />
                </div>
                <h3 className="font-display font-bold text-sm md:text-base mb-1 md:mb-2">Premium Quality</h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">Expert-curated content to ensure the best learning experience and outcomes.</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-3 md:p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/30">
                <div className="w-10 h-10 md:w-14 md:h-14 mx-auto mb-2 md:mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 md:h-7 md:w-7 text-primary" />
                </div>
                <h3 className="font-display font-bold text-sm md:text-base mb-1 md:mb-2">Trusted</h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">Join thousands of satisfied learners on our platform, building skills and careers.</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-3 md:p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/30">
                <div className="w-10 h-10 md:w-14 md:h-14 mx-auto mb-2 md:mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                  <Lock className="h-5 w-5 md:h-7 md:w-7 text-primary" />
                </div>
                <h3 className="font-display font-bold text-sm md:text-base mb-1 md:mb-2">Secure Payment</h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">Your transactions are protected with encrypted payment gateways for peace of mind.</p>
              </div>
            </div>
          </section>

          <Footer />
        </>
      )}
      <BottomNav />
    </div>
  );
};

export default Index;

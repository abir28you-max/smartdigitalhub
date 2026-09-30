import { useEffect, useState } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { sortProductsByStock } from "@/lib/productSort";

import ProductCard from "@/components/ProductCard";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock_status: string;
  category_id: string | null;
  slug: string | null;
}

const Products = () => {
  useSEO({
    title: "All Digital Products & Subscriptions - Smart Digital Hub",
    description: "Browse and buy affordable digital subscriptions, AI tools, VPNs, streaming services, and software from Smart Digital Hub. Genuine products with instant delivery in Bangladesh.",
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const { slug } = useParams<{ slug?: string }>();
  const categoryId = searchParams.get("category");
  const search = searchParams.get("search");
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setCategoryName(null);

      let resolvedCategoryId = categoryId;
      if (slug) {
        const { data: cat } = await supabase
          .from("categories")
          .select("id, name")
          .eq("slug", slug)
          .single();
        if (cat) {
          resolvedCategoryId = cat.id;
          setCategoryName(cat.name);
        }
      }

      let query = supabase
        .from("products")
        .select("id, name, short_description, price, image_url, stock_status, category_id, slug, options, created_at")
        .order("created_at", { ascending: false });

      if (resolvedCategoryId) query = query.eq("category_id", resolvedCategoryId);
      if (search) {
        query = query.or(`name.ilike.%${search}%,short_description.ilike.%${search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Failed to load products:", error.message);
        setProducts([]);
        setLoading(false);
        return;
      }

      const normalizedProducts = sortProductsByStock((data ?? []).map((p: any) => ({
        ...p,
        description: p.short_description ?? null,
      })));

      setProducts(normalizedProducts);
      normalizedProducts.forEach((p) => {
        const key = p.slug || p.id;
        queryClient.setQueryData(["product", key], p);
      });

      setLoading(false);
    };

    fetchProducts();
  }, [categoryId, search, slug, queryClient]);

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      <div className="container mt-4 md:mt-8 mb-8 md:mb-16">
        <h1 className="font-display text-2xl md:text-3xl font-bold mb-4 md:mb-6">
          {search ? `Search: "${search}"` : categoryName ? categoryName : "All Products"}
        </h1>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card rounded-lg border border-border h-64 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-muted-foreground text-center py-16">No products found.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
            {products.map((p, i) => (
              <ProductCard key={p.id} {...p} priority={i < 4} />
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default Products;

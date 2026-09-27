import { useEffect, useState } from "react";
import AdminSkeleton from "@/components/AdminSkeleton";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Star, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Review {
  id: string;
  product_id: string;
  reviewer_name: string;
  rating: number;
  review_text: string;
  created_at: string;
  product_name?: string;
}

const AdminReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("product_reviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setReviews(data);
      // Fetch product names
      const productIds = [...new Set(data.map((r) => r.product_id))];
      if (productIds.length > 0) {
        const { data: prods } = await supabase
          .from("products")
          .select("id, name")
          .in("id", productIds);
        if (prods) {
          const map: Record<string, string> = {};
          prods.forEach((p) => (map[p.id] = p.name));
          setProducts(map);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("product_reviews").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", variant: "destructive" });
    } else {
      setReviews((prev) => prev.filter((r) => r.id !== id));
      toast({ title: "Review deleted" });
    }
  };

  // Group reviews by product
  const grouped = reviews.reduce<Record<string, Review[]>>((acc, r) => {
    if (!acc[r.product_id]) acc[r.product_id] = [];
    acc[r.product_id].push(r);
    return acc;
  }, {});

  if (loading) return <AdminSkeleton />;

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-4">Product Reviews</h1>

      {reviews.length === 0 ? (
        <p className="text-muted-foreground">No reviews yet.</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([productId, productReviews]) => (
            <div key={productId} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-lg">
                  {products[productId] || "Unknown Product"}
                </h2>
                <span className="text-sm text-muted-foreground">
                  {productReviews.length} review{productReviews.length !== 1 ? "s" : ""} · Avg:{" "}
                  {(productReviews.reduce((s, r) => s + r.rating, 0) / productReviews.length).toFixed(1)}⭐
                </span>
              </div>
              <div className="space-y-3">
                {productReviews.map((r) => (
                  <div key={r.id} className="flex items-start gap-3 border-t border-border pt-3 first:border-0 first:pt-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{r.reviewer_name}</span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`h-3.5 w-3.5 ${s <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(r.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{r.review_text}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive h-8 w-8 flex-shrink-0"
                      onClick={() => handleDelete(r.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReviews;

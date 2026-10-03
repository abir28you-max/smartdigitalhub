import { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import ProductCard from "@/components/ProductCard";
import { ShoppingCart, Star, CheckCircle, User, Share2, Tag, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getOptimizedImageUrl } from "@/lib/image";
import { sortProductsByStock } from "@/lib/productSort";

const FIXED_DESCRIPTION = `At Smart Digital Hub, we offer 100% Verified and Genuine premium digital product access with fast and secure delivery. Once your payment is successfully completed, you will receive your access details directly via your registered email instantly or within 2–30 minutes.

What You Will Receive
• 100% Verified and Genuine Product Access (Email + Password)
• We may require your email and password if the subscription needs to be activated on your personal email
• Quick and secure email delivery (within 2–5 minutes / 30 minutes to maximum 2 hours)
• Personalized access information just for you
• Smooth and safe user experience

Important Instructions
• The access details sent to your email are for your personal use only
• Please do not modify, change, or share your access information (email, password, or username)
• If access details are altered or shared, your product access may be automatically disabled
• Smart Digital Hub continuously monitors for unauthorized activity to ensure user security

Customer Support
If you face any issue or delay, feel free to contact our support team:
abir28you@gmail.com
WhatsApp: https://wa.me/8801516524644

Why Choose Smart Digital Hub
• 100% Verified and Genuine Product Access
• Trusted and reliable digital service platform
• Fast delivery and 24/7 customer support
• Affordable pricing for premium products`;

const DescriptionContent = ({ productDescription, longDescription }: { productDescription?: string | null; longDescription?: string | null }) => {
  const [expanded, setExpanded] = useState(false);
  // Prefer long_description (AI-generated SEO content), fallback to description, then fixed
  const rawContent = longDescription || productDescription;
  const isHtml = rawContent && rawContent.includes('<');
  const content = isHtml ? rawContent : FIXED_DESCRIPTION;

  if (isHtml) {
    const preview = content.replace(/<[^>]+>/g, '').slice(0, 300);
    return (
      <div>
        {expanded ? (
          <div
            className="text-sm text-muted-foreground prose prose-sm max-w-none prose-headings:text-foreground prose-strong:text-foreground prose-li:text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <p className="text-sm text-muted-foreground">{preview}...</p>
        )}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-primary text-sm font-medium mt-2"
        >
          {expanded ? "See Less" : "See More"}
        </button>
      </div>
    );
  }

  const preview = FIXED_DESCRIPTION.slice(0, 300);
  return (
    <div>
      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
        {expanded ? FIXED_DESCRIPTION : preview + "..."}
      </p>
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-primary text-sm font-medium mt-2"
      >
        {expanded ? "See Less" : "See More"}
      </button>
    </div>
  );
};

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  review_text: string;
  created_at: string;
}

const StarRating = ({ rating, onRate, interactive = false }: { rating: number; onRate?: (r: number) => void; interactive?: boolean }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`h-5 w-5 transition-transform duration-150 ${interactive ? "cursor-pointer hover-star-sparkle hover:scale-125" : ""} ${
          star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
        }`}
        onClick={() => interactive && onRate?.(star)}
      />
    ))}
  </div>
);

const ReviewsContent = ({ productId, autoOpen }: { productId: string; autoOpen?: boolean }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showForm, setShowForm] = useState(autoOpen || false);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase
      .from("product_reviews")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setReviews(data);
      });
  }, [productId]);

  const handleSubmit = async () => {
    if (!name.trim() || !reviewText.trim() || rating === 0) {
      toast({ title: "Please fill all fields and select a rating", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.from("product_reviews").insert({
      product_id: productId,
      reviewer_name: name.trim(),
      rating,
      review_text: reviewText.trim(),
    }).select().single();
    setSubmitting(false);
    if (error) {
      toast({ title: "Failed to submit review", variant: "destructive" });
    } else {
      setReviews((prev) => [data, ...prev]);
      setShowForm(false);
      setName("");
      setRating(0);
      setReviewText("");
      toast({ title: "Review submitted!" });
    }
  };

  return (
    <div>
      {/* Write review trigger */}
      <div
        className="flex items-center gap-3 mb-4 cursor-pointer"
        onClick={() => setShowForm(true)}
      >
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <User className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1 bg-muted rounded-full px-4 py-2.5 text-sm text-muted-foreground">
          Write your review...
        </div>
      </div>

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-muted-foreground text-sm">No reviews yet. Be the first to write one!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="border-b border-border pb-3 last:border-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="font-medium text-sm">{r.reviewer_name}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </div>
              <StarRating rating={r.rating} />
              <p className="text-sm text-muted-foreground mt-1">{r.review_text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Write Review Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-sm">
          <DialogTitle className="text-lg font-bold">Write a Review</DialogTitle>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-sm">Your Name</Label>
              <Input placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label className="text-sm">Your Rating</Label>
              <StarRating rating={rating} onRate={setRating} interactive />
            </div>
            <div>
              <Label className="text-sm">Your Review</Label>
              <Textarea placeholder="Share your thoughts..." value={reviewText} onChange={(e) => setReviewText(e.target.value)} rows={4} />
            </div>
          </div>
          <DialogFooter className="flex flex-row justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface OptionItem {
  name: string;
  price: number;
  in_stock?: boolean;
  warranty?: "full" | "none" | "hide";
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock_status: string;
  category_id: string | null;
  options: any;
  slug: string | null;
  seo_title?: string | null;
  meta_description?: string | null;
  long_description?: string | null;
  short_description?: string | null;
}

const parseOptions = (options: any): OptionItem[] => {
  if (!Array.isArray(options) || options.length === 0) return [];
  if (typeof options[0] === "string") {
    return (options as string[]).map((name) => ({ name, price: 0 }));
  }
  return options as OptionItem[];
};

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showCartDialog, setShowCartDialog] = useState(false);
  const { addItem } = useCart();
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const navigate = useNavigate();
  const reviewsRef = useRef<HTMLDivElement>(null);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponShake, setCouponShake] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      let { data } = await supabase.from("products").select("*").eq("slug", slug!).maybeSingle();
      if (!data) {
        const res = await supabase.from("products").select("*").eq("id", slug!).maybeSingle();
        data = res.data;
      }
      return data as Product | null;
    },
    enabled: !!slug,
    staleTime: 120_000,
    gcTime: 300_000,
    placeholderData: (prev) => prev,
  });

  // Set default selected option whenever product changes
  useEffect(() => {
    if (product) {
      const opts = parseOptions(product.options);
      if (opts.length > 0) {
        const firstAvailable = opts.find((o) => o.in_stock !== false) || opts[0];
        setSelectedOption(firstAvailable.name);
      }
    }
  }, [product?.id]);

  // Scroll to top on slug change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Set SEO title in document head
  useEffect(() => {
    if (!product) return;
    const seoTitle = product.seo_title || product.name || "";
    document.title = seoTitle;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (product.meta_description) {
      if (metaDesc) metaDesc.setAttribute("content", product.meta_description);
      else {
        const m = document.createElement("meta");
        m.name = "description";
        m.content = product.meta_description;
        document.head.appendChild(m);
      }
    }
    return () => { document.title = "Smart Digital Hub"; };
  }, [product]);

  // Auto-scroll to reviews when tab=reviews
  useEffect(() => {
    if (tabFromUrl === "reviews" && product && reviewsRef.current) {
      setTimeout(() => {
        reviewsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, [tabFromUrl, product]);

  const { data: related = [] } = useQuery({
    queryKey: ["related-products", product?.category_id, product?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, short_description, price, image_url, stock_status, category_id, slug, options, created_at")
        .eq("category_id", product!.category_id!)
        .neq("id", product!.id)
        .limit(8);
      return sortProductsByStock((data ?? []) as unknown as Product[]).slice(0, 4);
    },
    enabled: !!product?.category_id,
    staleTime: 60_000,
  });

  const parsedOptions = product ? parseOptions(product.options) : [];
  const selectedOptObj = parsedOptions.find((o) => o.name === selectedOption);
  const activePrice = selectedOptObj && selectedOptObj.price > 0 ? selectedOptObj.price : product?.price ?? 0;

  const productImage = getOptimizedImageUrl(product?.image_url, { width: 640, quality: 70 });

  const handleAddToCart = () => {
    addItem({
      id: product!.id,
      name: product!.name,
      price: activePrice,
      image_url: product!.image_url,
      quantity: 1,
      selectedOption: selectedOption || undefined,
    });
    setShowCartDialog(true);
  };

  // Reset any applied coupon when the product or option changes
  useEffect(() => {
    setAppliedCoupon(null);
    setCouponInput("");
  }, [product?.id, selectedOption]);

  const handleApplyCoupon = async () => {
    const code = couponInput.trim();
    if (!code || !product) {
      toast({ title: "Please enter a coupon code", variant: "destructive" });
      return;
    }
    setApplyingCoupon(true);
    try {
      // 1. Check Product-specific coupons from product_coupons table
      const { data: pCoupons } = await supabase
        .from("product_coupons")
        .select("*")
        .ilike("code", code)
        .eq("is_active", true);

      // Also check if product has direct coupon columns
      const { data: prodData } = await supabase
        .from("products")
        .select("id, coupon_code, coupon_discount, coupon_option")
        .eq("id", product.id)
        .maybeSingle();

      const candidateCoupons: Array<{
        product_id: string;
        discount_amount: number;
        discount_type: "percentage" | "fixed";
        option_name: string | null;
      }> = [];

      if (pCoupons && pCoupons.length > 0) {
        for (const c of pCoupons) {
          let optName = c.option_name || null;
          let discType: "percentage" | "fixed" = "fixed";
          if (optName && (optName.includes(":::percent") || optName === "__percent__")) {
            discType = "percentage";
            optName = optName.replace(":::percent", "").replace("__percent__", "").trim() || null;
          } else if (optName && (optName.includes(":::fixed") || optName === "__fixed__")) {
            discType = "fixed";
            optName = optName.replace(":::fixed", "").replace("__fixed__", "").trim() || null;
          } else {
            discType = "fixed";
          }
          candidateCoupons.push({
            product_id: c.product_id,
            discount_amount: Number(c.discount_amount),
            discount_type: discType,
            option_name: optName,
          });
        }
      }

      if (prodData && prodData.coupon_code && prodData.coupon_code.toUpperCase() === code.toUpperCase() && Number(prodData.coupon_discount) > 0) {
        let optName = prodData.coupon_option || null;
        let discType: "percentage" | "fixed" = "fixed";
        if (optName && (optName.includes(":::percent") || optName === "__percent__")) {
          discType = "percentage";
          optName = optName.replace(":::percent", "").replace("__percent__", "").trim() || null;
        } else if (optName && (optName.includes(":::fixed") || optName === "__fixed__")) {
          discType = "fixed";
          optName = optName.replace(":::fixed", "").replace("__fixed__", "").trim() || null;
        } else {
          discType = "fixed";
        }
        candidateCoupons.push({
          product_id: prodData.id,
          discount_amount: Number(prodData.coupon_discount),
          discount_type: discType,
          option_name: optName,
        });
      }

      const match = candidateCoupons.find((c) => {
        if (c.product_id !== product.id) return false;
        if (!c.option_name) return true;
        return c.option_name === selectedOption;
      });

      if (match && match.discount_amount > 0) {
        const val = match.discount_amount;
        const discountBDT = match.discount_type === "percentage"
          ? Math.min(activePrice, Math.round((activePrice * val) / 100))
          : Math.min(activePrice, val);

        setAppliedCoupon({ code: code.toUpperCase(), discount: discountBDT });
        const discountLabel = match.discount_type === "percentage" ? `${val}% (৳${discountBDT})` : `৳${discountBDT}`;
        toast({ title: `🎉 কুপন সফলভাবে যুক্ত হয়েছে! ${discountLabel} ছাড়` });
        return;
      }

      const wrongOption = candidateCoupons.find((c) => c.product_id === product.id);
      if (wrongOption && wrongOption.option_name) {
        toast({ title: `এই কুপনটি শুধুমাত্র "${wrongOption.option_name}" প্যাকেজে প্রযোজ্য`, variant: "destructive" });
        setAppliedCoupon(null);
        return;
      }

      // 2. Global coupon
      const { data: globalCoupon } = await supabase
        .from("coupons")
        .select("*")
        .ilike("code", code)
        .eq("is_active", true)
        .maybeSingle();

      if (globalCoupon && Number(globalCoupon.discount_amount) > 0) {
        const val = Number(globalCoupon.discount_amount);
        const isPercent = globalCoupon.discount_type === "percentage";

        if (globalCoupon.min_order_amount && activePrice < Number(globalCoupon.min_order_amount)) {
          toast({ title: `এই কুপনের জন্য সর্বনিম্ন ৳${globalCoupon.min_order_amount} টাকার অর্ডার প্রয়োজন`, variant: "destructive" });
          setAppliedCoupon(null);
          return;
        }

        let discountBDT = isPercent
          ? Math.min(activePrice, Math.round((activePrice * val) / 100))
          : Math.min(activePrice, val);

        if (globalCoupon.max_discount && discountBDT > Number(globalCoupon.max_discount)) {
          discountBDT = Number(globalCoupon.max_discount);
        }

        setAppliedCoupon({ code: code.toUpperCase(), discount: discountBDT });
        const discountLabel = isPercent ? `${val}% (৳${discountBDT})` : `৳${discountBDT}`;
        toast({ title: `🎉 কুপন সফলভাবে যুক্ত হয়েছে! ${discountLabel} ছাড়` });
      } else {
        if (candidateCoupons.length > 0) {
          toast({ title: "এই কুপনটি এই প্রোডাক্টে প্রযোজ্য নয়", variant: "destructive" });
        } else {
          toast({ title: "কুপন কোডটি সঠিক নয় অথবা মেয়াদ উত্তীর্ণ", variant: "destructive" });
        }
        setCouponShake(true);
        setTimeout(() => setCouponShake(false), 500);
        setAppliedCoupon(null);
      }
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleBuyNow = () => {
    if (!product) return;
    const state = {
      buyNowItem: {
        id: product.id,
        name: product.name,
        price: activePrice,
        image_url: product.image_url,
        quantity: 1,
        selectedOption: selectedOption || undefined,
      },
      coupon: appliedCoupon?.code,
    };
    if (!user) {
      navigate(`/auth?next=/checkout`, { state: { checkoutState: state } });
      return;
    }
    navigate("/checkout", { state });
  };

  // Prefer short_description (editable from admin), fallback to stripped description
  const shortDesc = product?.short_description
    || (product?.description ? product.description.replace(/<[^>]+>/g, "").slice(0, 100).trim() : "");

  if (isLoading || !product) {
    return (
      <div className="min-h-screen bg-background pb-16 md:pb-0">
        <Header />
        <BottomNav />
      </div>
    );
  }

  const options = parsedOptions;
  const selectedOutOfStock = !!selectedOptObj && selectedOptObj.in_stock === false;
  const unavailable = product.stock_status !== "in_stock" || selectedOutOfStock;

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      <div className="container mt-4 mb-8">
        {/* Product image */}
        <div className="relative bg-card rounded-2xl border border-border p-6 flex items-center justify-center aspect-square max-w-md mx-auto shadow-xs group overflow-hidden">
          {product.image_url ? (
            <img src={productImage} alt={product.name} width="400" height="400" fetchPriority="high" decoding="async" className="max-w-full max-h-full object-contain transition-transform duration-500 ease-out group-hover:scale-105" />
          ) : (
            <div className="w-24 h-24 bg-muted rounded-full" />
          )}
          {product.stock_status === "in_stock" ? (
            <span className="absolute top-3 left-3 bg-emerald-500/90 backdrop-blur-xs text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              In Stock
            </span>
          ) : (
            <span className="absolute top-3 left-3 bg-destructive/90 backdrop-blur-xs text-destructive-foreground text-xs font-bold px-3 py-1 rounded-full shadow-xs">
              Stock Out
            </span>
          )}
        </div>

        {/* Info */}
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold">{product.name}</h1>
            {product.stock_status !== "in_stock" && (
              <span className="text-destructive font-bold text-sm">[Stock Out]</span>
            )}
          </div>
          {shortDesc && (
            <p className="text-muted-foreground mt-1">{shortDesc}</p>
          )}
          {appliedCoupon ? (
            <div className="mt-3 flex items-baseline gap-2">
              <p className="text-price text-2xl font-bold">{formatPrice(Math.max(0, activePrice - appliedCoupon.discount))}</p>
              <p className="text-muted-foreground line-through text-base">{formatPrice(activePrice)}</p>
            </div>
          ) : (
            <p className="text-price text-2xl font-bold mt-3">{formatPrice(activePrice)}</p>
          )}
        </div>

        {/* Options */}
        {options.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Select an option</p>
            <div className="flex flex-wrap gap-2">
              {options.map((opt) => {
                const soldOut = opt.in_stock === false;
                return (
                  <button
                    key={opt.name}
                    disabled={soldOut}
                    onClick={() => setSelectedOption(opt.name)}
                    className={`px-3.5 py-1.5 rounded-full border text-sm transition-all duration-200 active:scale-95 ${
                      soldOut
                        ? "border-border text-muted-foreground/60 line-through opacity-60 cursor-not-allowed"
                        : selectedOption === opt.name
                        ? "border-primary bg-primary/15 text-primary font-bold shadow-2xs scale-[1.02]"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {opt.name}{opt.price > 0 ? ` - ${formatPrice(opt.price)}` : ""}
                    {soldOut ? " (Stock Out)" : ""}
                  </button>
                );
              })}
            </div>
            {selectedOptObj && (selectedOptObj.warranty === "full" || selectedOptObj.warranty === "none") && (
              <p className={`mt-2 text-xs font-medium ${selectedOptObj.warranty === "none" ? "text-amber-600" : "text-green-600"}`}>
                {selectedOptObj.warranty === "none" ? "Non Warranty" : "Full Warranty"}
              </p>
            )}
          </div>
        )}

        {/* Coupon */}
        <div className={`mt-4 bg-card rounded-xl border border-border p-3.5 shadow-2xs transition-all ${couponShake ? "animate-shake border-destructive/60" : ""}`}>
          <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
            <Tag className="h-4 w-4 text-primary" /> Have a coupon?
          </p>
          {appliedCoupon ? (
            <div className="flex items-center gap-2 animate-selection-pop">
              <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-full px-3 py-1 text-sm font-semibold flex items-center gap-1 shadow-2xs">
                <CheckCircle className="h-3.5 w-3.5" /> {appliedCoupon.code} (-{formatPrice(appliedCoupon.discount)})
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive text-xs hover:bg-destructive/10"
                onClick={() => { setAppliedCoupon(null); setCouponInput(""); }}
              >
                <X className="h-3 w-3 mr-1" /> Remove
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="ENTER CODE"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                className="rounded-lg"
              />
              <Button type="button" variant="outline" onClick={handleApplyCoupon} disabled={applyingCoupon} className="rounded-lg font-semibold active:scale-95">
                {applyingCoupon ? "..." : "Apply"}
              </Button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            className="flex-1 h-12 rounded-xl font-bold border-2 border-primary/50 text-primary hover:bg-primary/10 active:scale-95 transition-all shadow-xs"
            disabled={unavailable}
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
          <Button
            className="flex-1 h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground btn-shine active:scale-95 transition-all shadow-md hover:shadow-lg"
            disabled={unavailable}
            onClick={handleBuyNow}
          >
            Buy Now
          </Button>
        </div>

        {/* Share Button */}
        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full"
          onClick={async () => {
            const productUrl = `${window.location.origin}/product/${product.slug || product.id}`;
            if (navigator.share) {
              try {
                await navigator.share({ title: product.name, text: product.name, url: productUrl });
              } catch {}
            } else {
              await navigator.clipboard.writeText(productUrl);
              toast({ title: "লিংক কপি হয়েছে!" });
            }
          }}
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share Product
        </Button>

        {/* Added to Cart Dialog */}
        <Dialog open={showCartDialog} onOpenChange={setShowCartDialog}>
          <DialogContent className="max-w-xs text-center">
            <div className="flex flex-col items-center gap-3 pt-4">
              <CheckCircle className="h-14 w-14 text-green-500" />
              <DialogTitle className="text-lg font-bold">Added to Cart</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                '{product.name}' has been added to your cart.
              </DialogDescription>
              <Button className="w-full mt-2" onClick={() => setShowCartDialog(false)}>
                OK
              </Button>
            </div>
          </DialogContent>
        </Dialog>


        {/* Description & Reviews Tabs */}
        <div ref={reviewsRef}>
          <Tabs defaultValue={tabFromUrl === "reviews" ? "reviews" : "description"} className="mt-8">
            <TabsList className="w-full">
              <TabsTrigger value="description" className="flex-1">Description</TabsTrigger>
              <TabsTrigger value="reviews" className="flex-1">Reviews</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="bg-card rounded-lg border border-border p-4 mt-2">
              <DescriptionContent productDescription={product.description} longDescription={(product as any).long_description} />
            </TabsContent>
            <TabsContent value="reviews" className="bg-card rounded-lg border border-border p-4 mt-2">
              <ReviewsContent productId={product.id} autoOpen={tabFromUrl === "reviews"} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-8">
            <h3 className="font-display text-xl font-bold mb-4">Related Products</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {related.map((p) => (
                <ProductCard key={p.id} {...p} />
              ))}
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default ProductDetail;

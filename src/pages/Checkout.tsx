import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Copy, CheckCircle, ShieldCheck, Zap, Lock, Check, HelpCircle, ArrowRight, Sparkles, MessageCircle, ClipboardCheck } from "lucide-react";
import { PaymentLogo } from "@/components/PaymentLogo";

interface PaymentMethod {
  id: string;
  name: string;
  instructions: string | null;
  logo_url: string | null;
}

interface PaymentAccount {
  account_number: string | null;
  holder_name: string | null;
  branch: string | null;
}

interface CheckoutItem {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  quantity: number;
  selectedOption?: string;
}

const Checkout = () => {
  const { items: cartItems, totalPrice: cartTotal, clearCart } = useCart();
  const { formatPrice } = useCurrency();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPM, setSelectedPM] = useState<PaymentMethod | null>(null);
  const [account, setAccount] = useState<PaymentAccount | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", transactionId: "", coupon: "" });
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponShake, setCouponShake] = useState(false);
  const [ddProducts, setDdProducts] = useState<string[]>([]);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast({ title: `📋 ${fieldName} Copied!` });
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Support both cart checkout and direct "Buy Now" checkout
  const buyNowItem = (location.state as any)?.buyNowItem as CheckoutItem | undefined;
  const isBuyNow = !!buyNowItem;
  const items: CheckoutItem[] = isBuyNow ? [buyNowItem] : cartItems;
  const subtotal = isBuyNow ? buyNowItem.price * buyNowItem.quantity : cartTotal;
  const finalPrice = Math.max(0, subtotal - discount);

  useEffect(() => {
    supabase.rpc("get_payment_methods").then(({ data }) => {
      if (data && data.length > 0) {
        setPaymentMethods(data as PaymentMethod[]);
        setSelectedPM(data[0] as PaymentMethod);
      }
    });
  }, []);

  // Which products in this order require extra delivery details
  useEffect(() => {
    const ids = items.map((i) => i.id);
    if (ids.length === 0) return;
    let active = true;
    supabase
      .from("products")
      .select("id, requires_delivery_details")
      .in("id", ids)
      .then(({ data }) => {
        if (!active || !data) return;
        setDdProducts(
          (data as any[]).filter((p) => p.requires_delivery_details).map((p) => p.id as string)
        );
      });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map((i) => i.id).join(",")]);

  const needsDeliveryDetails = items.filter((i) => ddProducts.includes(i.id));
  const setDd = (id: string, field: "name" | "pin" | "email", value: string) =>
    setDdForm((prev) => ({
      ...prev,
      [id]: { name: "", pin: "", email: "", ...prev[id], [field]: value },
    }));

  // Account is required to place an order
  useEffect(() => {
    if (!authLoading && !user) navigate("/auth?next=/checkout", { replace: true });
  }, [authLoading, user, navigate]);

  // Prefill billing info from the signed-in customer's profile
  useEffect(() => {
    if (!user) return;
    let active = true;
    supabase
      .from("profiles")
      .select("full_name, phone, email")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setForm((f) => ({
          ...f,
          name: f.name || data?.full_name || "",
          phone: f.phone || data?.phone || "",
          email: f.email || data?.email || user.email || "",
        }));
      });
    return () => { active = false; };
  }, [user]);

  useEffect(() => {
    if (!selectedPM) { setAccount(null); return; }
    let active = true;
    supabase.rpc("get_payment_account", { p_id: selectedPM.id }).then(({ data }) => {
      if (active) setAccount((data as PaymentAccount[])?.[0] ?? null);
    });
    return () => { active = false; };
  }, [selectedPM]);

  const handleApplyCoupon = async () => {
    if (!form.coupon.trim()) {
      toast({ title: "Please enter a coupon code", variant: "destructive" });
      return;
    }
    setApplyingCoupon(true);
    const couponCode = form.coupon.trim();
    if (!couponCode) {
      toast({ title: "Please enter a coupon code", variant: "destructive" });
      setApplyingCoupon(false);
      return;
    }

    const productIds = items.map(i => i.id);

    // 1. First check if it's a product-specific coupon
    const { data: pCoupons } = await supabase
      .from("product_coupons")
      .select("*")
      .ilike("code", couponCode)
      .eq("is_active", true);

    const { data: prodsWithCoupons } = await supabase
      .from("products")
      .select("id, coupon_code, coupon_discount, coupon_option")
      .in("id", productIds);

    const candidateProductCoupons: Array<{
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
        candidateProductCoupons.push({
          product_id: c.product_id,
          discount_amount: Number(c.discount_amount),
          discount_type: discType,
          option_name: optName,
        });
      }
    }

    if (prodsWithCoupons && prodsWithCoupons.length > 0) {
      for (const p of prodsWithCoupons) {
        if (p.coupon_code && p.coupon_code.toUpperCase() === couponCode.toUpperCase() && Number(p.coupon_discount) > 0) {
          let optName = p.coupon_option || null;
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
          candidateProductCoupons.push({
            product_id: p.id,
            discount_amount: Number(p.coupon_discount),
            discount_type: discType,
            option_name: optName,
          });
        }
      }
    }

    const matchingProducts = candidateProductCoupons.filter(c => productIds.includes(c.product_id));

    if (matchingProducts.length > 0) {
      const eligibleProducts = matchingProducts.filter(p => {
        if (!p.option_name) return true;
        const cartItem = items.find(i => i.id === p.product_id);
        return cartItem?.selectedOption === p.option_name;
      });

      if (eligibleProducts.length === 0) {
        const requiredOption = matchingProducts[0].option_name;
        toast({ title: `এই কুপনটি শুধুমাত্র "${requiredOption}" প্যাকেজে প্রযোজ্য`, variant: "destructive" });
        setDiscount(0);
        setCouponApplied(false);
        setCouponShake(true);
        setTimeout(() => setCouponShake(false), 500);
      } else {
        const totalSuperDiscount = eligibleProducts.reduce((sum, p) => {
          const cartItem = items.find(i => i.id === p.product_id);
          const itemPrice = (cartItem?.price || 0) * (cartItem?.quantity || 1);
          const val = p.discount_amount;
          const disc = p.discount_type === "percentage"
            ? Math.round((itemPrice * val) / 100)
            : val;
          return sum + Math.min(itemPrice, disc);
        }, 0);

        if (totalSuperDiscount > 0) {
          setDiscount(totalSuperDiscount);
          setCouponApplied(true);
          toast({ title: `🎉 কুপন সফলভাবে যুক্ত হয়েছে! ৳${totalSuperDiscount} ছাড়` });
        } else {
          toast({ title: "Coupon has no discount set", variant: "destructive" });
          setDiscount(0);
          setCouponApplied(false);
          setCouponShake(true);
          setTimeout(() => setCouponShake(false), 500);
        }
      }
    } else {
      // Check global coupons
      const { data: globalCoupon } = await supabase
        .from("coupons")
        .select("*")
        .ilike("code", couponCode)
        .eq("is_active", true)
        .maybeSingle();

      if (!globalCoupon) {
        if (candidateProductCoupons.length > 0) {
          toast({ title: "এই কুপনটি আপনার কার্টের প্রোডাক্টে প্রযোজ্য নয়", variant: "destructive" });
        } else {
          toast({ title: "কুপন কোডটি সঠিক নয় অথবা মেয়াদ উত্তীর্ণ", variant: "destructive" });
        }
        setDiscount(0);
        setCouponApplied(false);
        setCouponShake(true);
        setTimeout(() => setCouponShake(false), 500);
      } else {
        const val = Number(globalCoupon.discount_amount);
        const isPercent = globalCoupon.discount_type === "percentage";
        const cartTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

        if (globalCoupon.min_order_amount && cartTotal < Number(globalCoupon.min_order_amount)) {
          toast({ title: `এই কুপনের জন্য সর্বনিম্ন ৳${globalCoupon.min_order_amount} টাকার অর্ডার প্রয়োজন`, variant: "destructive" });
          setDiscount(0);
          setCouponApplied(false);
          setCouponShake(true);
          setTimeout(() => setCouponShake(false), 500);
          setApplyingCoupon(false);
          return;
        }

        let calculatedDiscount = isPercent
          ? Math.min(cartTotal, Math.round((cartTotal * val) / 100))
          : Math.min(cartTotal, val);

        if (globalCoupon.max_discount && calculatedDiscount > Number(globalCoupon.max_discount)) {
          calculatedDiscount = Number(globalCoupon.max_discount);
        }

        setDiscount(calculatedDiscount);
        setCouponApplied(true);
        const label = isPercent ? `${val}% (৳${calculatedDiscount})` : `৳${calculatedDiscount}`;
        toast({ title: `🎉 কুপন সফলভাবে যুক্ত হয়েছে! ${label} ছাড়` });
      }
    }
    setApplyingCoupon(false);
  };

  const removeCoupon = () => {
    setDiscount(0);
    setCouponApplied(false);
    setForm({ ...form, coupon: "" });
  };

  // Auto-apply a coupon that was already entered on the product page
  const incomingCoupon = (location.state as any)?.coupon as string | undefined;
  const [autoApplied, setAutoApplied] = useState(false);
  useEffect(() => {
    if (!incomingCoupon || autoApplied || !user) return;
    setAutoApplied(true);
    setForm((f) => ({ ...f, coupon: incomingCoupon }));
  }, [incomingCoupon, autoApplied, user]);

  useEffect(() => {
    if (autoApplied && form.coupon === incomingCoupon && !couponApplied && !applyingCoupon) {
      handleApplyCoupon();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoApplied, form.coupon]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed || !selectedPM || items.length === 0) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    if (!user) {
      setLoading(false);
      navigate("/auth?next=/checkout", { replace: true });
      return;
    }
    const deliveryDetails = needsDeliveryDetails.map((i) => ({
      product_id: i.id,
      product_name: i.name,
      option: i.selectedOption ?? null,
      name: (ddForm[i.id]?.name || "").trim(),
      profile_pin: (ddForm[i.id]?.pin || "").trim(),
      email: (ddForm[i.id]?.email || "").trim() || null,
    }));
    if (deliveryDetails.some((d) => !d.name || !d.profile_pin)) {
      setLoading(false);
      toast({ title: "Please fill the Delivery Details", variant: "destructive" });
      return;
    }
    const { data: inserted, error } = await supabase.from("orders").insert({
      // Ownership always comes from the signed-in session, never from form data.
      user_id: user.id,
      customer_name: form.name,
      customer_phone: form.phone,
      customer_email: form.email || null,
      items: items.map((i) => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, option: i.selectedOption })),
      total_price: finalPrice,
      payment_method_id: selectedPM.id,
      transaction_id: form.transactionId,
      coupon_code: couponApplied ? form.coupon.trim().toUpperCase() : null,
      status: "pending",
      delivery_details: deliveryDetails.length > 0 ? deliveryDetails : null,
    } as any).select("id").maybeSingle();
    setLoading(false);
    if (error) {
      toast({ title: "Order failed", description: error.message, variant: "destructive" });
    } else {
      // Sync customer phone and name to user profile
      if (user?.id && form.phone.trim()) {
        supabase.from("profiles").upsert({
          id: user.id,
          full_name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email?.trim() || user.email,
        }).then(() => {});
      }

      // Fire-and-forget Telegram notification (never blocks or breaks checkout)
      supabase.functions
        .invoke("telegram-notify", {
          body: {
            type: "order",
            data: {
              order_id: inserted?.id,
              name: form.name,
              phone: form.phone,
              email: form.email || "-",
              product: items
                .map((i) => `${i.name}${i.selectedOption ? ` (${i.selectedOption})` : ""} × ${i.quantity}`)
                .join(", "),
              payment_method: selectedPM.name,
              transaction_id: form.transactionId,
              total: finalPrice,
              delivery_details: deliveryDetails.length
                ? deliveryDetails
                    .map(
                      (d) =>
                        `${d.product_name} → Name: ${d.name}, PIN: ${d.profile_pin}${d.email ? `, Email: ${d.email}` : ""}`
                    )
                    .join(" | ")
                : undefined,
            },
          },
        })
        .catch((err) => console.error("Telegram order notification failed:", err));
      if (!isBuyNow) clearCart();
      toast({ title: "Order placed successfully!", description: "We will verify your payment soon." });
      navigate("/order-success");
    }
  };

  if (items.length === 0) {
    navigate("/cart");
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      <form onSubmit={handleSubmit} className="container mt-4 mb-8 space-y-4">
        <h1 className="font-display text-2xl font-bold">Secure Checkout</h1>

        {/* Order summary */}
        <div className="bg-card rounded-lg border border-border p-4">
          <h2 className="font-display font-bold mb-3">Order Summary</h2>
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
              <div className="w-12 h-12 bg-muted rounded flex items-center justify-center flex-shrink-0">
                {item.image_url && <img src={item.image_url} alt="" className="w-full h-full object-contain rounded" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
              </div>
              <span className="font-bold text-sm">{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            {couponApplied && (
              <div className="flex justify-between text-red-600">
                <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Coupon Discount</span>
                <span>-{formatPrice(discount)}</span>
              </div>
            )}
            <div className="flex justify-between"><span>Shipping</span><span>Free</span></div>
            <div className="flex justify-between font-bold text-base border-t border-border pt-2 mt-2">
              <span>Total</span><span>{formatPrice(finalPrice)}</span>
            </div>
          </div>
          <div className={`mt-3 p-3 rounded-lg border border-border/80 transition-all ${couponShake ? "animate-shake border-destructive/60 bg-destructive/5" : ""}`}>
            <Label className="text-xs font-semibold">Coupon Code</Label>
            {couponApplied ? (
              <div className="flex items-center gap-2 mt-1 animate-selection-pop">
                <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-full px-3 py-1 text-sm font-semibold flex items-center gap-1 shadow-2xs">
                  <CheckCircle className="h-3.5 w-3.5" /> {form.coupon.toUpperCase()}
                </span>
                <Button type="button" variant="ghost" size="sm" className="text-destructive text-xs hover:bg-destructive/10" onClick={removeCoupon}>Remove</Button>
              </div>
            ) : (
              <div className="flex gap-2 mt-1">
                <Input placeholder="ENTER CODE" value={form.coupon} onChange={(e) => setForm({ ...form, coupon: e.target.value })} className="rounded-lg" />
                <Button type="button" variant="outline" size="sm" onClick={handleApplyCoupon} disabled={applyingCoupon} className="rounded-lg font-semibold active:scale-95">
                  {applyingCoupon ? "..." : "Apply"}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Delivery details (only for selected products) */}
        {needsDeliveryDetails.length > 0 && (
          <div className="bg-card rounded-lg border border-primary/30 p-4">
            <h2 className="font-display font-bold mb-1">Delivery Details</h2>
            <p className="text-xs text-muted-foreground mb-3">
              Required to set up your subscription profile.
            </p>
            <div className="space-y-4">
              {needsDeliveryDetails.map((item) => (
                <div key={item.id} className="rounded-lg border border-border p-3 space-y-3">
                  <p className="text-sm font-medium">
                    {item.name}
                    {item.selectedOption ? ` (${item.selectedOption})` : ""}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Name</Label>
                      <Input
                        required
                        placeholder="Profile name"
                        value={ddForm[item.id]?.name || ""}
                        onChange={(e) => setDd(item.id, "name", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Profile Pin</Label>
                      <Input
                        required
                        inputMode="numeric"
                        maxLength={8}
                        placeholder="e.g. 2706"
                        value={ddForm[item.id]?.pin || ""}
                        onChange={(e) => setDd(item.id, "pin", e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Customer Email (optional)</Label>
                    <Input
                      type="email"
                      placeholder="Optional"
                      value={ddForm[item.id]?.email || ""}
                      onChange={(e) => setDd(item.id, "email", e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Billing info */}
        <div className="bg-card rounded-lg border border-border p-4">
          <h2 className="font-display font-bold mb-3">Billing Information</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Full Name</Label>
              <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Phone Number</Label>
              <Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="mt-3">
            <Label className="text-xs">Email Address</Label>
            <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
        </div>

        {/* Payment */}
        <div className="bg-card rounded-2xl border border-border p-4 sm:p-6 space-y-4 shadow-xs">
          <div>
            <h2 className="font-display font-bold text-lg sm:text-xl flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" /> Payment Method / পেমেন্ট মাধ্যম
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              পেমেন্ট করার জন্য নিচের যেকোনো একটি মেথড সিলেক্ট করুন
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {paymentMethods.map((pm) => {
              const isSelected = selectedPM?.id === pm.id;
              return (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setSelectedPM(pm)}
                  className={`p-3 rounded-2xl border-2 flex items-center gap-3 transition-all text-left active:scale-95 ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/30 scale-[1.02] animate-selection-pop"
                      : "border-border/80 hover:border-primary/40 bg-card hover:shadow-xs"
                  }`}
                >
                  <PaymentLogo name={pm.name} logoUrl={pm.logo_url} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs sm:text-sm font-bold truncate ${isSelected ? "text-primary" : "text-foreground"}`}>
                      {pm.name}
                    </p>
                    <span className="text-[10px] text-muted-foreground block font-medium">
                      {isSelected ? "Selected ✓" : "Pay with"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedPM && (
            <div className="pt-4 border-t border-border space-y-4 animate-fade-in-up">
              {/* Payment Method Header Banner */}
              <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-3.5 rounded-2xl border border-primary/20">
                <div className="flex items-center gap-2.5">
                  <PaymentLogo name={selectedPM.name} logoUrl={selectedPM.logo_url} size="sm" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                      {selectedPM.name} Payment Instructions
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      নিচের নাম্বারে <strong>Send Money</strong> করে ট্রানজেকশন আইডি (TrxID) দিন
                    </p>
                  </div>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 rounded-full">
                  <CheckCircle className="h-3.5 w-3.5" /> 0% Extra Fee
                </span>
              </div>

              {/* Number & Amount Copy Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Account Number Box */}
                {account?.account_number && (() => {
                  const isBank = selectedPM.name.toLowerCase().includes("bank");
                  const isBinance = selectedPM.name.toLowerCase().includes("binance") || selectedPM.name.toLowerCase().includes("binnace");
                  const label = isBank ? "Bank Account Number" : isBinance ? "Binance Pay ID" : `${selectedPM.name} Personal Number`;
                  const isCopied = copiedField === "number";

                  return (
                    <div className="bg-background rounded-2xl p-4 border border-border shadow-2xs space-y-2 relative">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">{label}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2.5 text-xs font-bold text-primary hover:bg-primary/10 gap-1 rounded-lg"
                          onClick={() => copyToClipboard(account.account_number || "", "number")}
                        >
                          {isCopied ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-green-600" /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" /> Copy Number
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="font-mono font-extrabold text-lg sm:text-xl text-foreground tracking-wider select-all">
                        {account.account_number}
                      </p>
                      {isBank && account.holder_name && (
                        <div className="flex justify-between text-xs border-t border-border/80 pt-2 text-muted-foreground">
                          <span>Account Holder:</span>
                          <span className="font-semibold text-foreground">{account.holder_name}</span>
                        </div>
                      )}
                      {isBank && account.branch && (
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Branch:</span>
                          <span className="font-semibold text-foreground">{account.branch}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Amount to Send Box */}
                <div className="bg-background rounded-2xl p-4 border border-border shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Exact Amount to Send</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2.5 text-xs font-bold text-primary hover:bg-primary/10 gap-1 rounded-lg"
                      onClick={() => copyToClipboard(finalPrice.toString(), "amount")}
                    >
                      {copiedField === "amount" ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-green-600" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" /> Copy Amount
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="font-extrabold text-xl sm:text-2xl text-primary font-display">
                      {formatPrice(finalPrice)}
                    </p>
                    <span className="text-[11px] text-muted-foreground">
                      (কোনো অতিরিক্ত খরচ নেই)
                    </span>
                  </div>
                </div>
              </div>

              {/* Step by Step Visual Payment Guide */}
              <div className="bg-muted/40 rounded-2xl p-4 border border-border/70 space-y-2.5 text-xs sm:text-sm">
                <p className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> ধাপে ধাপে পেমেন্ট করার নিয়ম:
                </p>

                {(() => {
                  const name = selectedPM.name;
                  const isBank = name.toLowerCase().includes("bank");
                  const isBinance = name.toLowerCase().includes("binance") || name.toLowerCase().includes("binnace");

                  if (isBinance) {
                    const usdtAmount = (finalPrice / 130).toFixed(2);
                    return (
                      <ol className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <span className="h-5 w-5 rounded-full bg-primary/20 text-primary font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                          <span><strong>Binance</strong> অ্যাপ ওপেন করে <strong>Pay</strong> আইকনে ট্যাপ করুন।</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="h-5 w-5 rounded-full bg-primary/20 text-primary font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                          <span><strong>Send to Binance User</strong> সিলেক্ট করে <strong>Binance ID</strong> দিন।</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="h-5 w-5 rounded-full bg-primary/20 text-primary font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                          <span>অ্যামাউন্টে <strong>${usdtAmount} USDT</strong> দিয়ে পেমেন্ট কনফার্ম করুন।</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="h-5 w-5 rounded-full bg-primary/20 text-primary font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">4</span>
                          <span>পেমেন্ট সফল হলে <strong>TxID</strong> কপি করে নিচের বক্সে পেস্ট করুন।</span>
                        </li>
                      </ol>
                    );
                  }

                  if (isBank) {
                    return (
                      <ol className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <span className="h-5 w-5 rounded-full bg-primary/20 text-primary font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                          <span>ব্যাংকিং অ্যাপে গিয়ে <strong>Fund Transfer (NPSB/BEFTN)</strong> সিলেক্ট করুন।</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="h-5 w-5 rounded-full bg-primary/20 text-primary font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                          <span>অ্যাকাউন্ট নম্বর এবং অ্যামাউন্টে <strong>{formatPrice(finalPrice)}</strong> লিখে ট্রান্সফার করুন।</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="h-5 w-5 rounded-full bg-primary/20 text-primary font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                          <span>ট্রান্সফারের <strong>Transaction / Reference No.</strong> নিচের বক্সে পেস্ট করুন।</span>
                        </li>
                      </ol>
                    );
                  }

                  return (
                    <ol className="space-y-2 text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="h-5 w-5 rounded-full bg-primary/20 text-primary font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                        <span>আপনার <strong>{name}</strong> অ্যাপ ওপেন করে <strong>Send Money (সেন্ড মানি)</strong> অপশনে যান।</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-5 w-5 rounded-full bg-primary/20 text-primary font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                        <span>উপরে দেওয়া <strong>{name} নাম্বারটি</strong> পেস্ট করুন এবং অ্যামাউন্টে <strong>{formatPrice(finalPrice)}</strong> লিখুন।</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-5 w-5 rounded-full bg-primary/20 text-primary font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                        <span>পেমেন্ট সফল হওয়ার পর স্ক্রিন থেকে <strong>Transaction ID (TrxID)</strong> কপি করুন।</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-5 w-5 rounded-full bg-primary/20 text-primary font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">4</span>
                        <span>কপি করা <strong>TrxID টি</strong> নিচের ইনপুট বক্সে পেস্ট করে অর্ডার সম্পন্ন করুন।</span>
                      </li>
                    </ol>
                  );
                })()}
              </div>

              {/* Transaction ID Input with Helper & Live Validation */}
              <div className="bg-background rounded-2xl p-4 border border-border space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <ClipboardCheck className="h-4 w-4 text-primary" /> Transaction ID (TrxID)
                  </Label>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText();
                        if (text) {
                          setForm((prev) => ({ ...prev, transactionId: text.trim().toUpperCase() }));
                          toast({ title: "Pasted from clipboard! 📋" });
                        }
                      } catch {
                        toast({ title: "Please paste manually", variant: "destructive" });
                      }
                    }}
                    className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                  >
                    Paste TrxID
                  </button>
                </div>

                <div className="relative">
                  <Input
                    placeholder={
                      selectedPM.name.toLowerCase().includes("bkash")
                        ? "e.g. BKL87DF29X (10 digits/letters)"
                        : selectedPM.name.toLowerCase().includes("nagad")
                        ? "e.g. 71A89D2F (8 digits/letters)"
                        : "Enter Transaction ID"
                    }
                    required
                    value={form.transactionId}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        transactionId: e.target.value.replace(/\s+/g, "").toUpperCase(),
                      })
                    }
                    className="rounded-xl font-mono text-sm sm:text-base font-bold tracking-wider h-11 pr-10 border-2 focus-visible:ring-primary/20"
                  />
                  {form.transactionId.trim().length >= 6 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 dark:text-green-400">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                  )}
                </div>

                {form.transactionId.trim().length >= 6 ? (
                  <p className="text-[11px] text-green-600 dark:text-green-400 font-semibold flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> Valid Transaction ID format entered
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    💡 সঠিক TrxID দিলে সাধারণত ৫-১০ মিনিটের মধ্যে একাউন্ট এক্সেস ডেলিভারি পেয়ে যাবেন।
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Trust & Guarantee Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="bg-card border border-border/70 rounded-xl p-3 text-center space-y-1">
            <Zap className="h-4 w-4 text-amber-500 mx-auto" />
            <p className="text-xs font-bold text-foreground">৫-১০ মি. ডেলিভারি</p>
            <p className="text-[10px] text-muted-foreground">অটোমেটিক ভেরিফিকেশন</p>
          </div>
          <div className="bg-card border border-border/70 rounded-xl p-3 text-center space-y-1">
            <ShieldCheck className="h-4 w-4 text-emerald-500 mx-auto" />
            <p className="text-xs font-bold text-foreground">১০০% ওয়ারেন্টি</p>
            <p className="text-[10px] text-muted-foreground">ফুল মেয়াদ রিপ্লেসমেন্ট</p>
          </div>
          <div className="bg-card border border-border/70 rounded-xl p-3 text-center space-y-1">
            <Lock className="h-4 w-4 text-indigo-500 mx-auto" />
            <p className="text-xs font-bold text-foreground">নিরাপদ পেমেন্ট</p>
            <p className="text-[10px] text-muted-foreground">SSL সিকিউরড সিস্টেম</p>
          </div>
          <div className="bg-card border border-border/70 rounded-xl p-3 text-center space-y-1">
            <MessageCircle className="h-4 w-4 text-green-500 mx-auto" />
            <p className="text-xs font-bold text-foreground">২৪/৭ লাইভ সাপোর্ট</p>
            <p className="text-[10px] text-muted-foreground">+8801516524644</p>
          </div>
        </div>

        {/* Agreement */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2">
            <Checkbox id="terms-agree" checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} />
            <label htmlFor="terms-agree" className="text-xs sm:text-sm text-foreground cursor-pointer select-none">
              I agree to the <a href="/terms" target="_blank" className="text-primary font-semibold underline">Terms & Conditions</a> and <a href="/refund" target="_blank" className="text-primary font-semibold underline">Refund Policy</a>
            </label>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-12 sm:h-14 rounded-2xl font-extrabold text-base sm:text-lg btn-shine shadow-lg hover:shadow-xl active:scale-95 transition-all gap-2"
          disabled={loading || !agreed}
        >
          {loading ? (
            "Placing Order..."
          ) : (
            <>
              Confirm & Place Order <ArrowRight className="h-5 w-5" />
            </>
          )}
        </Button>
      </form>
      <BottomNav />
    </div>
  );
};

export default Checkout;

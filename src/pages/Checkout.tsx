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
import { Copy, CheckCircle } from "lucide-react";
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
  const [ddProducts, setDdProducts] = useState<string[]>([]);
  const [ddForm, setDdForm] = useState<Record<string, { name: string; pin: string; email: string }>>({});

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

    // First check if it's a product-specific (super) coupon
    const productIds = items.map(i => i.id);
    const { data: allProductCoupons } = await supabase.rpc("get_product_coupons_by_code", { p_code: couponCode });
    const matchingProducts = (allProductCoupons || [])
      .filter((c: any) => productIds.includes(c.product_id))
      .map((c: any) => ({
        id: c.product_id,
        coupon_discount: Number(c.discount_amount) || 0,
        coupon_option: c.option_name,
      }));

    if (matchingProducts && matchingProducts.length > 0) {
      // Check if coupon_option is set and if the selected option matches
      const eligibleProducts = matchingProducts.filter(p => {
        const couponOption = (p as any).coupon_option;
        if (!couponOption) return true; // No specific option set, applies to all
        // Find the matching cart item and check its selectedOption
        const cartItem = items.find(i => i.id === p.id);
        return cartItem?.selectedOption === couponOption;
      });

      if (eligibleProducts.length === 0) {
        const requiredOption = (matchingProducts[0] as any).coupon_option;
        toast({ title: `এই কুপনটি শুধুমাত্র "${requiredOption}" প্যাকেজে কাজ করবে`, variant: "destructive" });
        setDiscount(0);
        setCouponApplied(false);
      } else {
        const totalSuperDiscount = eligibleProducts.reduce((sum, p) => {
          const cartItem = items.find(i => i.id === p.id);
          const itemPrice = (cartItem?.price || 0) * (cartItem?.quantity || 1);
          const val = Number((p as any).coupon_discount) || 0;
          const disc = val <= 100 ? Math.round((itemPrice * val) / 100) : val;
          return sum + Math.min(itemPrice, disc);
        }, 0);

        if (totalSuperDiscount > 0) {
          setDiscount(totalSuperDiscount);
          setCouponApplied(true);
          toast({ title: `🎉 Super Coupon applied! ৳${totalSuperDiscount} discount on eligible product` });
        } else {
          toast({ title: "Coupon has no discount set", variant: "destructive" });
          setDiscount(0);
          setCouponApplied(false);
        }
      }
    } else {
      // Check if it's a global coupon (not assigned to any specific product)
      const { data: globalCoupon } = await supabase
        .from("coupons")
        .select("*")
        .ilike("code", couponCode)
        .eq("is_active", true)
        .maybeSingle();

      if (!globalCoupon) {
        // Coupon may exist but belong to a product that's not in the cart
        if (allProductCoupons && allProductCoupons.length > 0) {
          toast({ title: "এই কুপনটি আপনার কার্টের প্রোডাক্টে প্রযোজ্য নয়", variant: "destructive" });
        } else {
          toast({ title: "Invalid or expired coupon code", variant: "destructive" });
        }
        setDiscount(0);
        setCouponApplied(false);
      } else {
        const val = Number(globalCoupon.discount_amount);
        const cartTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const calculatedDiscount = val <= 100 ? Math.min(cartTotal, Math.round((cartTotal * val) / 100)) : Math.min(cartTotal, val);
        setDiscount(calculatedDiscount);
        setCouponApplied(true);
        const label = val <= 100 ? `${val}% (৳${calculatedDiscount})` : `৳${calculatedDiscount}`;
        toast({ title: `🎉 Coupon applied! ${label} discount` });
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
          <div className="mt-3">
            <Label className="text-xs">Coupon Code</Label>
            {couponApplied ? (
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-red-50 text-red-700 border border-red-200 rounded-full px-3 py-1 text-sm font-medium flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> {form.coupon.toUpperCase()}
                </span>
                <Button type="button" variant="ghost" size="sm" className="text-destructive text-xs" onClick={removeCoupon}>Remove</Button>
              </div>
            ) : (
              <div className="flex gap-2 mt-1">
                <Input placeholder="ENTER CODE" value={form.coupon} onChange={(e) => setForm({ ...form, coupon: e.target.value })} />
                <Button type="button" variant="outline" size="sm" onClick={handleApplyCoupon} disabled={applyingCoupon}>
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
        <div className="bg-card rounded-xl border border-border p-4 sm:p-5 space-y-3">
          <h2 className="font-display font-bold text-base sm:text-lg">Payment Details</h2>
          <p className="text-xs text-muted-foreground">Select your preferred payment method</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 mb-3">
            {paymentMethods.map((pm) => {
              const isSelected = selectedPM?.id === pm.id;
              return (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setSelectedPM(pm)}
                  className={`p-2.5 rounded-xl border-2 flex items-center gap-2.5 transition-all text-left ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/30"
                      : "border-border hover:border-muted-foreground/40 bg-card"
                  }`}
                >
                  <PaymentLogo name={pm.name} logoUrl={pm.logo_url} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold truncate ${isSelected ? "text-primary" : "text-foreground"}`}>
                      {pm.name}
                    </p>
                    <span className="text-[10px] text-muted-foreground block">
                      {isSelected ? "Selected ✓" : "Pay with"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedPM && (
            <div className="pt-4 border-t border-border space-y-4">
              <div className="flex items-center gap-2.5 bg-muted/30 p-2.5 rounded-xl border border-border">
                <PaymentLogo name={selectedPM.name} logoUrl={selectedPM.logo_url} size="sm" />
                <div>
                  <p className="text-xs font-bold text-foreground">{selectedPM.name}</p>
                  <p className="text-[11px] text-muted-foreground">নিচের নাম্বারে টাকা পাঠিয়ে TrxID লিখুন</p>
                </div>
              </div>
              {account?.account_number && (() => {
                const isBank = selectedPM.name.toLowerCase().includes("bank");
                const isBinance = selectedPM.name.toLowerCase().includes("binance") || selectedPM.name.toLowerCase().includes("binnace");
                const label = isBank ? "Account Number" : isBinance ? "Binance ID" : `${selectedPM.name} Number`;
                return (
                  <div className="space-y-2 bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <button
                        type="button"
                        className="text-xs text-primary flex items-center gap-1"
                        onClick={() => {
                          navigator.clipboard.writeText(account.account_number || "");
                          toast({ title: "Copied!" });
                        }}
                      >
                        <Copy className="h-3 w-3" /> Copy
                      </button>
                    </div>
                    <p className="font-mono font-bold text-base tracking-wide">{account.account_number}</p>
                    {isBank && account.holder_name && (
                      <div className="flex justify-between text-sm border-t border-border pt-2 mt-1">
                        <span className="text-muted-foreground">Holder Name</span>
                        <span className="font-medium">{account.holder_name}</span>
                      </div>
                    )}
                    {isBank && account.branch && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Branch</span>
                        <span className="font-medium">{account.branch}</span>
                      </div>
                    )}
                  </div>
                );
              })()}
              <div className="space-y-3 text-sm">
                {(() => {
                  const name = selectedPM.name;
                  const isBank = name.toLowerCase().includes("bank");
                  const isBinance = name.toLowerCase().includes("binance") || name.toLowerCase().includes("binnace");
                  
                  if (isBinance) {
                    const usdtAmount = (finalPrice / 130).toFixed(2);
                    return (
                      <>
                        <p>1. Open <strong>Binance</strong> app → tap <strong>Pay</strong> (top of home).</p>
                        <p>2. Select <strong>"Send to Binance User"</strong> → tap <strong>Binance ID</strong> tab.</p>
                        <p>3. Paste the <strong>Binance ID</strong> shown above and tap <strong>Continue</strong>.</p>
                        <p>4. Enter <strong>${usdtAmount} USDT</strong> as the amount and confirm payment.</p>
                        <p>5. Copy the <strong>Transaction ID (TxID)</strong> and paste it below.</p>
                      </>
                    );
                  }
                  
                  if (isBank) {
                    return (
                      <>
                        <p>1. আপনার ব্যাংকিং অ্যাপ ওপেন করুন এবং <strong>Fund Transfer</strong> অপশনে যান।</p>
                        <p>2. <strong>NPSB</strong> সিলেক্ট করুন।</p>
                        <p>3. <strong>Select Bank Name</strong> থেকে <strong>Pubali Bank</strong> সিলেক্ট করুন।</p>
                        <p>4. <strong>Receiver A/C No.</strong> তে নিচের অ্যাকাউন্ট নম্বরটি পেস্ট করুন।</p>
                        <p>5. Amount এ <strong>৳{finalPrice.toFixed(2)}</strong> লিখুন এবং পেমেন্ট সম্পন্ন করুন।</p>
                        <p>6. পেমেন্ট সফল হলে <strong>Transaction ID</strong> কপি করে নিচের বক্সে পেস্ট করুন।</p>
                      </>
                    );
                  }
                  
                  return (
                    <>
                      <p>1. Copy the <strong>{name} Number</strong>.</p>
                      <p>2. In your <strong>{name}</strong> app, use the <strong>Send Money</strong> option.</p>
                      <p>3. Enter <strong>৳{finalPrice.toFixed(2)}</strong> as the amount and complete the payment.</p>
                      <p>4. After the payment is successful, copy the <strong>Transaction ID</strong>.</p>
                      <p>5. Paste the <strong>Transaction ID</strong> into the box below to complete your order.</p>
                    </>
                  );
                })()}
              </div>
              <div>
                <Label className="text-xs">Transaction ID</Label>
                <Input
                  placeholder="Enter the Transaction ID"
                  required
                  value={form.transactionId}
                  onChange={(e) => setForm({ ...form, transactionId: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>

        {/* Agreement */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} />
            <span className="text-sm">I agree to the <a href="/terms" className="text-primary font-medium">Terms and Conditions</a></span>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading || !agreed}>
          {loading ? "Placing Order..." : "Place Order"}
        </Button>
      </form>
      <BottomNav />
    </div>
  );
};

export default Checkout;

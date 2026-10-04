import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Package,
  CheckCircle2,
  Gift,
  Star,
  Clock,
  Copy,
  Check,
  ShieldCheck,
  MessageCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { RedeemVideoPlayer } from "@/components/RedeemVideoPlayer";

interface OrderItem {
  id?: string;
  name: string;
  quantity: number;
  option?: string;
  price?: number;
}

interface DeliveryNote {
  note: string;
  link: string;
  video_url?: string;
}

interface Order {
  id: string;
  created_at: string;
  total_price: number;
  status: string;
  items: OrderItem[];
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  transaction_id: string | null;
  payment_methods?: { name: string } | null;
  delivery_notes?: DeliveryNote[] | null;
  delivery_details?: string | null;
}

const TrackOrder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "delivered">("all");

  const fetchUserOrders = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*, payment_methods(name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders((data as unknown as Order[]) || []);
    } catch (err: any) {
      console.error("Failed to load user orders:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleSearchWithTrx = useCallback(async (trxToSearch: string) => {
    if (!trxToSearch.trim()) return;
    setLoading(true);
    try {
      const { data: dbData } = await supabase
        .from("orders")
        .select("*, payment_methods(name)")
        .ilike("transaction_id", `%${trxToSearch.trim()}%`)
        .order("created_at", { ascending: false });

      if (dbData && dbData.length > 0) {
        setOrders(dbData as unknown as Order[]);
      } else {
        const { data, error } = await supabase.functions.invoke("get-orders-by-phone", {
          body: { transaction_id: trxToSearch.trim() },
        });
        if (error) throw error;
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserOrders();
    } else if (searchParams.get("trx")) {
      handleSearchWithTrx(searchParams.get("trx")!);
    } else {
      setLoading(false);
    }
  }, [user, searchParams, fetchUserOrders, handleSearchWithTrx]);

  // Realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("realtime-user-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            const updated = payload.new as Order;
            if (updated.status === "delivered") {
              toast({
                title: "🎉 Order Delivered!",
                description: "Your subscription account details are ready below.",
              });
            } else if (updated.status === "verified") {
              toast({
                title: "✅ Payment Approved!",
                description: "Your order is now being processed for delivery.",
              });
            }
          }
          fetchUserOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchUserOrders]);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({ title: "Copied to clipboard! 📋" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const shortId = (id: string) => "#" + id.replace(/-/g, "").slice(0, 8).toUpperCase();

  const filteredOrders = useMemo(() => {
    if (activeTab === "pending") {
      return orders.filter((o) => o.status === "pending" || o.status === "verified");
    }
    if (activeTab === "delivered") {
      return orders.filter((o) => o.status === "delivered");
    }
    return orders;
  }, [orders, activeTab]);

  const pendingCount = useMemo(
    () => orders.filter((o) => o.status === "pending" || o.status === "verified").length,
    [orders]
  );
  const deliveredCount = useMemo(
    () => orders.filter((o) => o.status === "delivered").length,
    [orders]
  );

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-10">
      <Header hideSearch={true} />

      <main className="container max-w-2xl mt-4 mb-8 space-y-6 px-4">
        {/* Header Hero Section */}
        <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                My Orders & Subscriptions
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Live status of your orders and subscription access details
              </p>
            </div>

            {user && (
              <Button
                variant="outline"
                size="sm"
                onClick={fetchUserOrders}
                disabled={loading}
                className="self-start sm:self-auto rounded-xl gap-2 h-9"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-primary" : ""}`} />
                Refresh
              </Button>
            )}
          </div>
        </div>

        {/* Tab Filters */}
        {orders.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold ${
                activeTab === "all"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              All Orders ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                activeTab === "pending"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card border border-border text-foreground hover:text-foreground"
              }`}
            >
              <Clock className="h-3.5 w-3.5 text-amber-500" /> Processing ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab("delivered")}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                activeTab === "delivered"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card border border-border text-foreground hover:text-foreground"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500" /> Delivered ({deliveredCount})
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-4">
            <div className="h-44 rounded-3xl bg-card border-2 border-amber-200 p-6" />
            <div className="h-56 rounded-3xl bg-amber-50/50 border-2 border-amber-200 p-6" />
          </div>
        )}

        {/* Empty State */}
        {!loading && orders.length === 0 && (
          <div className="bg-card border border-border rounded-2xl p-8 sm:p-12 text-center space-y-4 shadow-xs">
            <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Package className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-lg text-foreground">
                No orders found
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Browse our digital products and premium subscriptions to place your first order.
              </p>
            </div>
            <div className="pt-2">
              <Button asChild className="rounded-xl px-6">
                <Link to="/products">Browse All Subscriptions</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Orders List: Two Separate Cards per Order */}
        <div className="space-y-8">
          {filteredOrders.map((o) => {
            const items = Array.isArray(o.items) ? o.items : [];
            const isDelivered = o.status === "delivered";
            const isPending = o.status === "pending" || o.status === "verified";
            const pm = o.payment_methods as { name: string } | null;
            const hasDeliveryInfo =
              (Array.isArray(o.delivery_notes) && o.delivery_notes.length > 0) ||
              Boolean(o.delivery_details);

            return (
              <div key={o.id} className="space-y-4">
                {/* ══════════════════════════════════════════════════
                    SECTION 1: ORDER DETAILS CARD (from Image 2)
                   ══════════════════════════════════════════════════ */}
                <div className="bg-card rounded-3xl border-2 border-amber-300 dark:border-amber-600/80 p-5 sm:p-6 shadow-sm space-y-4">
                  {/* Top Order ID and Date */}
                  <div className="space-y-1">
                    <div className="text-base sm:text-lg">
                      <span className="text-slate-600 dark:text-slate-400 font-semibold">Order ID: </span>
                      <span className="font-mono font-bold text-foreground text-lg sm:text-xl">
                        {shortId(o.id)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                      {formatDate(o.created_at)}
                    </p>
                  </div>

                  <div className="border-t border-slate-200/80 dark:border-slate-800" />

                  {/* Product items */}
                  <div className="space-y-2">
                    {items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <div className="text-base sm:text-lg text-foreground font-bold">
                          {item.name}{" "}
                          {item.option && (
                            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                              ({item.option}){" "}
                            </span>
                          )}
                          <span className="text-primary font-bold">×{item.quantity}</span>
                        </div>
                        <span className="text-base sm:text-lg font-bold text-foreground">
                          {formatPrice(Number(item.price || 0) * Number(item.quantity || 1))}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-200/80 dark:border-slate-800" />

                  {/* Payment method & Trx ID */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium">
                    {pm && (
                      <div>
                        Payment: <strong className="text-foreground font-bold">{pm.name}</strong>
                      </div>
                    )}
                    {o.transaction_id && (
                      <div>
                        TrxID: <strong className="font-mono text-foreground font-bold">{o.transaction_id}</strong>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-200/80 dark:border-slate-800" />

                  {/* Total price */}
                  <div className="flex items-center text-base sm:text-lg text-slate-600 dark:text-slate-400 font-semibold">
                    <span>Total:</span>
                    <span className="text-primary font-extrabold text-2xl sm:text-3xl ml-2">
                      {formatPrice(Number(o.total_price))}
                    </span>
                  </div>
                </div>

                {/* ══════════════════════════════════════════════════
                    SECTION 2: VERIFICATION PROGRESS / DELIVERY CARD (from Image 1)
                   ══════════════════════════════════════════════════ */}
                {isPending && (
                  <div className="bg-[#FFFDF5] dark:bg-amber-950/20 rounded-3xl border-2 border-amber-300 dark:border-amber-600/80 p-5 sm:p-7 shadow-sm space-y-4">
                    {/* Header: Clock Icon + Title + Description */}
                    <div className="flex items-start gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Clock className="h-8 w-8 text-white stroke-[2.3]" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-amber-950 dark:text-amber-100 text-lg sm:text-xl leading-snug">
                          Payment verification & account setup in progress...
                        </h3>
                        <p className="text-sm sm:text-base text-amber-900/85 dark:text-amber-200/85 leading-relaxed">
                          Our team usually verifies your payment and delivers your subscription within{" "}
                          <strong className="font-bold text-amber-950 dark:text-amber-100">
                            5 to 10 minutes
                          </strong>
                          .
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-amber-200/90 dark:border-amber-800/80" />

                    {/* 3 Step Boxes with Horizontal Connectors */}
                    <div className="flex items-center justify-between gap-1 sm:gap-2 pt-1">
                      {/* Box 1: Order Placed */}
                      <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border-2 border-emerald-300 dark:border-emerald-700/80 rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center text-center flex-1 min-h-[110px]">
                        <div className="h-7 w-7 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-2 shadow-xs">
                          <Check className="h-4 w-4 stroke-[3]" />
                        </div>
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm leading-tight block">
                          1. Order
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm leading-tight block">
                          Placed
                        </span>
                      </div>

                      {/* Connector Line 1 */}
                      <div className="h-0.5 bg-amber-400 w-3 sm:w-6 shrink-0" />

                      {/* Box 2: Verification */}
                      <div className="bg-amber-100/70 dark:bg-amber-900/40 border-2 border-amber-400 dark:border-amber-500 rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center text-center flex-1 min-h-[110px] shadow-xs">
                        <div className="h-7 w-7 rounded-full border-[2.5px] border-amber-500 border-t-transparent animate-spin mb-2" />
                        <span className="font-bold text-amber-950 dark:text-amber-100 text-xs sm:text-sm leading-tight block">
                          2. Verification
                        </span>
                      </div>

                      {/* Connector Line 2 */}
                      <div className="h-0.5 bg-slate-300 dark:bg-slate-700 w-3 sm:w-6 shrink-0" />

                      {/* Box 3: Delivery */}
                      <div className="bg-slate-50/70 dark:bg-slate-900/40 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center text-center flex-1 min-h-[110px] opacity-80">
                        <Gift className="h-7 w-7 text-slate-500 mb-2" />
                        <span className="font-bold text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-tight block">
                          3. Delivery
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-amber-200/90 dark:border-amber-800/80" />

                    {/* Bottom Notice Text */}
                    <p className="text-center text-xs sm:text-sm text-amber-900/85 dark:text-amber-200/85 font-medium leading-relaxed">
                      No need to refresh — your credentials and access details will appear live right here!
                    </p>
                  </div>
                )}

                {/* Delivered Access Box */}
                {isDelivered && hasDeliveryInfo && (
                  <div className="bg-indigo-50/70 dark:bg-indigo-950/40 rounded-3xl border-2 border-indigo-300 dark:border-indigo-800/60 p-5 sm:p-6 space-y-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                        <Gift className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-indigo-950 dark:text-indigo-200 text-base sm:text-lg">
                          🎉 Your Subscription is Ready!
                        </h4>
                        <p className="text-xs sm:text-sm text-indigo-800/80 dark:text-indigo-300">
                          Your subscription credentials and access details are provided below
                        </p>
                      </div>
                    </div>

                    {/* Delivery Notes */}
                    {Array.isArray(o.delivery_notes) && o.delivery_notes.length > 0 ? (
                      <div className="space-y-3">
                        {o.delivery_notes.map((dn, i) => {
                          const noteText = dn.note || "";
                          const copyId = `${o.id}-dn-${i}`;
                          const isCopied = copiedId === copyId;

                          return (
                            <div
                              key={i}
                              className="bg-background rounded-2xl p-4 border border-indigo-100 dark:border-indigo-900/60 shadow-xs space-y-3"
                            >
                              {noteText && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                                      <ShieldCheck className="h-4 w-4 text-indigo-600" />
                                      Account / Login Credentials #{i + 1}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 text-xs px-3 text-primary hover:bg-primary/10 font-bold"
                                      onClick={() => copyText(noteText, copyId)}
                                    >
                                      {isCopied ? (
                                        <>
                                          <Check className="h-3.5 w-3.5 mr-1 text-green-600" /> Copied
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="h-3.5 w-3.5 mr-1" /> Copy All
                                        </>
                                      )}
                                    </Button>
                                  </div>

                                  <pre className="text-xs sm:text-sm font-mono bg-muted/80 p-3.5 rounded-xl whitespace-pre-wrap break-all text-foreground select-all border border-border leading-relaxed">
                                    {noteText}
                                  </pre>
                                </div>
                              )}

                              {dn.link && (
                                <div className="pt-1">
                                  <a
                                    href={dn.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-xs"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    Open Subscription Link &rarr;
                                  </a>
                                </div>
                              )}

                              {dn.video_url && (
                                <div className="pt-2">
                                  <RedeemVideoPlayer videoUrl={dn.video_url} variant="card" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : o.delivery_details ? (
                      <div className="bg-background rounded-2xl p-4 border border-indigo-100 dark:border-indigo-900/60 shadow-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-muted-foreground uppercase">
                            Account Information
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs px-3 text-primary"
                            onClick={() => copyText(o.delivery_details || "", `${o.id}-det`)}
                          >
                            {copiedId === `${o.id}-det` ? (
                              <>
                                <Check className="h-3.5 w-3.5 mr-1 text-green-600" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                              </>
                            )}
                          </Button>
                        </div>
                        <pre className="text-xs font-mono bg-muted/80 p-3 rounded-xl whitespace-pre-wrap break-all select-all">
                          {o.delivery_details}
                        </pre>
                      </div>
                    ) : null}

                    {/* Support & Review Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-indigo-200/60 dark:border-indigo-800/40 text-xs">
                      <a
                        href="https://wa.me/8801516524644"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold hover:underline"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        WhatsApp Support (+8801516524644)
                      </a>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-amber-600 hover:text-amber-700 gap-1 px-2"
                        onClick={() => {
                          const firstItem = items.find((item: OrderItem) => item.id);
                          if (firstItem?.id) {
                            navigate(`/product/${firstItem.id}?tab=reviews`);
                          } else {
                            navigate("/reviews");
                          }
                        }}
                      >
                        <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                        Give Review
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default TrackOrder;

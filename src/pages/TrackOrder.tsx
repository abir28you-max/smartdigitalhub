import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Package,
  CheckCircle2,
  Gift,
  Star,
  Clock,
  Copy,
  Check,
  Loader2,
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

const statusConfig: Record<string, { label: string; badge: string; dot: string }> = {
  pending: {
    label: "Processing",
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    dot: "bg-amber-500",
  },
  verified: {
    label: "Payment Verified",
    badge: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
    dot: "bg-blue-500",
  },
  delivered: {
    label: "Delivered",
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  rejected: {
    label: "Cancelled",
    badge: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
    dot: "bg-rose-500",
  },
};

const TrackOrder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
                title: "Order Delivered",
                description: "Your subscription details are ready below.",
              });
            } else if (updated.status === "verified") {
              toast({
                title: "Payment Approved",
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
    toast({ title: "Copied to clipboard" });
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
    <div className="min-h-screen bg-background pb-20 md:pb-12">
      <Header hideSearch={true} />

      <main className="container max-w-3xl mt-4 sm:mt-6 mb-10 space-y-5">
        {/* Page Header */}
        <div className="flex items-center justify-between gap-4 pb-1">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              My Orders
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
              Live status and access details for your subscriptions
            </p>
          </div>

          {user && (
            <Button
              variant="outline"
              size="sm"
              onClick={fetchUserOrders}
              disabled={loading}
              className="rounded-xl gap-2 h-9 text-xs font-medium shrink-0"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          )}
        </div>

        {/* Minimal Segmented Filter Tabs */}
        {orders.length > 0 && (
          <div className="inline-flex items-center p-1 bg-muted/60 rounded-xl border border-border/50 text-xs">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === "all"
                  ? "bg-card text-foreground shadow-xs border border-border/50"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeTab === "pending"
                  ? "bg-card text-foreground shadow-xs border border-border/50"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Processing ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab("delivered")}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeTab === "delivered"
                  ? "bg-card text-foreground shadow-xs border border-border/50"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Delivered ({deliveredCount})
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            <div className="h-32 rounded-2xl bg-card border border-border p-6 animate-pulse" />
            <div className="h-32 rounded-2xl bg-card border border-border p-6 animate-pulse" />
          </div>
        )}

        {/* Empty State */}
        {!loading && orders.length === 0 && (
          <div className="bg-card border border-border rounded-2xl p-8 sm:p-12 text-center space-y-4 shadow-xs">
            <div className="h-12 w-12 rounded-full bg-muted text-muted-foreground flex items-center justify-center mx-auto">
              <Package className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-base text-foreground">
                No orders found
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
                Explore our digital subscriptions and place your first order.
              </p>
            </div>
            <div className="pt-1">
              <Button asChild size="sm" className="rounded-xl px-5 text-xs font-medium">
                <Link to="/products">Browse Subscriptions</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.map((o) => {
            const items = Array.isArray(o.items) ? o.items : [];
            const isDelivered = o.status === "delivered";
            const isPending = o.status === "pending" || o.status === "verified";
            const expanded = isDelivered || isPending || expandedId === o.id;
            const pm = o.payment_methods as { name: string } | null;
            const hasDeliveryInfo =
              (Array.isArray(o.delivery_notes) && o.delivery_notes.length > 0) ||
              Boolean(o.delivery_details);
            const status = statusConfig[o.status] || {
              label: o.status,
              badge: "bg-muted text-muted-foreground border-border",
              dot: "bg-muted-foreground",
            };

            return (
              <div
                key={o.id}
                className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden transition-all hover:border-border"
              >
                {/* Order Header */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-medium">Order</span>
                        <span className="font-mono font-semibold text-foreground text-sm">
                          {shortId(o.id)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{formatDate(o.created_at)}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${status.badge}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${status.dot} ${
                            isPending ? "animate-pulse" : ""
                          }`}
                        />
                        {status.label}
                      </span>
                      {!isDelivered && !isPending && (
                        <button
                          onClick={() => setExpandedId(expanded ? null : o.id)}
                          className="text-muted-foreground hover:text-foreground p-1 transition-colors"
                        >
                          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="py-3 space-y-2 border-b border-border/60">
                    {items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <div className="text-foreground">
                          <span className="font-medium">{item.name}</span>
                          {item.option && (
                            <span className="text-xs text-muted-foreground ml-1.5">
                              ({item.option})
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground ml-2">×{item.quantity}</span>
                        </div>
                        <span className="font-medium text-foreground">
                          {formatPrice(Number(item.price || 0) * Number(item.quantity || 1))}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Payment & Total Meta */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2 flex-wrap">
                      {pm && (
                        <span>
                          Payment: <strong className="font-medium text-foreground">{pm.name}</strong>
                        </span>
                      )}
                      {pm && o.transaction_id && <span>•</span>}
                      {o.transaction_id && (
                        <span>
                          TrxID: <strong className="font-mono text-foreground">{o.transaction_id}</strong>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className="text-xs text-muted-foreground">Total:</span>
                      <span className="font-bold text-foreground">
                        {formatPrice(Number(o.total_price))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Minimalist Pending / Verification Box */}
                {isPending && (
                  <div className="bg-muted/30 border-t border-border/60 p-4 sm:p-5 space-y-3.5">
                    <div className="flex items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                          <Clock className="h-4 w-4 animate-pulse" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-semibold text-foreground">
                            Payment verification & setup in progress
                          </h4>
                          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                            Estimated delivery time: 5–10 minutes
                          </p>
                        </div>
                      </div>
                      <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-muted-foreground bg-background px-2.5 py-1 rounded-full border border-border/60">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                        Live
                      </span>
                    </div>

                    {/* Progress Steps */}
                    <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                      <div className="bg-background rounded-xl p-2.5 border border-border/60 flex flex-col items-center">
                        <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-1">
                          <Check className="h-3 w-3 stroke-[2.5]" />
                        </div>
                        <span className="text-xs font-medium text-foreground">1. Placed</span>
                        <span className="text-[10px] text-muted-foreground">Received</span>
                      </div>

                      <div className="bg-amber-500/5 rounded-xl p-2.5 border border-amber-500/30 flex flex-col items-center">
                        <div className="h-5 w-5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                        </div>
                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">2. Verification</span>
                        <span className="text-[10px] text-amber-600/90 dark:text-amber-400/90">Processing</span>
                      </div>

                      <div className="bg-background/60 rounded-xl p-2.5 border border-border/40 opacity-60 flex flex-col items-center">
                        <div className="h-5 w-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center mb-1">
                          <Package className="h-3 w-3" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">3. Delivery</span>
                        <span className="text-[10px] text-muted-foreground">Pending</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-muted-foreground text-center pt-0.5">
                      No need to refresh — your subscription credentials will appear here automatically.
                    </p>
                  </div>
                )}

                {/* Delivered Access Box */}
                {isDelivered && hasDeliveryInfo && (
                  <div className="bg-muted/30 border-t border-border/60 p-4 sm:p-5 space-y-4">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-semibold text-foreground">
                          Subscription Delivered
                        </h4>
                        <p className="text-[11px] sm:text-xs text-muted-foreground">
                          Your account credentials and access details
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
                              className="bg-card rounded-xl p-3.5 sm:p-4 border border-border/80 shadow-xs space-y-3"
                            >
                              {noteText && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                                      Account Credentials {o.delivery_notes!.length > 1 ? `#${i + 1}` : ""}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs px-2.5 gap-1 rounded-lg"
                                      onClick={() => copyText(noteText, copyId)}
                                    >
                                      {isCopied ? (
                                        <>
                                          <Check className="h-3.5 w-3.5 text-emerald-600" /> Copied
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="h-3.5 w-3.5" /> Copy
                                        </>
                                      )}
                                    </Button>
                                  </div>

                                  <pre className="text-xs sm:text-sm font-mono bg-muted/60 p-3 rounded-lg whitespace-pre-wrap break-all text-foreground select-all border border-border/50 leading-relaxed">
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
                                    className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium px-3.5 py-2 rounded-lg transition-all shadow-xs"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    Open Subscription Link
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
                      <div className="bg-card rounded-xl p-3.5 sm:p-4 border border-border/80 shadow-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                            Account Credentials
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-2.5 gap-1 rounded-lg"
                            onClick={() => copyText(o.delivery_details || "", `${o.id}-det`)}
                          >
                            {copiedId === `${o.id}-det` ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-600" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" /> Copy
                              </>
                            )}
                          </Button>
                        </div>
                        <pre className="text-xs font-mono bg-muted/60 p-3 rounded-lg whitespace-pre-wrap break-all select-all border border-border/50">
                          {o.delivery_details}
                        </pre>
                      </div>
                    ) : null}

                    {/* Support & Review Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60 text-xs text-muted-foreground">
                      <a
                        href="https://wa.me/8801516524644"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 hover:text-foreground font-medium transition-colors"
                      >
                        <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                        WhatsApp Support
                      </a>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
                        onClick={() => {
                          const firstItem = items.find((item: OrderItem) => item.id);
                          if (firstItem?.id) {
                            navigate(`/product/${firstItem.id}?tab=reviews`);
                          } else {
                            navigate("/reviews");
                          }
                        }}
                      >
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20" />
                        Write a Review
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

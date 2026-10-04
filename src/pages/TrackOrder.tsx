import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Hash,
  Package,
  CheckCircle2,
  Gift,
  Star,
  Clock,
  Copy,
  Check,
  Sparkles,
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

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800",
  verified: "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800",
  rejected: "bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-800",
  delivered: "bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-200 dark:border-indigo-800",
};

const statusLabels: Record<string, string> = {
  pending: "Verification In Progress ⏳",
  verified: "Payment Approved ✅",
  rejected: "Rejected ❌",
  delivered: "Delivered 🎉",
};

const TrackOrder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();

  const [txnId, setTxnId] = useState(searchParams.get("trx") || "");
  const [orders, setOrders] = useState<Order[]>([]);
  const [searched, setSearched] = useState(false);
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

  // Initial load
  useEffect(() => {
    if (user) {
      fetchUserOrders();
    } else if (searchParams.get("trx")) {
      handleSearchWithTrx(searchParams.get("trx")!);
    } else {
      setLoading(false);
    }
  }, [user, searchParams, fetchUserOrders]);

  // Supabase Realtime Listener for Live Delivery Updates
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

  const handleSearchWithTrx = async (trxToSearch: string) => {
    if (!trxToSearch.trim()) return;
    setLoading(true);
    try {
      // First try direct DB query
      const { data: dbData } = await supabase
        .from("orders")
        .select("*, payment_methods(name)")
        .ilike("transaction_id", `%${trxToSearch.trim()}%`)
        .order("created_at", { ascending: false });

      if (dbData && dbData.length > 0) {
        setOrders(dbData as unknown as Order[]);
      } else {
        // Fallback to Edge function
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
      setSearched(true);
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearchWithTrx(txnId);
  };

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

      <main className="container max-w-4xl mt-4 mb-8 space-y-6">
        {/* Header Hero Section */}
        <div className="bg-card border border-border rounded-2xl p-5 sm:p-7 shadow-xs">
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
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "all"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              All Orders ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "pending"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-card border border-border text-amber-700 dark:text-amber-400 hover:text-foreground"
              }`}
            >
              <Clock className="h-3.5 w-3.5" /> Processing ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab("delivered")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "delivered"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-card border border-border text-indigo-700 dark:text-indigo-400 hover:text-foreground"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Delivered ({deliveredCount})
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-4">
            <div className="h-36 rounded-2xl bg-card border border-border p-6 animate-pulse" />
            <div className="h-36 rounded-2xl bg-card border border-border p-6 animate-pulse" />
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

        {/* Orders List */}
        <div className="space-y-5">
          {filteredOrders.map((o) => {
            const items = Array.isArray(o.items) ? o.items : [];
            const isDelivered = o.status === "delivered";
            const isPending = o.status === "pending" || o.status === "verified";
            const expanded = isDelivered || isPending || expandedId === o.id;
            const pm = o.payment_methods as { name: string } | null;
            const hasDeliveryInfo =
              (Array.isArray(o.delivery_notes) && o.delivery_notes.length > 0) ||
              Boolean(o.delivery_details);

            return (
              <div
                key={o.id}
                className={`bg-card rounded-2xl border transition-all shadow-xs overflow-hidden ${
                  isDelivered
                    ? "border-indigo-300 dark:border-indigo-800/80 ring-1 ring-indigo-500/20"
                    : isPending
                    ? "border-amber-300 dark:border-amber-800/80 ring-1 ring-amber-500/20"
                    : "border-border"
                }`}
              >
                {/* Top Status Header */}
                <div className="p-4 sm:p-5 pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-muted-foreground">Order ID:</span>
                        <span className="font-mono font-bold text-foreground text-sm">
                          {shortId(o.id)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{formatDate(o.created_at)}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className={`${statusColors[o.status] || ""} border font-semibold px-3 py-1 text-xs`}>
                        {statusLabels[o.status] || o.status}
                      </Badge>
                      {!isDelivered && !isPending && (
                        <button
                          onClick={() => setExpandedId(expanded ? null : o.id)}
                          className="text-muted-foreground hover:text-foreground p-1"
                        >
                          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="py-3 space-y-2">
                    {items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <div className="font-medium text-foreground">
                          {item.name}{" "}
                          {item.option && (
                            <span className="text-xs text-muted-foreground font-normal">
                              ({item.option})
                            </span>
                          )}{" "}
                          <span className="text-xs text-primary font-bold">×{item.quantity}</span>
                        </div>
                        <span className="font-semibold text-foreground">
                          {formatPrice(Number(item.price || 0) * Number(item.quantity || 1))}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Summary & Trx */}
                  <div className="flex flex-wrap justify-between items-center pt-2.5 border-t border-border/80 text-xs text-muted-foreground gap-2">
                    <div className="flex items-center gap-3">
                      {pm && <span>Payment: <strong className="text-foreground">{pm.name}</strong></span>}
                      {o.transaction_id && (
                        <span>
                          TrxID: <strong className="font-mono text-foreground">{o.transaction_id}</strong>
                        </span>
                      )}
                    </div>
                    <div className="text-sm">
                      <span className="mr-1.5 text-xs text-muted-foreground">Total:</span>
                      <span className="font-bold text-primary text-base">
                        {formatPrice(Number(o.total_price))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ⏳ PENDING / VERIFICATION WAIT CARD */}
                {isPending && (
                  <div className="bg-amber-500/10 dark:bg-amber-950/30 border-t border-amber-200 dark:border-amber-800/60 p-4 sm:p-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-amber-950 dark:text-amber-200 text-sm sm:text-base flex items-center gap-2">
                          Payment verification & account setup in progress...
                        </h4>
                        <p className="text-xs sm:text-sm text-amber-900/90 dark:text-amber-300/90 leading-relaxed">
                          Our team usually verifies your payment and delivers your subscription within <strong className="text-amber-950 dark:text-amber-100 font-bold">5 to 10 minutes</strong>.
                        </p>
                      </div>
                    </div>

                    {/* Progress steps */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-amber-200/60 dark:border-amber-800/40 text-center">
                      <div className="bg-background/80 rounded-lg p-2 border border-amber-200/80 dark:border-amber-900/50">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto mb-1" />
                        <span className="text-[11px] font-bold text-foreground block">1. Order Placed</span>
                        <span className="text-[10px] text-muted-foreground">Received</span>
                      </div>
                      <div className="bg-amber-500/15 rounded-lg p-2 border border-amber-300 dark:border-amber-700">
                        <Loader2 className="h-4 w-4 text-amber-600 animate-spin mx-auto mb-1" />
                        <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200 block">2. Verification</span>
                        <span className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">In Progress (5-10m)</span>
                      </div>
                      <div className="bg-background/60 rounded-lg p-2 border border-border/70 opacity-70">
                        <Gift className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                        <span className="text-[11px] font-bold text-muted-foreground block">3. Delivery</span>
                        <span className="text-[10px] text-muted-foreground">Access Provided</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-amber-800/80 dark:text-amber-400 text-center pt-1">
                      💡 No need to refresh — your credentials and access details will appear live right here!
                    </p>
                  </div>
                )}

                {/* 🎉 DELIVERED ACCOUNT CREDENTIALS / ACCESS BOX */}
                {isDelivered && hasDeliveryInfo && (
                  <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border-t border-indigo-200 dark:border-indigo-800/60 p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                          <Gift className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-indigo-950 dark:text-indigo-200 text-sm sm:text-base flex items-center gap-1.5">
                            🎉 Your Subscription is Ready!
                          </h4>
                          <p className="text-xs text-indigo-800/80 dark:text-indigo-300">
                            Your subscription credentials and access details are provided below
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Notes & Credentials */}
                    {Array.isArray(o.delivery_notes) && o.delivery_notes.length > 0 ? (
                      <div className="space-y-3">
                        {o.delivery_notes.map((dn, i) => {
                          const noteText = dn.note || "";
                          const copyId = `${o.id}-dn-${i}`;
                          const isCopied = copiedId === copyId;

                          return (
                            <div
                              key={i}
                              className="bg-background rounded-xl p-3.5 sm:p-4 border border-indigo-100 dark:border-indigo-900/60 shadow-xs space-y-3"
                            >
                              {noteText && (
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                                      <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                                      Account / Login Credentials #{i + 1}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 text-xs px-2.5 text-primary hover:bg-primary/10"
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

                                  <div className="relative">
                                    <pre className="text-xs sm:text-sm font-mono bg-muted/80 p-3 rounded-lg whitespace-pre-wrap break-all text-foreground select-all border border-border">
                                      {noteText}
                                    </pre>
                                  </div>
                                </div>
                              )}

                              {dn.link && (
                                <div className="pt-1">
                                  <a
                                    href={dn.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-xs hover:scale-[1.01]"
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
                      <div className="bg-background rounded-xl p-3.5 border border-indigo-100 dark:border-indigo-900/60 shadow-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-muted-foreground uppercase">
                            Account Information
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs px-2 text-primary"
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
                        <pre className="text-xs font-mono bg-muted/80 p-3 rounded-lg whitespace-pre-wrap break-all select-all">
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

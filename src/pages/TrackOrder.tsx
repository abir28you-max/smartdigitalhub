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
  Clock,
  Copy,
  Check,
  Loader2,
  ShieldCheck,
  MessageCircle,
  Star,
  RotateCw,
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

const statusConfig: Record<string, { label: string; badge: string }> = {
  pending: {
    label: "Processing",
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20",
  },
  verified: {
    label: "Payment Verified",
    badge: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20",
  },
  delivered: {
    label: "Delivered",
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
  },
  rejected: {
    label: "Cancelled",
    badge: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20",
  },
};

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
                title: "Order Delivered",
                description: "Your subscription details are ready below.",
              });
            } else if (updated.status === "verified") {
              toast({
                title: "Payment Approved",
                description: "Your order is being processed for delivery.",
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
    toast({ title: "Copied" });
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
    <div className="min-h-screen bg-background pb-24 md:pb-12">
      <Header hideSearch={true} />

      <main className="container max-w-2xl mt-4 sm:mt-6 mb-10 space-y-4 px-4">
        {/* Simple Clean Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Orders
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live updates & subscription details
            </p>
          </div>

          {user && (
            <button
              onClick={fetchUserOrders}
              disabled={loading}
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
              title="Refresh"
            >
              <RotateCw className={`h-4 w-4 ${loading ? "animate-spin text-primary" : ""}`} />
            </button>
          )}
        </div>

        {/* Minimal Tabs */}
        {orders.length > 0 && (
          <div className="flex items-center gap-1 border-b border-border/60 pb-1 text-xs">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === "all"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === "pending"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Processing ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab("delivered")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === "delivered"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Delivered ({deliveredCount})
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-3 pt-2">
            <div className="h-28 rounded-xl bg-card border border-border animate-pulse" />
            <div className="h-28 rounded-xl bg-card border border-border animate-pulse" />
          </div>
        )}

        {/* Empty State */}
        {!loading && orders.length === 0 && (
          <div className="py-14 text-center space-y-3">
            <Package className="h-9 w-9 text-muted-foreground/60 mx-auto" />
            <div>
              <p className="text-sm font-medium text-foreground">No orders found</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Browse our subscriptions to place an order.
              </p>
            </div>
            <div className="pt-1">
              <Button asChild size="sm" variant="outline" className="text-xs rounded-lg">
                <Link to="/products">Browse Subscriptions</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Orders List */}
        <div className="space-y-3 pt-1">
          {filteredOrders.map((o) => {
            const items = Array.isArray(o.items) ? o.items : [];
            const isDelivered = o.status === "delivered";
            const isPending = o.status === "pending" || o.status === "verified";
            const pm = o.payment_methods as { name: string } | null;
            const hasDeliveryInfo =
              (Array.isArray(o.delivery_notes) && o.delivery_notes.length > 0) ||
              Boolean(o.delivery_details);
            const status = statusConfig[o.status] || {
              label: o.status,
              badge: "bg-muted text-muted-foreground border-border",
            };

            return (
              <div
                key={o.id}
                className="bg-card rounded-xl border border-border p-4 space-y-3 transition-colors"
              >
                {/* Header: ID, Date, Status */}
                <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-sm text-foreground">
                        {shortId(o.id)}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        • {formatDate(o.created_at)}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${status.badge}`}>
                    {status.label}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-1.5 py-0.5">
                  {items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <div className="text-foreground">
                        <span>{item.name}</span>
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

                {/* Meta details */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 flex-wrap">
                    {pm && <span>Payment: <strong className="font-medium text-foreground">{pm.name}</strong></span>}
                    {pm && o.transaction_id && <span>•</span>}
                    {o.transaction_id && (
                      <span>
                        TrxID: <strong className="font-mono text-foreground">{o.transaction_id}</strong>
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="mr-1 text-muted-foreground">Total:</span>
                    <strong className="text-sm font-semibold text-foreground">
                      {formatPrice(Number(o.total_price))}
                    </strong>
                  </div>
                </div>

                {/* Simple In-Progress Notice */}
                {isPending && (
                  <div className="pt-2.5 border-t border-border/60 flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600 shrink-0" />
                    <span>Payment verification in progress (usually 5–10 mins). Credentials will appear here.</span>
                  </div>
                )}

                {/* Simple Delivered Details */}
                {isDelivered && hasDeliveryInfo && (
                  <div className="pt-3 border-t border-border/60 space-y-3">
                    {Array.isArray(o.delivery_notes) && o.delivery_notes.length > 0 ? (
                      o.delivery_notes.map((dn, i) => {
                        const noteText = dn.note || "";
                        const copyId = `${o.id}-dn-${i}`;
                        const isCopied = copiedId === copyId;

                        return (
                          <div key={i} className="space-y-2">
                            {noteText && (
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                                    Access Details {o.delivery_notes!.length > 1 ? `#${i + 1}` : ""}
                                  </span>
                                  <button
                                    onClick={() => copyText(noteText, copyId)}
                                    className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
                                  >
                                    {isCopied ? (
                                      <>
                                        <Check className="h-3 w-3 text-emerald-600" /> Copied
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="h-3 w-3" /> Copy
                                      </>
                                    )}
                                  </button>
                                </div>
                                <pre className="text-xs font-mono bg-muted p-2.5 rounded-lg whitespace-pre-wrap break-all select-all border border-border/40">
                                  {noteText}
                                </pre>
                              </div>
                            )}

                            {dn.link && (
                              <a
                                href={dn.link}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline pt-0.5"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Open Link
                              </a>
                            )}

                            {dn.video_url && (
                              <div className="pt-1">
                                <RedeemVideoPlayer videoUrl={dn.video_url} variant="card" />
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : o.delivery_details ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">Access Details</span>
                          <button
                            onClick={() => copyText(o.delivery_details || "", `${o.id}-det`)}
                            className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
                          >
                            {copiedId === `${o.id}-det` ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-600" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" /> Copy
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="text-xs font-mono bg-muted p-2.5 rounded-lg whitespace-pre-wrap break-all select-all border border-border/40">
                          {o.delivery_details}
                        </pre>
                      </div>
                    ) : null}

                    {/* Support & Review Links */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground">
                      <a
                        href="https://wa.me/8801516524644"
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-foreground font-medium inline-flex items-center gap-1 transition-colors"
                      >
                        <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                        Support
                      </a>

                      <button
                        className="text-muted-foreground hover:text-foreground font-medium inline-flex items-center gap-1 transition-colors"
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
                        Review
                      </button>
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

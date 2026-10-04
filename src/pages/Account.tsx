import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  LogOut,
  Package,
  CheckCircle2,
  Clock,
  Wallet,
  ExternalLink,
  Copy,
  Check,
  KeyRound,
  Sparkles,
} from "lucide-react";
import { RedeemVideoPlayer } from "@/components/RedeemVideoPlayer";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  option?: string;
}
interface DeliveryNote {
  note?: string;
  link?: string;
  video_url?: string;
}
interface Order {
  id: string;
  created_at: string;
  status: string;
  total_price: number;
  transaction_id: string | null;
  items: OrderItem[];
  delivery_notes: DeliveryNote[] | null;
  delivery_details?: string | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
  verified: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
  rejected: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
  delivered: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
};

const statusLabels: Record<string, string> = {
  pending: "Processing",
  verified: "Payment Verified",
  rejected: "Cancelled",
  delivered: "Delivered",
};

const Account = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ full_name: "", phone: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth?next=/account", { replace: true });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const [{ data: ordersData }, { data: profileData }, { data: rolesData }] = await Promise.all([
        supabase
          .from("orders")
          .select("id, created_at, status, total_price, transaction_id, items, delivery_notes, delivery_details")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      if (!active) return;
      setOrders((ordersData as unknown as Order[]) || []);
      if (profileData) setProfile({ full_name: profileData.full_name || "", phone: profileData.phone || "" });
      if (rolesData && rolesData.some((r: any) => r.role === "admin")) {
        setIsAdmin(true);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const stats = useMemo(() => {
    const approved = orders.filter((o) => o.status === "verified" || o.status === "delivered");
    const pending = orders.filter((o) => o.status === "pending");
    return {
      total: orders.length,
      approved: approved.length,
      pending: pending.length,
      spent: approved.reduce((s, o) => s + Number(o.total_price || 0), 0),
      pendingAmount: pending.reduce((s, o) => s + Number(o.total_price || 0), 0),
    };
  }, [orders]);

  const saveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, full_name: profile.full_name, phone: profile.phone, email: user.email });
    setSavingProfile(false);
    toast(
      error
        ? { title: "Could not save", description: error.message, variant: "destructive" }
        : { title: "Profile updated" }
    );
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    toast({ title: "Copied to clipboard! 📋" });
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (authLoading || !user) return <div className="min-h-screen bg-background" />;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <Header />
      <main className="container max-w-4xl my-4 space-y-5">
        <div className="flex items-start justify-between gap-3 bg-card border border-border p-4 sm:p-6 rounded-2xl shadow-sm">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold">My Account</h1>
            <p className="text-sm text-muted-foreground break-all">{user.email}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut} className="rounded-xl">
            <LogOut className="h-4 w-4 mr-1.5" /> Log Out
          </Button>
        </div>

        {isAdmin && (
          <div className="bg-gradient-to-r from-primary/15 via-accent/10 to-primary/5 border border-primary/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-base shadow-xs">
                🛡️
              </div>
              <div>
                <h3 className="font-bold text-foreground text-sm sm:text-base">
                  Admin Control Panel
                </h3>
                <p className="text-xs text-muted-foreground">
                  Manage products, categories, coupons, payments, banners, and all customer orders
                </p>
              </div>
            </div>
            <Button asChild size="sm" className="rounded-xl font-bold gap-1.5 shadow-sm self-stretch sm:self-auto">
              <Link to="/admin/products">
                Open Admin Dashboard &rarr;
              </Link>
            </Button>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-card border border-border rounded-xl p-3.5 shadow-sm">
            <Package className="h-4 w-4 text-primary mb-1" />
            <p className="text-xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Orders</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3.5 shadow-sm">
            <CheckCircle2 className="h-4 w-4 text-green-600 mb-1" />
            <p className="text-xl font-bold">{stats.approved}</p>
            <p className="text-xs text-muted-foreground">Approved</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3.5 shadow-sm">
            <Wallet className="h-4 w-4 text-primary mb-1" />
            <p className="text-xl font-bold">{formatPrice(stats.spent)}</p>
            <p className="text-xs text-muted-foreground">Total Spent</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3.5 shadow-sm">
            <Clock className="h-4 w-4 text-yellow-600 mb-1" />
            <p className="text-xl font-bold">{formatPrice(stats.pendingAmount)}</p>
            <p className="text-xs text-muted-foreground">Pending ({stats.pending})</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 space-y-4 shadow-sm">
          <h2 className="font-display font-bold text-lg">Profile Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">Full Name</Label>
              <Input
                className="mt-1 rounded-xl"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                placeholder="Enter your name"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Phone Number</Label>
              <Input
                className="mt-1 rounded-xl"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="01XXXXXXXXX"
              />
            </div>
          </div>
          <Button size="sm" onClick={saveProfile} disabled={savingProfile} className="rounded-xl">
            {savingProfile ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-xl flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" /> My Subscriptions & Orders
            </h2>
            <span className="text-xs text-muted-foreground">{orders.length} orders found</span>
          </div>

          {loading && <div className="h-32 rounded-2xl bg-muted animate-pulse" />}

          {!loading && orders.length === 0 && (
            <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-3 shadow-sm">
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Package className="h-6 w-6" />
              </div>
              <p className="text-base font-semibold">No orders yet</p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Explore our digital subscriptions and place your first order.
              </p>
              <Button asChild size="sm" className="rounded-xl">
                <Link to="/products">Browse Products</Link>
              </Button>
            </div>
          )}

          {orders.map((o) => {
            const hasDelivery =
              (Array.isArray(o.delivery_notes) && o.delivery_notes.length > 0) ||
              Boolean(o.delivery_details);

            return (
              <div
                key={o.id}
                className={`bg-card border rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm transition-all ${
                  o.status === "delivered"
                    ? "border-primary/40 ring-1 ring-primary/20 bg-card"
                    : "border-border"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground">Order ID: </span>
                    <span className="text-xs font-mono font-bold text-foreground">
                      #{o.id.slice(0, 8)}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      • {new Date(o.created_at).toLocaleString("en-GB")}
                    </span>
                  </div>
                  <Badge variant="outline" className={`font-semibold ${statusColors[o.status] || ""}`}>
                    {statusLabels[o.status] || o.status}
                  </Badge>
                </div>

                {/* Items List */}
                <div className="space-y-1.5 py-1">
                  {(o.items || []).map((it, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <div className="font-medium text-foreground">
                        {it.name}{" "}
                        {it.option ? (
                          <span className="text-xs text-muted-foreground font-normal">
                            ({it.option})
                          </span>
                        ) : null}{" "}
                        <span className="text-xs text-primary font-bold">×{it.quantity}</span>
                      </div>
                      <span className="font-semibold text-foreground">
                        {formatPrice(Number(it.price) * Number(it.quantity))}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center border-t border-border/70 pt-2.5 text-sm">
                  <div className="text-xs text-muted-foreground">
                    {o.transaction_id && <span>TrxID: <span className="font-mono font-semibold text-foreground">{o.transaction_id}</span></span>}
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground mr-2">Total Paid:</span>
                    <span className="font-bold text-base text-primary">
                      {formatPrice(Number(o.total_price))}
                    </span>
                  </div>
                </div>

                {/* DELIVERED CREDENTIALS / DETAILS BOX */}
                {hasDelivery && (
                  <div className="mt-3 bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-emerald-50/40 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-emerald-950/20 border border-indigo-200 dark:border-indigo-800/60 rounded-xl p-3.5 sm:p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                          <KeyRound className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                            Account & Subscription Details <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                          </p>
                          <p className="text-[11px] text-indigo-800/80 dark:text-indigo-300">
                            Your delivery credentials are provided below
                          </p>
                        </div>
                      </div>
                    </div>

                    {Array.isArray(o.delivery_notes) && o.delivery_notes.length > 0 ? (
                      <div className="space-y-2.5">
                        {o.delivery_notes.map((n, i) => {
                          const noteText = n.note || "";
                          const copyId = `${o.id}-note-${i}`;
                          const isCopied = copiedIndex === copyId;

                          return (
                            <div
                              key={i}
                              className="bg-background/90 backdrop-blur-sm rounded-lg p-3 border border-border/80 space-y-2 shadow-xs"
                            >
                              {noteText && (
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                      Credentials / Access Note #{i + 1}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 text-xs px-2 text-primary hover:bg-primary/10"
                                      onClick={() => copyText(noteText, copyId)}
                                    >
                                      {isCopied ? (
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
                                  <pre className="text-xs font-mono bg-muted/70 p-2.5 rounded-md whitespace-pre-wrap break-all text-foreground select-all">
                                    {noteText}
                                  </pre>
                                </div>
                              )}

                              {n.link && (
                                <div className="pt-1">
                                  <a
                                    href={n.link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shadow-xs"
                                  >
                                    Open Access Link <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                </div>
                              )}

                              {n.video_url && (
                                <div className="pt-2">
                                  <RedeemVideoPlayer videoUrl={n.video_url} variant="card" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : o.delivery_details ? (
                      <div className="bg-background/90 rounded-lg p-3 border border-border space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-muted-foreground uppercase">
                            Account Information
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs px-2 text-primary"
                            onClick={() => copyText(o.delivery_details || "", `${o.id}-det`)}
                          >
                            {copiedIndex === `${o.id}-det` ? (
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
                        <pre className="text-xs font-mono bg-muted/70 p-2.5 rounded-md whitespace-pre-wrap break-all select-all">
                          {o.delivery_details}
                        </pre>
                      </div>
                    ) : null}

                    <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1 border-t border-border/40">
                      <span>Need help? Message us directly on WhatsApp</span>
                      <a
                        href="https://wa.me/8801516524644"
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                      >
                        WhatsApp Support &rarr;
                      </a>
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

export default Account;

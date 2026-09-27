import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ClipboardList, MessagesSquare, Lock, LayoutDashboard, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AdminOrders from "./admin/AdminOrders";
import AdminLiveChat from "./admin/AdminLiveChat";
import { initPushNotifications, showLocalNotification } from "@/lib/pushNotifications";
import AdminSkeleton from "@/components/AdminSkeleton";
import { useToast } from "@/hooks/use-toast";

const FastAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tab, setTab] = useState<"orders" | "chat">("orders");
  const [unreadChat, setUnreadChat] = useState(0);
  const [newOrders, setNewOrders] = useState(0);

  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      if (!roles?.some((r) => r.role === "admin")) { setLoading(false); return; }
      setIsAdmin(true);
      localStorage.setItem("fastadmin_session", "true");
      setLoading(false);
    };
    check();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      toast({ title: "Login failed", description: error?.message || "Invalid credentials", variant: "destructive" });
      setLoginLoading(false);
      return;
    }
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
    if (!roles?.some((r) => r.role === "admin")) {
      toast({ title: "Access denied", description: "You are not an admin", variant: "destructive" });
      await supabase.auth.signOut();
      setLoginLoading(false);
      return;
    }
    setIsAdmin(true);
    localStorage.setItem("fastadmin_session", "true");
    setLoginLoading(false);
  };

  // Push notifications
  useEffect(() => {
    if (isAdmin) initPushNotifications();
  }, [isAdmin]);

  // Realtime: chat unread + order notifications
  useEffect(() => {
    if (!isAdmin) return;

    const fetchUnread = async () => {
      const { count } = await supabase
        .from("chat_messages")
        .select("*", { count: "exact", head: true })
        .eq("sender_type", "customer")
        .eq("is_read", false);
      setUnreadChat(count || 0);
    };
    fetchUnread();

    const chatChannel = supabase
      .channel("fast-admin-chat")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: "sender_type=eq.customer" }, (payload) => {
        fetchUnread();
        const msg = payload.new as any;
        showLocalNotification(
          `💬 ${msg.customer_name || "Customer"}`,
          msg.message?.slice(0, 100) || "New message",
          { type: "chat" }
        );
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "chat_messages" }, () => fetchUnread())
      .subscribe();

    const orderChannel = supabase
      .channel("fast-admin-orders")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
        const order = payload.new as any;
        setNewOrders((prev) => prev + 1);
        showLocalNotification(
          "🛒 New Order!",
          `${order.customer_name} — ৳${order.total_price}`,
          { type: "order" }
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
      supabase.removeChannel(orderChannel);
    };
  }, [isAdmin]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><AdminSkeleton /></div>;

  // Show inline login form if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4 bg-card border border-border rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col items-center gap-2 mb-2">
            <img src="/logo.png" alt="Smart Digital Hub" className="h-16 w-auto object-contain rounded-lg mb-1" />
            <h1 className="font-display font-bold text-lg">Mobile Fast Admin</h1>
            <p className="text-xs text-muted-foreground">Smart Digital Hub</p>
          </div>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={loginLoading}>
            {loginLoading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="bg-card border-b border-border px-4 py-2.5 flex items-center justify-between sticky top-0 z-30">
        <h1 className="font-display font-bold text-base">Fast Admin</h1>
        <Button asChild size="sm" variant="outline" className="h-8 text-xs gap-1.5 rounded-lg border-primary/40 text-primary hover:bg-primary/10">
          <Link to="/admin/products">
            <LayoutDashboard className="h-3.5 w-3.5" /> Full Admin Panel
          </Link>
        </Button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-3">
        {tab === "orders" ? <AdminOrders /> : <AdminLiveChat />}
      </main>

      {/* Bottom tab bar */}
      <nav className="bg-card border-t border-border flex sticky bottom-0 z-30">
        <button
          onClick={() => { setTab("orders"); setNewOrders(0); }}
          className={`flex-1 flex flex-col items-center py-3 text-xs font-medium transition-colors relative ${
            tab === "orders" ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <ClipboardList className="h-5 w-5 mb-1" />
          Orders
          {newOrders > 0 && (
            <span className="absolute top-2 right-[calc(50%-20px)] bg-destructive text-destructive-foreground text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
              {newOrders}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("chat")}
          className={`flex-1 flex flex-col items-center py-3 text-xs font-medium transition-colors relative ${
            tab === "chat" ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <MessagesSquare className="h-5 w-5 mb-1" />
          Live Chat
          {unreadChat > 0 && (
            <span className="absolute top-2 right-[calc(50%-20px)] bg-destructive text-destructive-foreground text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
              {unreadChat}
            </span>
          )}
        </button>
      </nav>
    </div>
  );
};

export default FastAdmin;

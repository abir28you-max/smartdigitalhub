import { useEffect, useState, useRef, useCallback } from "react";
import AdminSkeleton from "@/components/AdminSkeleton";
import { useNavigate, Link, Outlet, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Package, CreditCard, ClipboardList, FolderOpen, LogOut, Home,
  Image, Flame, MessageSquare, Users, Menu, X, Wallet, MessagesSquare, Tag, Gift, UserCircle, Truck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import AdminLiveChat from "./AdminLiveChat";
import { initPushNotifications, showLocalNotification } from "@/lib/pushNotifications";

const tabs = [
  { icon: Package, label: "Products", to: "/admin/products" },
  { icon: FolderOpen, label: "Categories", to: "/admin/categories" },
  { icon: CreditCard, label: "Payments", to: "/admin/payments" },
  { icon: ClipboardList, label: "Orders", to: "/admin/orders" },
  { icon: Truck, label: "Delivery Details", to: "/admin/delivery-details" },
  { icon: Image, label: "Banners", to: "/admin/banners" },
  { icon: Flame, label: "Hot Deals", to: "/admin/hot-deals" },
  { icon: MessageSquare, label: "Reviews", to: "/admin/reviews" },
  { icon: Users, label: "Customers", to: "/admin/customers" },
  { icon: UserCircle, label: "Users", to: "/admin/users" },
  { icon: Wallet, label: "Earnings", to: "/admin/earnings" },
  { icon: Tag, label: "Coupons", to: "/admin/coupons" },
  { icon: Gift, label: "Salami", to: "/admin/salami" },
];

const AdminLayout = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [btnPos, setBtnPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; bx: number; by: number } | null>(null);
  const didDrag = useRef(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize button position
  useEffect(() => {
    setBtnPos({ x: window.innerWidth - 80, y: window.innerHeight - 80 });
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragStart.current = { x: e.clientX, y: e.clientY, bx: btnPos.x, by: btnPos.y };
    didDrag.current = false;
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [btnPos]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag.current = true;
    const newX = Math.max(0, Math.min(window.innerWidth - 56, dragStart.current.bx + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - 56, dragStart.current.by + dy));
    setBtnPos({ x: newX, y: newY });
  }, []);

  const onPointerUp = useCallback(() => {
    dragStart.current = null;
    setDragging(false);
    if (!didDrag.current) {
      setChatOpen((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/admin-login"); return; }
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      if (!roles?.some((r) => r.role === "admin")) { navigate("/admin-login"); return; }
      setIsAdmin(true);
      setLoading(false);
    };
    check();
  }, [navigate]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Initialize push notifications
  useEffect(() => {
    if (isAdmin) {
      initPushNotifications();
    }
  }, [isAdmin]);

  // Fetch unread chat count + realtime with notifications
  useEffect(() => {
    const fetchUnread = async () => {
      const { count } = await supabase
        .from("chat_messages")
        .select("*", { count: "exact", head: true })
        .eq("sender_type", "customer")
        .eq("is_read", false);
      setUnreadCount(count || 0);
    };
    fetchUnread();

    // Listen for new chat messages
    const chatChannel = supabase
      .channel("admin-unread-badge")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: "sender_type=eq.customer" }, (payload) => {
        fetchUnread();
        const msg = payload.new as any;
        showLocalNotification(
          `💬 New Message from ${msg.customer_name || "Customer"}`,
          msg.message?.slice(0, 100) || "New chat message",
          { type: "chat", session_id: msg.session_id }
        );
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "chat_messages" }, () => {
        fetchUnread();
      })
      .subscribe();

    // Listen for new orders
    const orderChannel = supabase
      .channel("admin-order-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
        const order = payload.new as any;
        showLocalNotification(
          "🛒 New Order Received!",
          `${order.customer_name} placed an order of ৳${order.total_price}`,
          { type: "order", order_id: order.id }
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
      supabase.removeChannel(orderChannel);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin-login");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><AdminSkeleton /></div>;
  if (!isAdmin) return null;

  const NavLinks = () => (
    <nav className="flex-1 p-2 space-y-1">
      {tabs.map((t) => (
        <Link
          key={t.to}
          to={t.to}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
            location.pathname === t.to
              ? "bg-primary/10 text-primary font-semibold"
              : "text-foreground/70 hover:bg-muted hover:text-foreground"
          }`}
        >
          <t.icon className="h-4 w-4 flex-shrink-0" />
          <span>{t.label}</span>
        </Link>
      ))}
    </nav>
  );

  const BottomLinks = () => (
    <div className="p-2 border-t border-border space-y-1">
      <Link to="/" className="flex items-center gap-3 px-3 py-2.5 text-sm text-foreground/70 hover:bg-muted hover:text-foreground rounded-lg">
        <Home className="h-4 w-4" /> View Site
      </Link>
      <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 rounded-lg w-full text-left">
        <LogOut className="h-4 w-4" /> Logout
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="w-60 bg-card border-r border-border flex-col flex-shrink-0 hidden md:flex">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <img src="/logo.png" alt="Smart Digital Hub" className="h-8 w-auto object-contain rounded" />
          <span className="font-display text-base font-bold">Admin Panel</span>
        </div>
        <NavLinks />
        <BottomLinks />
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden bg-card border-b border-border p-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 flex flex-col">
                <div className="p-4 border-b border-border flex items-center gap-3">
                  <img src="/logo.png" alt="Smart Digital Hub" className="h-8 w-auto object-contain rounded" />
                  <span className="font-display text-base font-bold">Admin Panel</span>
                </div>
                <NavLinks />
                <BottomLinks />
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Smart Digital Hub" className="h-6 w-auto object-contain rounded" />
              <span className="font-display font-bold text-base">
                {tabs.find(t => t.to === location.pathname)?.label || "Admin"}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Chat panel */}
      {chatOpen && (
        <div className="fixed bottom-20 right-4 z-[60] w-96 max-w-[calc(100vw-2rem)] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in"
          style={{ height: "500px" }}
        >
          <div className="flex items-center justify-between bg-primary text-primary-foreground px-4 py-3">
            <span className="font-bold text-sm">Live Help</span>
            <button onClick={() => setChatOpen(false)}><X className="h-4 w-4" /></button>
          </div>
          <div className="h-[calc(100%-44px)] overflow-auto">
            <AdminLiveChat />
          </div>
        </div>
      )}

      {/* Draggable floating Live Help button */}
      <button
        ref={btnRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="fixed z-[61] bg-primary text-primary-foreground rounded-full h-14 w-14 flex items-center justify-center shadow-lg hover:opacity-90 select-none touch-none"
        style={{ left: btnPos.x, top: btnPos.y, cursor: dragging ? "grabbing" : "grab" }}
      >
        {chatOpen ? <X className="h-6 w-6" /> : <MessagesSquare className="h-6 w-6" />}
        {!chatOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>
      {!chatOpen && (
        <span className="fixed z-[61] text-xs font-bold text-foreground select-none pointer-events-none"
          style={{ left: btnPos.x + 4, top: btnPos.y + 58 }}
        >Live Help</span>
      )}
    </div>
  );
};

export default AdminLayout;

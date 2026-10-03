import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import SmartIndex from "./pages/Index";
const IndexOrAdmin = () => {
  // Only redirect to /fastadmin if opened as installed PWA AND admin flag exists
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || (navigator as any).standalone === true;
  const isAdminSession = localStorage.getItem("fastadmin_session") === "true";
  if (isStandalone && isAdminSession) return <Navigate to="/fastadmin" replace />;
  return <SmartIndex />;
};

// Lazy load all non-critical pages
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Products = lazy(() => import("./pages/Products"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));
const Auth = lazy(() => import("./pages/Auth"));
const Account = lazy(() => import("./pages/Account"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const FastAdmin = lazy(() => import("./pages/FastAdmin"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminPayments = lazy(() => import("./pages/admin/AdminPayments"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminBanners = lazy(() => import("./pages/admin/AdminBanners"));
const AdminHotDeals = lazy(() => import("./pages/admin/AdminHotDeals"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminCustomers = lazy(() => import("./pages/admin/AdminCustomers"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminEarnings = lazy(() => import("./pages/admin/AdminEarnings"));
const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons"));
const AdminSalami = lazy(() => import("./pages/admin/AdminSalami"));
const AdminDeliveryDetails = lazy(() => import("./pages/admin/AdminDeliveryDetails"));
const Reviews = lazy(() => import("./pages/Reviews"));
const About = lazy(() => import("./pages/About"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Refund = lazy(() => import("./pages/Refund"));
const Salami = lazy(() => import("./pages/Salami"));
const TwoFA = lazy(() => import("./pages/TwoFA"));
const LivestockMap = lazy(() => import("./pages/LivestockMap"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const NotFound = lazy(() => import("./pages/NotFound"));
const NeedHelpButton = lazy(() => import("./components/NeedHelpButton"));
const ScrollToTopButton = lazy(() => import("./components/ScrollToTopButton"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3 animate-fade-in">
    <div className="h-10 w-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
    <span className="text-xs text-muted-foreground font-medium animate-pulse">স্মার্ট ডিজিটাল হাব লোড হচ্ছে...</span>
  </div>
);

// Warm the most-used route chunks once the browser is idle so navigating to
// them later doesn't wait on a network round-trip for the JS chunk.
const RoutePrefetcher = () => {
  useEffect(() => {
    const warm = () => {
      import("./pages/Products");
      import("./pages/ProductDetail");
      import("./pages/Cart");
      import("./pages/Checkout");
    };
    const ric = (window as any).requestIdleCallback;
    const id = ric ? ric(warm, { timeout: 3000 }) : window.setTimeout(warm, 2000);
    return () => {
      const cic = (window as any).cancelIdleCallback;
      if (ric && cic) cic(id);
      else clearTimeout(id);
    };
  }, []);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <CurrencyProvider>
          <AuthProvider>
          <CartProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <RoutePrefetcher />
              <Suspense fallback={null}>
                <NeedHelpButton />
                <ScrollToTopButton />
              </Suspense>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<IndexOrAdmin />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/category/:slug" element={<Products />} />
                  <Route path="/product/:slug" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/order-success" element={<OrderSuccess />} />
                  <Route path="/orders" element={<TrackOrder />} />
                  <Route path="/my-orders" element={<TrackOrder />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/login" element={<Navigate to="/auth" replace />} />
                  <Route path="/account" element={<Account />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/track-order" element={<Navigate to="/orders" replace />} />
                  <Route path="/reviews" element={<Reviews />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/refund" element={<Refund />} />
                  <Route path="/salami" element={<Salami />} />
                  <Route path="/2fa" element={<TwoFA />} />
                  <Route path="/map" element={<LivestockMap />} />
                  <Route path="/unsubscribe" element={<Unsubscribe />} />
                  <Route path="/admin-login" element={<AdminLogin />} />
                  <Route path="/fastadmin" element={<FastAdmin />} />
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Navigate to="/admin/products" replace />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="categories" element={<AdminCategories />} />
                    <Route path="payments" element={<AdminPayments />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="banners" element={<AdminBanners />} />
                    <Route path="hot-deals" element={<AdminHotDeals />} />
                    <Route path="reviews" element={<AdminReviews />} />
                    <Route path="customers" element={<AdminCustomers />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="earnings" element={<AdminEarnings />} />
                    <Route path="coupons" element={<AdminCoupons />} />
                    <Route path="salami" element={<AdminSalami />} />
                    <Route path="delivery-details" element={<AdminDeliveryDetails />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </CartProvider>
          </AuthProvider>
        </CurrencyProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
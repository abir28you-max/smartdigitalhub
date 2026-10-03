import { Search, ShoppingBag, Menu, X, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useCallback } from "react";
import { useCart } from "@/contexts/CartContext";
import logo from "@/assets/logo.png";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "About Us", to: "/about" },
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Terms & Conditions", to: "/terms" },
  { label: "Refund Policy", to: "/refund" },
];

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { totalItems } = useCart();
  const { currency, toggleCurrency } = useCurrency();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogoTap = useCallback(() => {
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      navigate("/fastadmin");
      return;
    }
    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 3000);
  }, [navigate]);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id, name, slug").order("name");
      return data || [];
    },
  });
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      <header className="bg-header sticky top-0 z-50 border-b border-border">
        <div className="container flex items-center justify-between h-14 md:h-20 gap-2">
          <div onClick={handleLogoTap} className="cursor-pointer font-display text-xl font-bold text-header-foreground tracking-tight">
            <img src={logo} alt="Smart Digital Hub" width="180" height="80" className="h-16 md:h-20 w-auto" />
          </div>

          <form onSubmit={handleSearch} className="flex flex-1 mx-2 md:mx-4 max-w-xl">
            <div className="relative w-full">
              <label htmlFor="header-search" className="sr-only">Search products</label>
              <Input
                id="header-search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-full bg-background border-2 border-muted text-foreground placeholder:text-muted-foreground pr-10 h-10"
              />
              <button type="submit" aria-label="Search products" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Search className="h-5 w-5" />
              </button>
            </div>
          </form>

          <div className="flex items-center gap-3 md:gap-5">
            <button onClick={toggleCurrency} aria-label={`Switch currency, current: ${currency}`} className="text-header-foreground text-sm font-medium hover:text-primary transition-colors">
              $ {currency}
            </button>
            <Link to="/cart" aria-label={`Shopping cart${totalItems > 0 ? `, ${totalItems} items` : ''}`} className="relative text-header-foreground hover:scale-105 active:scale-95 transition-transform">
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span key={totalItems} className="animate-cart-bounce absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-xs">
                  {totalItems}
                </span>
              )}
            </Link>
            <Link to={user ? "/account" : "/auth"} aria-label="My account" className="text-header-foreground">
              <User className="h-5 w-5" />
            </Link>
            <button onClick={() => setMenuOpen(true)} aria-label="Open menu" className="text-header-foreground md:hidden">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Desktop navigation bar */}
        <div className="hidden md:block border-t border-border bg-header">
          <div className="container flex items-center gap-6 h-11 overflow-x-auto scrollbar-none">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm font-medium text-header-foreground hover:text-primary transition-colors whitespace-nowrap"
              >
                {link.label}
              </Link>
            ))}
            <span className="h-4 w-px bg-border" />
            {categories?.slice(0, 6).map((cat) => (
              <Link
                key={cat.id}
                to={`/category/${cat.slug}`}
                className="text-sm text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] flex">
          <div className="bg-card w-72 h-full shadow-2xl animate-slide-in p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <span className="font-display text-xl font-bold text-primary">Menu</span>
              <button onClick={() => setMenuOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></button>
            </div>
            <nav className="space-y-3">
              <Link
                to={user ? "/account" : "/auth"}
                onClick={() => setMenuOpen(false)}
                className="block py-2 font-medium text-primary"
              >
                {user ? "My Account" : "Log In / Sign Up"}
              </Link>
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className="block py-2 text-foreground hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {categories && categories.length > 0 && (
              <>
                <div className="border-t border-border my-4" />
                <p className="font-display font-bold text-lg mb-2">Categories</p>
                <nav className="space-y-2">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/category/${cat.slug}`}
                      onClick={() => setMenuOpen(false)}
                      className="block py-1.5 text-foreground hover:text-primary transition-colors"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </nav>
              </>
            )}
          </div>
          <div className="flex-1 bg-foreground/40" onClick={() => setMenuOpen(false)} role="presentation" />
        </div>
      )}
    </>
  );
};

export default Header;

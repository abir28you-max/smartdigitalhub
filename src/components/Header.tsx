import { Search, ShoppingBag, Menu, X, User, Sun, Moon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useCallback, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import logo from "@/assets/logo.png";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getOptimizedImageUrl } from "@/lib/image";

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
  const [isFocused, setIsFocused] = useState(false);
  const [isFlippingCurrency, setIsFlippingCurrency] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { totalItems } = useCart();
  const { currency, toggleCurrency, formatPrice } = useCurrency();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCurrencyToggle = () => {
    setIsFlippingCurrency(true);
    toggleCurrency();
    setTimeout(() => setIsFlippingCurrency(false), 550);
  };

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

  const { data: suggestions, isFetching: isSearching } = useQuery({
    queryKey: ["search_suggestions", searchQuery.trim()],
    queryFn: async () => {
      const q = searchQuery.trim();
      if (!q) return [];
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, price, image_url, stock_status")
        .ilike("name", `%${q}%`)
        .limit(6);
      return data || [];
    },
    enabled: searchQuery.trim().length >= 1 && isFocused,
    staleTime: 30_000,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsFocused(false);
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      <header className="bg-header sticky top-0 z-50 border-b border-border shadow-xs">
        <div className="container flex items-center justify-between h-14 md:h-20 gap-2">
          {/* Logo */}
          <div onClick={handleLogoTap} className="cursor-pointer font-display text-xl font-bold text-header-foreground tracking-tight flex-shrink-0">
            <img src={logo} alt="Smart Digital Hub" width="180" height="80" className="h-14 md:h-20 w-auto" />
          </div>

          {/* Search bar restored in middle */}
          <div ref={searchContainerRef} className="relative flex flex-1 mx-2 md:mx-4 max-w-xl">
            <form onSubmit={handleSearch} className="relative w-full flex items-center">
              <label htmlFor="header-search" className="sr-only">Search products</label>
              <Input
                id="header-search"
                autoComplete="off"
                placeholder="Search 'ChatGPT', 'Netflix', 'Canva'..."
                value={searchQuery}
                onFocus={() => setIsFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsFocused(true);
                }}
                className="w-full rounded-full bg-background border-2 border-primary/25 text-foreground placeholder:text-muted-foreground pl-3 md:pl-4 pr-20 md:pr-28 h-9 md:h-11 text-xs md:text-sm transition-all duration-300 focus:border-primary focus:ring-4 focus:ring-primary/20 focus:shadow-md"
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setIsFocused(false);
                    }}
                    aria-label="Clear search"
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="submit"
                  aria-label="Search products"
                  className="h-7 md:h-8 px-2.5 md:px-3 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition-transform active:scale-95"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline font-semibold">Search</span>
                </button>
              </div>
            </form>

            {/* Live Instant Search Suggestions Dropdown */}
            {isFocused && searchQuery.trim().length >= 1 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card/95 backdrop-blur-xl border border-border/80 shadow-2xl rounded-2xl overflow-hidden z-[70] animate-fade-in-up">
                {isSearching ? (
                  <div className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                    <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Searching products...
                  </div>
                ) : suggestions && suggestions.length > 0 ? (
                  <div className="py-2 divide-y divide-border/50 max-h-80 overflow-y-auto">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Product Suggestions ({suggestions.length})
                    </div>
                    {suggestions.map((p) => {
                      const thumb = getOptimizedImageUrl(p.image_url, { width: 64, quality: 65 });
                      const productUrl = `/product/${p.slug || p.id}`;
                      return (
                        <Link
                          key={p.id}
                          to={productUrl}
                          onClick={() => {
                            setIsFocused(false);
                            setSearchQuery("");
                          }}
                          className="flex items-center gap-3 px-3 py-2.5 hover:bg-primary/5 transition-colors group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-muted/60 border border-border p-1 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {p.image_url ? (
                              <img src={thumb} alt={p.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-muted-foreground/20" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs md:text-sm font-semibold truncate text-foreground group-hover:text-primary transition-colors">
                              {p.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-bold text-primary">
                                {formatPrice(p.price)}
                              </span>
                              {p.stock_status === "in_stock" ? (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                  ● In Stock
                                </span>
                              ) : (
                                <span className="text-[10px] text-destructive font-medium">
                                  ● Stock Out
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                    <div className="p-2 bg-muted/30 text-center">
                      <button
                        type="button"
                        onClick={handleSearch}
                        className="text-xs text-primary font-bold hover:underline py-1 w-full"
                      >
                        See all results for "{searchQuery}" →
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 text-center text-xs text-muted-foreground">
                    <p className="font-medium text-foreground">No products found</p>
                    <p className="mt-1 text-[11px]">Try searching with a different keyword</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-4 flex-shrink-0">
            {/* Theme Toggle Button (Light / Dark) */}
            <button
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              className="h-8 w-8 md:h-9 md:w-9 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 flex items-center justify-center transition-all duration-200 active:scale-90 shadow-2xs group"
              title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-12" />
              ) : (
                <Sun className="h-4 w-4 text-amber-400 transition-transform duration-300 group-hover:rotate-45" />
              )}
            </button>

            <button
              onClick={handleCurrencyToggle}
              aria-label={`Switch currency, current: ${currency}`}
              className="text-header-foreground text-sm font-semibold hover:text-primary transition-colors flex items-center gap-1 active:scale-95"
            >
              <span className={`inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/25 text-xs font-bold shadow-2xs ${isFlippingCurrency ? "animate-coin-flip" : ""}`}>
                {currency === "BDT" ? "৳ BDT" : "$ USD"}
              </span>
            </button>

            <Link to="/cart" aria-label={`Shopping cart${totalItems > 0 ? `, ${totalItems} items` : ''}`} className="relative text-header-foreground hover:scale-105 active:scale-95 transition-transform p-1">
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span key={totalItems} className="animate-cart-bounce absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] rounded-full h-4 w-4 md:h-5 md:w-5 md:text-xs flex items-center justify-center font-bold shadow-xs">
                  {totalItems}
                </span>
              )}
            </Link>

            <Link to={user ? "/account" : "/auth"} aria-label="My account" className="text-header-foreground p-1 hover:text-primary transition-colors">
              <User className="h-5 w-5" />
            </Link>

            <button onClick={() => setMenuOpen(true)} aria-label="Open menu" className="text-header-foreground p-1 md:hidden hover:text-primary transition-colors">
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
        <div className="fixed inset-0 z-[80] flex">
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

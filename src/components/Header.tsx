import { Search, ShoppingBag, Menu, X, User, Sparkles, TrendingUp, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useCallback, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import logo from "@/assets/logo.png";
import { useCurrency } from "@/contexts/CurrencyContext";
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

const trendingKeywords = [
  "ChatGPT",
  "Netflix",
  "Canva Pro",
  "Spotify",
  "VPN",
  "Telegram Premium",
  "TradingView",
  "YouTube Premium",
];

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFlippingCurrency, setIsFlippingCurrency] = useState(false);
  const inputElemRef = useRef<HTMLInputElement>(null);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { totalItems } = useCart();
  const { currency, toggleCurrency, formatPrice } = useCurrency();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Global Ctrl+K / Cmd+K and Esc listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSpotlightOpen((prev) => !prev);
      }
      if (e.key === "Escape" && spotlightOpen) {
        e.preventDefault();
        setSpotlightOpen(false);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [spotlightOpen]);

  // Focus input when spotlight opens
  useEffect(() => {
    if (spotlightOpen) {
      setSelectedIndex(0);
      const timer = setTimeout(() => {
        inputElemRef.current?.focus();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [spotlightOpen]);

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
        .limit(8);
      return data || [];
    },
    enabled: searchQuery.trim().length >= 1 && spotlightOpen,
    staleTime: 30_000,
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSpotlightOpen(false);
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSpotlightKeyDown = (e: React.KeyboardEvent) => {
    if (suggestions && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const selected = suggestions[selectedIndex];
        if (selected) {
          setSpotlightOpen(false);
          setSearchQuery("");
          navigate(`/product/${selected.slug || selected.id}`);
          return;
        }
      }
    }
    if (e.key === "Enter" && searchQuery.trim()) {
      e.preventDefault();
      setSpotlightOpen(false);
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

          {/* Spotlight Search Trigger in Header */}
          <div className="flex flex-1 mx-2 md:mx-4 max-w-xl">
            <button
              type="button"
              onClick={() => setSpotlightOpen(true)}
              className="w-full flex items-center justify-between gap-2 px-3 md:px-4 h-9 md:h-11 rounded-full bg-muted/40 hover:bg-muted/75 border border-primary/25 hover:border-primary/50 text-muted-foreground transition-all duration-200 shadow-2xs group text-left cursor-pointer"
            >
              <div className="flex items-center gap-2 md:gap-2.5 truncate">
                <Search className="h-4 w-4 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-xs md:text-sm text-foreground/80 truncate font-medium">
                  Search products, tools... <span className="hidden lg:inline text-muted-foreground font-normal">(ChatGPT, Netflix, Canva)</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-background/90 border border-border text-[11px] font-medium text-muted-foreground shadow-2xs">
                  <kbd className="font-sans font-semibold text-[10px]">Ctrl</kbd>+<kbd className="font-sans font-semibold text-[10px]">K</kbd>
                </span>
                <span className="sm:hidden p-1 rounded-full bg-primary/10 text-primary">
                  <Search className="h-3.5 w-3.5" />
                </span>
              </div>
            </button>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-4 flex-shrink-0">
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

      {/* Mac Spotlight Search Modal */}
      {spotlightOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-3 sm:p-4 pt-12 md:pt-20">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in transition-opacity"
            onClick={() => setSpotlightOpen(false)}
          />

          {/* Modal Box */}
          <div
            className="relative w-full max-w-2xl bg-card border border-border/80 shadow-2xl rounded-2xl overflow-hidden z-10 animate-scale-in flex flex-col max-h-[85vh]"
          >
            {/* Search Input Bar */}
            <form onSubmit={handleSearchSubmit} className="flex items-center px-4 py-3.5 border-b border-border gap-3 bg-card">
              <Search className="h-5 w-5 text-primary shrink-0" />
              <input
                ref={inputElemRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleSpotlightKeyDown}
                placeholder="Type product name, tool, or subscription..."
                className="w-full bg-transparent text-sm md:text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    inputElemRef.current?.focus();
                  }}
                  className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setSpotlightOpen(false)}
                className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-muted text-muted-foreground border border-border hover:bg-muted/80"
              >
                ESC
              </button>
            </form>

            {/* Modal Body */}
            <div className="overflow-y-auto p-3 space-y-4 max-h-[60vh] divide-y divide-border/40">
              {/* If no search query: Show Trending / Quick Searches */}
              {!searchQuery.trim() && (
                <div className="space-y-4 pt-1">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 px-2">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <span>Trending Searches</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 px-1">
                      {trendingKeywords.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            setSearchQuery(tag);
                          }}
                          className="px-3 py-1.5 rounded-full text-xs font-medium bg-muted/70 hover:bg-primary/10 hover:text-primary border border-border/80 hover:border-primary/30 transition-all active:scale-95"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {categories && categories.length > 0 && (
                    <div className="pt-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 px-2">
                        <TrendingUp className="h-3.5 w-3.5 text-primary" />
                        <span>Browse Categories</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 px-1">
                        {categories.map((cat) => (
                          <Link
                            key={cat.id}
                            to={`/category/${cat.slug}`}
                            onClick={() => setSpotlightOpen(false)}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 hover:bg-primary/10 border border-border/60 hover:border-primary/30 transition-all text-xs font-semibold text-foreground hover:text-primary group"
                          >
                            <span>{cat.name}</span>
                            <ArrowRight className="h-3.5 w-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-primary" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* If Searching */}
              {searchQuery.trim() && (
                <div>
                  {isSearching ? (
                    <div className="p-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                      <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Searching products...
                    </div>
                  ) : suggestions && suggestions.length > 0 ? (
                    <div className="space-y-1 pt-1">
                      <div className="px-2 py-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Matching Products ({suggestions.length})
                      </div>
                      {suggestions.map((p, idx) => {
                        const thumb = getOptimizedImageUrl(p.image_url, { width: 64, quality: 65 });
                        const productUrl = `/product/${p.slug || p.id}`;
                        const isSelected = selectedIndex === idx;

                        return (
                          <Link
                            key={p.id}
                            to={productUrl}
                            onClick={() => {
                              setSpotlightOpen(false);
                              setSearchQuery("");
                            }}
                            className={`flex items-center justify-between gap-3 p-2.5 rounded-xl transition-all group ${
                              isSelected ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/60 border border-transparent"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-11 h-11 rounded-lg bg-muted border border-border p-1 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {p.image_url ? (
                                  <img src={thumb} alt={p.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform" />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-muted-foreground/20" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold truncate text-foreground group-hover:text-primary transition-colors">
                                  {p.name}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs font-bold text-primary">
                                    {formatPrice(p.price)}
                                  </span>
                                  {p.stock_status === "in_stock" ? (
                                    <span className="text-[10px] text-emerald-600 font-medium">
                                      ● In Stock
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-destructive font-medium">
                                      ● Stock Out
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-primary hidden sm:inline opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                View <ArrowRight className="h-3 w-3" />
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                      <div className="pt-2 px-2">
                        <button
                          type="button"
                          onClick={handleSearchSubmit}
                          className="w-full py-2 px-3 rounded-lg text-xs font-bold text-center text-primary hover:bg-primary/10 border border-primary/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>See all results for "{searchQuery}"</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-muted-foreground">
                      <p className="font-semibold text-foreground text-sm">No products found</p>
                      <p className="mt-1">Try searching with a different keyword like "ChatGPT", "Netflix", "Canva"</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer Info */}
            <div className="px-4 py-2.5 bg-muted/40 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
              <div className="hidden sm:flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-background border border-border font-semibold">↑↓</kbd> to navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-background border border-border font-semibold">↵</kbd> to select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-background border border-border font-semibold">ESC</kbd> to close
                </span>
              </div>
              <span className="text-[11px] font-medium text-primary ml-auto">
                Smart Digital Hub Spotlight Search
              </span>
            </div>
          </div>
        </div>
      )}

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

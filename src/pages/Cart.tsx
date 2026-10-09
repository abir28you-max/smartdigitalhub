import { useEffect, useState } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Cart = () => {
  const { items, removeItem, updateQuantity, totalPrice } = useCart();
  const { formatPrice } = useCurrency();
  const [stockMap, setStockMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const checkStock = async () => {
      if (items.length === 0) return;
      const ids = items.map((i) => i.id);
      const { data } = await supabase
        .from("products")
        .select("id, stock_status")
        .in("id", ids);
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((p) => (map[p.id] = p.stock_status));
        setStockMap(map);
      }
    };
    checkStock();
  }, [items]);

  const hasOutOfStock = items.some((item) => stockMap[item.id] && stockMap[item.id] !== "in_stock");

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-16 md:pb-0">
        <Header />
        <div className="container flex flex-col items-center justify-center py-24 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="font-display text-xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground text-sm mb-6">Looks like you haven't added anything to your cart yet.</p>
          <Button asChild><Link to="/products">Browse Products</Link></Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      <div className="container mt-4 mb-8">
        <h1 className="font-display text-2xl font-bold mb-4">Shopping Cart</h1>
        <div className="space-y-3">
          {items.map((item) => {
            const isOutOfStock = stockMap[item.id] && stockMap[item.id] !== "in_stock";
            return (
              <div key={item.id + (item.selectedOption || "")} className="bg-card rounded-lg border border-border p-3 flex gap-3 items-start">
                <div className="w-16 h-16 bg-muted rounded-md flex-shrink-0 flex items-center justify-center">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-contain rounded-md" />
                  ) : (
                    <div className="w-8 h-8 bg-muted-foreground/20 rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                    <span className="text-price font-bold text-sm ml-2 flex-shrink-0">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                  {item.selectedOption && <p className="text-xs text-muted-foreground">{item.selectedOption}</p>}
                  {isOutOfStock && (
                    <p className="text-destructive text-xs mt-1 font-medium">
                      This item is out of stock and will be excluded from checkout.
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} className="p-1 rounded border border-border"><Minus className="h-3 w-3" /></button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 rounded border border-border"><Plus className="h-3 w-3" /></button>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-destructive flex items-center gap-1 text-xs">
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-card rounded-lg border border-border p-4 mt-4">
          <h3 className="font-display font-bold mb-2">Order Summary</h3>
          <div className="flex justify-between text-sm mb-1">
            <span>Subtotal</span><span>{formatPrice(totalPrice)}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span>Shipping</span><span>Free</span>
          </div>
          <div className="flex justify-between font-bold border-t border-border pt-2">
            <span>Total</span><span>{formatPrice(totalPrice)}</span>
          </div>
        </div>

        <Button className="w-full mt-4 btn-shine" disabled={hasOutOfStock} asChild={!hasOutOfStock}>
          {hasOutOfStock ? (
            <span>Proceed to Checkout</span>
          ) : (
            <Link to="/checkout">Proceed to Checkout</Link>
          )}
        </Button>
        {hasOutOfStock && (
          <p className="text-destructive text-xs text-center mt-2">
            Please remove out of stock items to proceed.
          </p>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default Cart;
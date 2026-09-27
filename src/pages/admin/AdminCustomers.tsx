import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Customer {
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  order_count: number;
  total_spent: number;
  last_order: string;
}

const AdminCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);

  const fetchCustomers = async () => {
    const { data } = await supabase
      .from("orders")
      .select("customer_name, customer_phone, customer_email, total_price, created_at")
      .eq("status", "delivered")
      .order("created_at", { ascending: false });

    if (!data) return;

    const map = new Map<string, Customer>();
    for (const o of data) {
      const key = o.customer_phone;
      const existing = map.get(key);
      if (existing) {
        existing.order_count++;
        existing.total_spent += Number(o.total_price);
        if (o.created_at > existing.last_order) existing.last_order = o.created_at;
        if (!existing.customer_email && o.customer_email) existing.customer_email = o.customer_email;
      } else {
        map.set(key, {
          customer_name: o.customer_name,
          customer_phone: o.customer_phone,
          customer_email: o.customer_email,
          order_count: 1,
          total_spent: Number(o.total_price),
          last_order: o.created_at,
        });
      }
    }
    setCustomers(Array.from(map.values()));
  };

  useEffect(() => { fetchCustomers(); }, []);

  const handleDelete = async (phone: string) => {
    if (!confirm(`Delete all delivered orders for ${phone}? This will remove this customer from the list.`)) return;
    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("customer_phone", phone)
      .eq("status", "delivered");
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Customer removed" });
      fetchCustomers();
    }
  };

  return (
    <div>
      <h1 className="font-display text-xl font-bold mb-4">Delivered Customers</h1>
      <div className="space-y-3">
        {customers.map((c) => (
          <div key={c.customer_phone} className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium text-foreground">{c.customer_name}</div>
                <div className="text-sm text-muted-foreground mt-1">📞 {c.customer_phone}</div>
                {c.customer_email && (
                  <div className="text-sm text-muted-foreground">✉️ {c.customer_email}</div>
                )}
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  <span>Orders: {c.order_count}</span>
                  <span>Spent: ৳{c.total_spent}</span>
                  <span>Last: {new Date(c.last_order).toLocaleDateString()}</span>
                </div>
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0" onClick={() => handleDelete(c.customer_phone)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
        {customers.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No delivered customers yet.</p>
        )}
      </div>
    </div>
  );
};

export default AdminCustomers;

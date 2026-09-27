import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Search } from "lucide-react";

interface Row {
  id: string;
  name: string;
  image_url: string | null;
  requires_delivery_details: boolean;
}

const AdminDeliveryDetails = () => {
  const [products, setProducts] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const { data } = await supabase
      .from("products")
      .select("id, name, image_url, requires_delivery_details")
      .order("name");
    if (data) setProducts(data as unknown as Row[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const toggle = async (id: string, value: boolean) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, requires_delivery_details: value } : p)));
    const { error } = await supabase
      .from("products")
      .update({ requires_delivery_details: value } as any)
      .eq("id", id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      fetchData();
    } else {
      toast({ title: value ? "Delivery details enabled" : "Delivery details disabled" });
    }
  };

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  const enabledCount = products.filter((p) => p.requires_delivery_details).length;

  return (
    <div>
      <div className="mb-4">
        <h1 className="font-display text-xl font-bold">Delivery Details</h1>
        <p className="text-sm text-muted-foreground">
          Select which products ask the customer for Name, Profile Pin and Email (optional) at checkout.
          {" "}<span className="font-medium text-foreground">{enabledCount} selected</span>
        </p>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="space-y-2">
        {filtered.map((p) => (
          <div key={p.id} className="flex items-center gap-3 bg-card border border-border rounded-lg p-3">
            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
              {p.image_url && <img src={p.image_url} alt="" className="w-full h-full object-contain" />}
            </div>
            <span className="flex-1 text-sm font-medium">{p.name}</span>
            <Switch checked={p.requires_delivery_details} onCheckedChange={(v) => toggle(p.id, v)} />
          </div>
        ))}
        {!loading && filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No products found.</p>
        )}
      </div>
    </div>
  );
};

export default AdminDeliveryDetails;

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface HotDeal {
  id: string;
  name: string;
  image_url: string;
  product_id: string | null;
  sort_order: number;
  is_active: boolean;
}

interface Product {
  id: string;
  name: string;
}

const AdminHotDeals = () => {
  const [deals, setDeals] = useState<HotDeal[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<HotDeal | null>(null);
  const [form, setForm] = useState({ name: "", image_url: "", product_id: "", sort_order: "0", is_active: true });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    const [{ data: d }, { data: p }] = await Promise.all([
      supabase.from("hot_deals").select("*").order("sort_order", { ascending: true }),
      supabase.from("products").select("id, name"),
    ]);
    if (d) setDeals(d);
    if (p) setProducts(p);
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", image_url: "", product_id: "", sort_order: "0", is_active: true });
    setImageFile(null);
    setOpen(true);
  };

  const openEdit = (deal: HotDeal) => {
    setEditing(deal);
    setForm({
      name: deal.name,
      image_url: deal.image_url,
      product_id: deal.product_id || "",
      sort_order: String(deal.sort_order),
      is_active: deal.is_active,
    });
    setImageFile(null);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let image_url = form.image_url;

    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `hot-deals/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("product-images").upload(path, imageFile);
      if (upErr) {
        toast({ title: "Upload failed", description: upErr.message, variant: "destructive" });
        setLoading(false);
        return;
      }
      const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
      image_url = pub.publicUrl;
    }

    if (!image_url) {
      toast({ title: "Image required", variant: "destructive" });
      setLoading(false);
      return;
    }

    const payload = {
      name: form.name,
      image_url,
      product_id: form.product_id || null,
      sort_order: parseInt(form.sort_order) || 0,
      is_active: form.is_active,
    };

    const { error } = editing
      ? await supabase.from("hot_deals").update(payload).eq("id", editing.id)
      : await supabase.from("hot_deals").insert(payload);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editing ? "Updated" : "Created" });
      setOpen(false);
      fetchData();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this hot deal?")) return;
    await supabase.from("hot_deals").delete().eq("id", id);
    fetchData();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Hot Deals</h1>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Add</Button>
      </div>

      <div className="space-y-2">
        {deals.map((deal) => (
          <div key={deal.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg">
            <img src={deal.image_url} alt={deal.name} className="w-14 h-14 rounded-lg object-contain bg-muted" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{deal.name}</div>
              <div className="text-xs text-muted-foreground">Order: {deal.sort_order} · {deal.is_active ? "Active" : "Inactive"}</div>
            </div>
            <Button size="icon" variant="ghost" onClick={() => openEdit(deal)}><Pencil className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => handleDelete(deal.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        ))}
        {deals.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">No hot deals yet.</p>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Hot Deal" : "Add Hot Deal"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div><Label>Name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Image</Label><Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} /></div>
            {form.image_url && !imageFile && (
              <img src={form.image_url} alt="preview" className="w-16 h-16 rounded object-contain bg-muted" />
            )}
            <div>
              <Label>Link to Product (optional)</Label>
              <select
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                value={form.product_id}
                onChange={(e) => setForm({ ...form, product_id: e.target.value })}
              >
                <option value="">None</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div><Label>Sort Order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              <Label>Active</Label>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminHotDeals;

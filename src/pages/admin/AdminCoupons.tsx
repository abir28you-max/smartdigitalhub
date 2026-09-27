import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  discount_amount: number;
  is_active: boolean;
  created_at: string;
}

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState({ code: "", discount_amount: "" });
  const [loading, setLoading] = useState(false);

  const fetchCoupons = async () => {
    const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    if (data) setCoupons(data);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ code: "", discount_amount: "" });
    setOpen(true);
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({ code: c.code, discount_amount: String(c.discount_amount) });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.discount_amount) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    const payload = {
      code: form.code.trim().toUpperCase(),
      discount_amount: parseFloat(form.discount_amount) || 0,
    };

    let error;
    if (editing) {
      ({ error } = await supabase.from("coupons").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("coupons").insert(payload));
    }

    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: editing ? "Coupon updated" : "Coupon created" }); setOpen(false); fetchCoupons(); }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    await supabase.from("coupons").delete().eq("id", id);
    fetchCoupons();
  };

  const toggleActive = async (c: Coupon) => {
    await supabase.from("coupons").update({ is_active: !c.is_active }).eq("id", c.id);
    fetchCoupons();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-xl font-bold">Coupons</h1>
        <Button onClick={openCreate} size="sm"><Plus className="h-4 w-4 mr-1" /> Add Coupon</Button>
      </div>

      <div className="space-y-3">
        {coupons.map((c) => (
          <div key={c.id} className="bg-card rounded-lg border border-border p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Tag className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">{c.code}</p>
              <p className="text-xs text-muted-foreground">Discount: ৳{c.discount_amount}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {c.is_active ? "Active" : "Inactive"}
            </span>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => toggleActive(c)}>
                {c.is_active ? "Off" : "On"}
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDelete(c.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
            </div>
          </div>
        ))}
        {coupons.length === 0 && <p className="text-center text-muted-foreground py-8">No coupons yet.</p>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Coupon" : "Add Coupon"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Coupon Code</Label>
              <Input placeholder="e.g. SAVE50" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
            </div>
            <div>
              <Label>Discount Amount (BDT)</Label>
              <Input type="number" step="0.01" placeholder="e.g. 50" value={form.discount_amount} onChange={(e) => setForm({ ...form, discount_amount: e.target.value })} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCoupons;

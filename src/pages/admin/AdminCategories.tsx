import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { iconMap } from "@/components/CategoryCard";
import { slugify } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  sort_order: number;
}

const AdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", icon: "", sort_order: "0" });

  const fetchData = async () => {
    const { data } = await supabase.from("categories").select("*").order("sort_order").order("name");
    if (data) setCategories(data);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      slug: form.slug ? slugify(form.slug) : slugify(form.name),
      icon: form.icon || null,
      sort_order: parseInt(form.sort_order) || 0,
    };
    let error;
    if (editing) {
      ({ error } = await supabase.from("categories").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("categories").insert(payload));
    }
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: editing ? "Updated" : "Created" }); setOpen(false); fetchData(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    await supabase.from("categories").delete().eq("id", id);
    fetchData();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-xl font-bold">Categories</h1>
        <Button size="sm" onClick={() => { setEditing(null); setForm({ name: "", slug: "", icon: "", sort_order: "0" }); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>

      <div className="space-y-2">
        {categories.map((c) => (
          <div key={c.id} className="bg-card rounded-lg border border-border p-3 flex items-center justify-between">
            <div>
              <span className="font-medium">{c.name}</span>
              <span className="text-xs text-muted-foreground ml-2">/{c.slug}</span>
              <span className="text-xs text-muted-foreground ml-2">#{c.sort_order}</span>
              {c.icon && <span className="text-xs text-muted-foreground ml-2">icon: {c.icon}</span>}
            </div>
            <div className="space-x-1">
              <Button size="sm" variant="ghost" onClick={() => { setEditing(c); setForm({ name: c.name, slug: c.slug, icon: c.icon || "", sort_order: String(c.sort_order) }); setOpen(true); }}><Pencil className="h-3 w-3" /></Button>
              <Button size="sm" variant="ghost" onClick={() => handleDelete(c.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
            </div>
          </div>
        ))}
        {categories.length === 0 && <p className="text-center text-muted-foreground py-8">No categories yet.</p>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Category" : "Add Category"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div><Label>Name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div>
              <Label>Slug (URL short name)</Label>
              <Input
                placeholder="auto-generated from name if empty"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </div>
            <div><Label>Sort Order (lower numbers appear first)</Label><Input type="number" required value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></div>
            <div>
              <Label>Icon</Label>
              <div className="grid grid-cols-6 gap-2 mt-2 max-h-48 overflow-y-auto border border-border rounded-lg p-2">
                {Object.entries(iconMap).map(([key, Icon]) => (
                  <button
                    type="button"
                    key={key}
                    onClick={() => setForm({ ...form, icon: key })}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-colors ${form.icon === key ? "border-primary bg-primary/10" : "border-transparent hover:bg-muted"}`}
                  >
                    <Icon className="h-6 w-6 text-primary" />
                    <span className="text-[10px] text-muted-foreground leading-tight">{key}</span>
                  </button>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full">Save</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCategories;

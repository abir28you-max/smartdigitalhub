import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";

interface Banner {
  id: string;
  title: string | null;
  image_url: string;
  link: string | null;
  is_active: boolean;
  sort_order: number;
}

const AdminBanners = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState({ title: "", link: "", is_active: true });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchBanners = async () => {
    const { data } = await supabase
      .from("banners")
      .select("*")
      .order("sort_order", { ascending: true });
    if (data) setBanners(data);
  };

  useEffect(() => { fetchBanners(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", link: "", is_active: true });
    setImageFile(null);
    setOpen(true);
  };

  const openEdit = (b: Banner) => {
    setEditing(b);
    setForm({ title: b.title || "", link: b.link || "", is_active: b.is_active });
    setImageFile(null);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let imageUrl = editing?.image_url || "";

    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `banners/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("product-images").upload(path, imageFile);
      if (upErr) {
        toast({ title: "Upload failed", description: upErr.message, variant: "destructive" });
        setLoading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
      imageUrl = urlData.publicUrl;
    }

    if (!imageUrl && !editing) {
      toast({ title: "Image required", variant: "destructive" });
      setLoading(false);
      return;
    }

    const payload = {
      title: form.title || null,
      image_url: imageUrl,
      link: form.link || null,
      is_active: form.is_active,
    };

    let error;
    if (editing) {
      ({ error } = await supabase.from("banners").update(payload).eq("id", editing.id));
    } else {
      const maxOrder = banners.length > 0 ? Math.max(...banners.map(b => b.sort_order)) + 1 : 0;
      ({ error } = await supabase.from("banners").insert({ ...payload, sort_order: maxOrder }));
    }

    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: editing ? "Banner updated" : "Banner created" }); setOpen(false); fetchBanners(); }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this banner?")) return;
    await supabase.from("banners").delete().eq("id", id);
    fetchBanners();
  };

  const toggleActive = async (b: Banner) => {
    await supabase.from("banners").update({ is_active: !b.is_active }).eq("id", b.id);
    fetchBanners();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-xl font-bold">Banners</h1>
        <Button onClick={openCreate} size="sm"><Plus className="h-4 w-4 mr-1" /> Add Banner</Button>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3">Image</th>
                <th className="text-left p-3">Title</th>
                <th className="text-left p-3">Active</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((b) => (
                <tr key={b.id} className="border-t border-border">
                  <td className="p-3">
                    <img src={b.image_url} alt="" className="w-24 h-12 rounded object-cover bg-muted" />
                  </td>
                  <td className="p-3 font-medium">{b.title || "—"}</td>
                  <td className="p-3">
                    <Switch checked={b.is_active} onCheckedChange={() => toggleActive(b)} />
                  </td>
                  <td className="p-3 text-right space-x-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(b)}><Pencil className="h-3 w-3" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(b.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                  </td>
                </tr>
              ))}
              {banners.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No banners yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {banners.map((b) => (
          <div key={b.id} className="bg-card rounded-lg border border-border p-3">
            <img src={b.image_url} alt="" className="w-full h-28 rounded-lg object-cover bg-muted mb-2" />
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-sm">{b.title || "—"}</span>
                <div className="flex items-center gap-2 mt-1">
                  <Switch checked={b.is_active} onCheckedChange={() => toggleActive(b)} />
                  <span className="text-xs text-muted-foreground">{b.is_active ? "Active" : "Inactive"}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(b)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDelete(b.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
              </div>
            </div>
          </div>
        ))}
        {banners.length === 0 && <p className="text-center text-muted-foreground py-8">No banners yet.</p>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Banner" : "Add Banner"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div><Label>Title (optional)</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Link (optional)</Label><Input placeholder="/products or https://..." value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} /></div>
            <div>
              <Label>Banner Image <span className="text-xs text-muted-foreground">(Recommended: 1600×700 px / 16:7)</span></Label>
              <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} required={!editing} />
            </div>
            {editing && !imageFile && <img src={editing.image_url} alt="" className="w-full h-32 object-cover rounded bg-muted" />}
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label>Active</Label>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBanners;

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Upload, Smartphone, Building2, Bitcoin } from "lucide-react";
import { PaymentLogo } from "@/components/PaymentLogo";

type PaymentType = "mobile" | "bank" | "crypto";

interface PM {
  id: string;
  name: string;
  account_number: string | null;
  instructions: string | null;
  is_active: boolean;
  logo_url: string | null;
  holder_name: string | null;
  branch: string | null;
}

const detectType = (name: string): PaymentType => {
  const lower = name.toLowerCase();
  if (lower.includes("bank")) return "bank";
  if (lower.includes("binance") || lower.includes("crypto") || lower.includes("usdt")) return "crypto";
  return "mobile";
};

const typeLabel: Record<PaymentType, { icon: React.ReactNode; label: string; badge: string }> = {
  mobile: { icon: <Smartphone className="h-4 w-4" />, label: "Mobile Banking", badge: "Mobile" },
  bank: { icon: <Building2 className="h-4 w-4" />, label: "Bank Transfer", badge: "Bank" },
  crypto: { icon: <Bitcoin className="h-4 w-4" />, label: "Crypto (Binance)", badge: "Crypto" },
};

const AdminPayments = () => {
  const [methods, setMethods] = useState<PM[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PM | null>(null);
  const [form, setForm] = useState({ name: "", account_number: "", instructions: "", is_active: true, logo_url: "", holder_name: "", branch: "" });
  const [paymentType, setPaymentType] = useState<PaymentType>("mobile");
  const [uploading, setUploading] = useState(false);

  const fetchData = async () => {
    const { data } = await supabase.from("payment_methods").select("*").order("created_at");
    if (data) setMethods(data as PM[]);
  };

  useEffect(() => { fetchData(); }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `payment-logos/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } else {
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
      setForm({ ...form, logo_url: urlData.publicUrl });
      toast({ title: "Logo uploaded!" });
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      account_number: form.account_number || null,
      instructions: form.instructions || null,
      is_active: form.is_active,
      logo_url: form.logo_url || null,
      holder_name: form.holder_name || null,
      branch: form.branch || null,
    };
    let error;
    if (editing) {
      ({ error } = await supabase.from("payment_methods").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("payment_methods").insert(payload));
    }
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Saved" }); setOpen(false); fetchData(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    await supabase.from("payment_methods").delete().eq("id", id);
    fetchData();
  };

  const getAccountLabel = () => {
    if (paymentType === "bank") return "Bank Account Number";
    if (paymentType === "crypto") return "Wallet ID / Address";
    return "Account Number";
  };

  const getNamePlaceholder = () => {
    if (paymentType === "bank") return "e.g. Pubali Bank, Dutch Bangla Bank";
    if (paymentType === "crypto") return "e.g. Binance, TRC20-USDT";
    return "e.g. bKash, Nagad, Rocket";
  };

  const getInstructionsPlaceholder = () => {
    if (paymentType === "bank") return "e.g. Fund Transfer → NPSB → Select Bank Name → Enter A/C No. → Pay";
    if (paymentType === "crypto") return "e.g. Send Crypto / Pay → Paste ID/Address → Enter Amount → Confirm";
    return "e.g. Send Money → Enter Number → Enter Amount → Confirm";
  };

  // Group methods by type
  const grouped = {
    mobile: methods.filter(m => detectType(m.name) === "mobile"),
    bank: methods.filter(m => detectType(m.name) === "bank"),
    crypto: methods.filter(m => detectType(m.name) === "crypto"),
  };

  const renderMethodCard = (m: PM) => {
    const type = detectType(m.name);
    const info = typeLabel[type];
    return (
      <div key={m.id} className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PaymentLogo name={m.name} logoUrl={m.logo_url} size="md" />
            <div>
              <span className="font-medium">{m.name}</span>
              <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{info.badge}</span>
              {!m.is_active && <span className="text-xs text-destructive ml-2">(Inactive)</span>}
            </div>
          </div>
          <div className="space-x-1">
            <Button size="sm" variant="ghost" onClick={() => { setEditing(m); setPaymentType(detectType(m.name)); setForm({ name: m.name, account_number: m.account_number || "", instructions: m.instructions || "", is_active: m.is_active, logo_url: m.logo_url || "", holder_name: m.holder_name || "", branch: m.branch || "" }); setOpen(true); }}><Pencil className="h-3 w-3" /></Button>
            <Button size="sm" variant="ghost" onClick={() => handleDelete(m.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
          </div>
        </div>
        {m.account_number && (
          <p className="text-sm text-muted-foreground mt-1">
            {type === "bank" ? "A/C No" : type === "crypto" ? "ID/Address" : "Number"}: {m.account_number}
          </p>
        )}
        {type === "bank" && m.holder_name && (
          <p className="text-sm text-muted-foreground">Holder: {m.holder_name}</p>
        )}
        {type === "bank" && m.branch && (
          <p className="text-sm text-muted-foreground">Branch: {m.branch}</p>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-xl font-bold">Payment Methods</h1>
        <Button size="sm" onClick={() => { setEditing(null); setPaymentType("mobile"); setForm({ name: "", account_number: "", instructions: "", is_active: true, logo_url: "", holder_name: "", branch: "" }); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>

      <div className="space-y-5">
        {(["mobile", "bank", "crypto"] as PaymentType[]).map((type) => {
          const items = grouped[type];
          if (items.length === 0) return null;
          const info = typeLabel[type];
          return (
            <div key={type}>
              <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-muted-foreground">
                {info.icon}
                <span>{info.label}</span>
              </div>
              <div className="space-y-2">
                {items.map(renderMethodCard)}
              </div>
            </div>
          );
        })}
        {methods.length === 0 && <p className="text-center text-muted-foreground py-8">No payment methods yet.</p>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Payment Method</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label>Payment Type</Label>
              <Select value={paymentType} onValueChange={(v: PaymentType) => setPaymentType(v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mobile">
                    <span className="flex items-center gap-2"><Smartphone className="h-4 w-4" /> Mobile Banking</span>
                  </SelectItem>
                  <SelectItem value="bank">
                    <span className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Bank Transfer</span>
                  </SelectItem>
                  <SelectItem value="crypto">
                    <span className="flex items-center gap-2"><Bitcoin className="h-4 w-4" /> Crypto (Binance)</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Logo</Label>
              <div className="flex items-center gap-3 mt-1">
                {form.logo_url ? (
                  <img src={form.logo_url} alt="Logo" className="w-12 h-12 rounded-lg object-contain border border-border" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <Input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploading} className="text-xs" />
                  {uploading && <p className="text-xs text-muted-foreground mt-1">Uploading...</p>}
                </div>
              </div>
            </div>
            <div><Label>Name</Label><Input required placeholder={getNamePlaceholder()} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>{getAccountLabel()}</Label><Input value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} /></div>
            {paymentType === "bank" && (
              <>
                <div><Label>Holder Name</Label><Input placeholder="Account holder name" value={form.holder_name} onChange={(e) => setForm({ ...form, holder_name: e.target.value })} /></div>
                <div><Label>Branch</Label><Input placeholder="e.g. Mirpur Branch" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} /></div>
              </>
            )}
            <div><Label>Instructions</Label><Textarea placeholder={getInstructionsPlaceholder()} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} /></div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label>Active</Label>
            </div>
            <Button type="submit" className="w-full">Save</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPayments;

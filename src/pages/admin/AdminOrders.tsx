import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Mail, Settings, RefreshCw, Send, Video, PlayCircle } from "lucide-react";
import { sendDeliveryEmail, getEmailSettings, saveEmailSettings } from "@/lib/sendDeliveryEmail";
import { RedeemVideoPlayer } from "@/components/RedeemVideoPlayer";

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  items: any;
  total_price: number;
  transaction_id: string | null;
  status: string;
  created_at: string;
  coupon_code: string | null;
  payment_methods?: { name: string } | null;
  delivery_notes?: { note: string; link: string; video_url?: string }[] | null;
  delivery_details?: { product_name?: string; option?: string | null; name?: string; profile_pin?: string; email?: string | null }[] | null;
}

interface DeliveryNote {
  note: string;
  link: string;
  video_url?: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  verified: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  delivered: "bg-blue-100 text-blue-800",
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("all");
  const [deliverDialogOpen, setDeliverDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>([{ note: "", link: "" }]);
  const [resendApiKey, setResendApiKey] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  const fetchData = async () => {
    let query = supabase.from("orders").select("*, payment_methods(name)").order("created_at", { ascending: false });
    if (filter !== "all") query = query.eq("status", filter);
    const { data } = await query;
    if (data) setOrders(data as unknown as Order[]);
  };

  useEffect(() => {
    fetchData();
    getEmailSettings().then((s) => {
      setResendApiKey(s.apiKey);
      setSenderEmail(s.senderEmail);
    });
  }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: `Order ${status}` }); fetchData(); }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this order? / আপনি কি এই অর্ডারটি স্থায়ীভাবে ডিলিট করতে চান?")) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) {
      toast({ title: "Error deleting order", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "🗑️ Order deleted successfully!" });
      fetchData();
    }
  };

  const openDeliverDialog = (order: Order) => {
    setSelectedOrder(order);
    const existing = order.delivery_notes;
    setDeliveryNotes(existing && existing.length > 0 ? existing : [{ note: "", link: "", video_url: "" }]);
    setDeliverDialogOpen(true);
  };

  const handleDeliver = async () => {
    if (!selectedOrder) return;
    const notes = deliveryNotes.filter(n => n.note.trim() || n.link.trim() || (n.video_url && n.video_url.trim()));
    setSendingEmail(true);

    const { error } = await supabase.from("orders").update({
      status: "delivered",
      delivery_notes: notes.length > 0 ? notes : null,
    } as any).eq("id", selectedOrder.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Order marked as Delivered!" });
      
      // Send Email to customer via Resend
      if (selectedOrder.customer_email) {
        const mailRes = await sendDeliveryEmail({
          recipientEmail: selectedOrder.customer_email,
          customerName: selectedOrder.customer_name,
          orderId: selectedOrder.id,
          transactionId: selectedOrder.transaction_id,
          totalPrice: selectedOrder.total_price,
          items: Array.isArray(selectedOrder.items) ? selectedOrder.items : [],
          notes,
        });

        if (mailRes.success) {
          toast({ title: "✅ Email Delivered!", description: `Details sent to ${selectedOrder.customer_email}` });
        } else {
          toast({
            title: "⚠️ Email Failed to Send",
            description: mailRes.error,
            variant: "destructive",
          });
        }
      } else {
        toast({ title: "No customer email provided on order." });
      }

      fetchData();
    }

    setSendingEmail(false);
    setDeliverDialogOpen(false);
    setSelectedOrder(null);
  };

  const handleResendEmail = async (order: Order) => {
    if (!order.customer_email) {
      toast({ title: "Customer email is missing", variant: "destructive" });
      return;
    }
    const notes = order.delivery_notes || [];
    const mailRes = await sendDeliveryEmail({
      recipientEmail: order.customer_email,
      customerName: order.customer_name,
      orderId: order.id,
      transactionId: order.transaction_id,
      totalPrice: order.total_price,
      items: Array.isArray(order.items) ? order.items : [],
      notes,
    });

    if (mailRes.success) {
      toast({ title: "✅ Email Resent!", description: `Details sent to ${order.customer_email}` });
    } else {
      toast({
        title: "⚠️ Email Failed",
        description: mailRes.error,
        variant: "destructive",
      });
    }
  };

  const handleSaveSettings = async () => {
    await saveEmailSettings(resendApiKey, senderEmail);
    toast({ title: "Email settings saved successfully!" });
    setSettingsOpen(false);
  };

  const updateNote = (index: number, field: "note" | "link" | "video_url", value: string) => {
    setDeliveryNotes(prev => prev.map((n, i) => i === index ? { ...n, [field]: value } : n));
  };

  const addNote = () => setDeliveryNotes(prev => [...prev, { note: "", link: "", video_url: "" }]);
  const removeNote = (index: number) => setDeliveryNotes(prev => prev.filter((_, i) => i !== index));

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-xl font-bold">Orders</h1>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-1.5 text-xs"
          >
            <Settings className="h-3.5 w-3.5" /> Email Settings
          </Button>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {orders.map((o) => {
          const items = Array.isArray(o.items) ? o.items : [];
          const pm = o.payment_methods as { name: string } | null;
          return (
            <div key={o.id} className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="font-medium">{o.customer_name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{o.customer_phone}</span>
                  {o.customer_email && <span className="text-xs text-muted-foreground ml-2">• {o.customer_email}</span>}
                </div>
                <Badge className={statusColors[o.status] || ""}>{o.status}</Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                {items.map((item: any, i: number) => (
                  <div key={i}>{item.name} × {item.quantity} {item.option && `(${item.option})`}</div>
                ))}
                <div className="font-bold text-foreground">Total: ৳{o.total_price}</div>
                {pm && <div>Payment: {pm.name}</div>}
                {o.transaction_id && <div>TxnID: {o.transaction_id}</div>}
                {Array.isArray(o.delivery_details) && o.delivery_details.length > 0 && (
                  <div className="mt-2 rounded-md bg-muted/50 p-2 space-y-1">
                    <p className="text-xs font-semibold text-foreground">Customer Delivery Requirements</p>
                    {o.delivery_details.map((d, i) => (
                      <div key={i} className="text-xs">
                        <span className="font-medium text-foreground">{d.product_name}{d.option ? ` (${d.option})` : ""}:</span>{" "}
                        Name: {d.name} • PIN: {d.profile_pin}{d.email ? ` • Email: ${d.email}` : ""}
                      </div>
                    ))}
                  </div>
                )}
                {Array.isArray(o.delivery_notes) && o.delivery_notes.length > 0 && (
                  <div className="mt-2 rounded-md bg-primary/5 border border-primary/20 p-2.5 space-y-2">
                    <p className="text-xs font-bold text-primary">Delivered Information / Access</p>
                    {o.delivery_notes.map((dn, i) => (
                      <div key={i} className="text-xs text-foreground bg-card p-2.5 rounded-lg border border-border space-y-1.5">
                        {dn.note && <div className="font-mono whitespace-pre-wrap">{dn.note}</div>}
                        {dn.link && (
                          <a href={dn.link} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold underline block">
                            {dn.link}
                          </a>
                        )}
                        {dn.video_url && (
                          <div className="pt-1">
                            <RedeemVideoPlayer videoUrl={dn.video_url} variant="card" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="text-xs mt-2">{new Date(o.created_at).toLocaleString()}</div>
              </div>

              {o.status === "pending" && (
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button size="sm" onClick={() => updateStatus(o.id, "verified")} className="bg-accent text-accent-foreground hover:bg-accent/90">Verify Payment</Button>
                  <Button size="sm" variant="destructive" onClick={() => updateStatus(o.id, "rejected")}>Reject</Button>
                  <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteOrder(o.id)}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                  </Button>
                </div>
              )}

              {o.status === "rejected" && (
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button size="sm" variant="destructive" onClick={() => handleDeleteOrder(o.id)}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete Order (ডিলিট)
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => updateStatus(o.id, "pending")}>
                    Move to Pending
                  </Button>
                </div>
              )}

              {o.status === "verified" && (
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => openDeliverDialog(o)}>
                    <Send className="h-3.5 w-3.5 mr-1" /> Deliver & Send Email
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => updateStatus(o.id, "rejected")}>Reject</Button>
                  <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteOrder(o.id)}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                  </Button>
                </div>
              )}

              {o.status === "delivered" && (
                <div className="flex flex-wrap gap-2 mt-3 items-center">
                  <Button size="sm" variant="outline" onClick={() => openDeliverDialog(o)}>
                    Edit Delivery Info
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleResendEmail(o)}>
                    <Mail className="h-3.5 w-3.5 mr-1" /> Resend Email
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 ml-auto" onClick={() => handleDeleteOrder(o.id)}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                  </Button>
                </div>
              )}
            </div>
          );
        })}
        {orders.length === 0 && <p className="text-center text-muted-foreground py-8">No orders found.</p>}
      </div>

      {/* Deliver Dialog */}
      <Dialog open={deliverDialogOpen} onOpenChange={setDeliverDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Deliver Order & Send Email</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1 border border-border">
                <p><strong>Customer:</strong> {selectedOrder.customer_name}</p>
                <p><strong>Email:</strong> {selectedOrder.customer_email || "No email provided"}</p>
                <p><strong>Subscriptions:</strong></p>
                {Array.isArray(selectedOrder.items) && selectedOrder.items.map((item: any, i: number) => (
                  <div key={i} className="ml-3">• {item.name} {item.option && `(${item.option})`}</div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Delivery Access & Credentials</p>
                  <span className="text-xs text-muted-foreground">Will be emailed to customer</span>
                </div>
                {deliveryNotes.map((dn, i) => (
                  <div key={i} className="border border-border rounded-lg p-3 space-y-2 relative bg-card">
                    {deliveryNotes.length > 1 && (
                      <button onClick={() => removeNote(i)} className="absolute top-2 right-2 text-destructive hover:text-destructive/80">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Account Info / Password / Note</label>
                      <Textarea
                        placeholder="Email: customer@example.com&#10;Password: password123"
                        value={dn.note}
                        onChange={(e) => updateNote(i, "note", e.target.value)}
                        rows={3}
                        className="font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Subscription Link (optional)</label>
                      <Input
                        placeholder="https://..."
                        value={dn.link}
                        onChange={(e) => updateNote(i, "link", e.target.value)}
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <Video className="h-3.5 w-3.5 text-rose-500" />
                          Redeem Video Tutorial URL (Optional)
                        </label>
                        {dn.video_url && dn.video_url.trim() && (
                          <RedeemVideoPlayer videoUrl={dn.video_url} variant="button" />
                        )}
                      </div>
                      <Input
                        placeholder="https://youtube.com/shorts/... or MP4 video link (Optional)"
                        value={dn.video_url || ""}
                        onChange={(e) => updateNote(i, "video_url", e.target.value)}
                        className="text-xs font-mono"
                      />
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        💡 কাস্টমারকে কীভাবে প্রোডাক্ট রিডিম করতে হবে তা দেখানোর জন্য YouTube Shorts, YouTube, Loom বা MP4 ভিডিও লিঙ্ক দিন
                      </p>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addNote} className="w-full">
                  <Plus className="h-4 w-4 mr-1" /> Add Another Item
                </Button>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeliverDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDeliver} disabled={sendingEmail}>
              {sendingEmail ? "Sending..." : "Confirm Delivery & Send Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resend Email Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" /> Resend Email Settings
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Resend API Key</label>
              <Input
                type="password"
                placeholder="re_123456789..."
                value={resendApiKey}
                onChange={(e) => setResendApiKey(e.target.value)}
                className="font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                Get this from your <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">Resend Dashboard &rarr; API Keys</a>
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Sender Email (From)</label>
              <Input
                placeholder="Smart Digital Hub <onboarding@resend.dev>"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Default: <code>Smart Digital Hub &lt;onboarding@resend.dev&gt;</code> or your verified domain.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSettings}>Save Settings</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;

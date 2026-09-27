import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, ShoppingBag, Wallet, Clock, Search, Mail, Phone, Calendar } from "lucide-react";

interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
}

interface Order {
  id: string;
  user_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  items: any;
  total_price: number;
  transaction_id: string | null;
  coupon_code: string | null;
  status: string;
  created_at: string;
}

interface UserRow extends Profile {
  orders: Order[];
  totalOrders: number;
  approvedSpent: number;
  pendingAmount: number;
  lastOrder: string | null;
}

const statusColor = (s: string) => {
  if (s === "delivered") return "bg-emerald-500/15 text-emerald-600";
  if (s === "verified") return "bg-blue-500/15 text-blue-600";
  if (s === "rejected") return "bg-destructive/15 text-destructive";
  return "bg-amber-500/15 text-amber-600";
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const AdminUsers = () => {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<UserRow | null>(null);

  useEffect(() => {
    const load = async () => {
      const [{ data: profiles }, { data: orders }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, phone, email, created_at").order("created_at", { ascending: false }),
        supabase
          .from("orders")
          .select("id, user_id, customer_name, customer_phone, customer_email, items, total_price, transaction_id, coupon_code, status, created_at")
          .order("created_at", { ascending: false }),
      ]);

      const allOrders = (orders || []) as Order[];
      const list: UserRow[] = (profiles || []).map((p: Profile) => {
        const mine = allOrders.filter(
          (o) =>
            o.user_id === p.id ||
            (!o.user_id &&
              ((p.email && o.customer_email && o.customer_email.toLowerCase() === p.email.toLowerCase()) ||
                (p.phone && o.customer_phone && o.customer_phone.replace(/\D/g, "") === p.phone.replace(/\D/g, "")))),
        );
        const approvedSpent = mine
          .filter((o) => o.status === "verified" || o.status === "delivered")
          .reduce((s, o) => s + Number(o.total_price), 0);
        const pendingAmount = mine
          .filter((o) => o.status === "pending")
          .reduce((s, o) => s + Number(o.total_price), 0);
        return {
          ...p,
          orders: mine,
          totalOrders: mine.length,
          approvedSpent,
          pendingAmount,
          lastOrder: mine[0]?.created_at ?? null,
        };
      });

      setRows(list);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.full_name, r.email, r.phone].filter(Boolean).some((v) => (v as string).toLowerCase().includes(q)),
    );
  }, [rows, search]);

  const stats = useMemo(
    () => ({
      users: rows.length,
      withOrders: rows.filter((r) => r.totalOrders > 0).length,
      orders: rows.reduce((s, r) => s + r.totalOrders, 0),
      revenue: rows.reduce((s, r) => s + r.approvedSpent, 0),
    }),
    [rows],
  );

  return (
    <div>
      <h1 className="font-display text-xl font-bold mb-4">Registered Users</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          { icon: Users, label: "Total Users", value: stats.users },
          { icon: ShoppingBag, label: "Users with Orders", value: stats.withOrders },
          { icon: Clock, label: "Total Orders", value: stats.orders },
          { icon: Wallet, label: "Approved Revenue", value: `৳${stats.revenue.toLocaleString()}` },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <s.icon className="h-4 w-4" /> {s.label}
            </div>
            <div className="text-xl font-bold mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="relative mb-4">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or phone"
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading users…</div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-muted-foreground">No users found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((u) => (
            <div key={u.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="font-medium truncate">{u.full_name || "Unnamed User"}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Mail className="h-3.5 w-3.5" /> {u.email || "—"}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" /> {u.phone || "—"}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Calendar className="h-3.5 w-3.5" /> Joined {fmtDate(u.created_at)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm">
                    <span className="font-semibold">{u.totalOrders}</span>{" "}
                    <span className="text-muted-foreground">orders</span>
                  </div>
                  <div className="text-sm text-emerald-600 font-semibold">৳{u.approvedSpent.toLocaleString()}</div>
                  {u.pendingAmount > 0 && (
                    <div className="text-xs text-amber-600">Pending ৳{u.pendingAmount.toLocaleString()}</div>
                  )}
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => setSelected(u)}>
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected?.full_name || "Unnamed User"}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Email:</span> {selected.email || "—"}</div>
                <div><span className="text-muted-foreground">Phone:</span> {selected.phone || "—"}</div>
                <div><span className="text-muted-foreground">Joined:</span> {fmtDate(selected.created_at)}</div>
                <div><span className="text-muted-foreground">Last Order:</span> {selected.lastOrder ? fmtDate(selected.lastOrder) : "—"}</div>
                <div><span className="text-muted-foreground">Total Orders:</span> {selected.totalOrders}</div>
                <div><span className="text-muted-foreground">Approved Spent:</span> ৳{selected.approvedSpent.toLocaleString()}</div>
                <div><span className="text-muted-foreground">Pending:</span> ৳{selected.pendingAmount.toLocaleString()}</div>
                <div className="col-span-2 text-xs text-muted-foreground break-all">User ID: {selected.id}</div>
              </div>

              <div>
                <div className="font-semibold mb-2">Order History</div>
                {selected.orders.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No orders yet.</div>
                ) : (
                  <div className="space-y-2">
                    {selected.orders.map((o) => (
                      <div key={o.id} className="border border-border rounded-lg p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-medium">৳{Number(o.total_price).toLocaleString()}</div>
                          <Badge className={statusColor(o.status)}>{o.status}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{fmtDate(o.created_at)}</div>
                        <ul className="text-sm mt-2 list-disc pl-4">
                          {(Array.isArray(o.items) ? o.items : []).map((it: any, i: number) => (
                            <li key={i}>
                              {it.name || it.product_name || "Item"}
                              {it.option ? ` — ${it.option}` : ""}
                              {it.quantity ? ` × ${it.quantity}` : ""}
                            </li>
                          ))}
                        </ul>
                        <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
                          <div>Name: {o.customer_name} · Phone: {o.customer_phone}</div>
                          {o.customer_email && <div>Email: {o.customer_email}</div>}
                          {o.transaction_id && <div>Trx ID: {o.transaction_id}</div>}
                          {o.coupon_code && <div>Coupon: {o.coupon_code}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
import { useEffect, useState } from "react";
import AdminSkeleton from "@/components/AdminSkeleton";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, TrendingUp } from "lucide-react";

const AdminEarnings = () => {
  const [monthEarn, setMonthEarn] = useState(0);
  const [totalEarn, setTotalEarn] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      const { data } = await supabase
        .from("orders")
        .select("total_price, created_at")
        .eq("status", "delivered");

      if (!data) { setLoading(false); return; }

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      let total = 0;
      let month = 0;
      for (const o of data) {
        const amount = Number(o.total_price);
        total += amount;
        if (o.created_at >= monthStart) month += amount;
      }

      setTotalEarn(total);
      setMonthEarn(month);
      setLoading(false);
    };
    fetchEarnings();
  }, []);

  if (loading) return <AdminSkeleton />;

  return (
    <div>
      <h1 className="font-display text-xl font-bold mb-4">Earnings</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground font-medium">This Month</span>
          </div>
          <p className="text-2xl font-bold text-foreground">৳{monthEarn.toLocaleString()}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <span className="text-sm text-muted-foreground font-medium">Total Earn</span>
          </div>
          <p className="text-2xl font-bold text-foreground">৳{totalEarn.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminEarnings;

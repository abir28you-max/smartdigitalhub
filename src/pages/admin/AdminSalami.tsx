import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Gift, Copy, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Submission {
  id: string;
  name: string | null;
  bkash_number: string;
  note: string | null;
  is_completed: boolean;
  created_at: string;
}

const AdminSalami = () => {
  const [data, setData] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = async () => {
    const { data: rows } = await supabase
      .from("salami_submissions")
      .select("*")
      .order("created_at", { ascending: false });
    setData((rows as Submission[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id: string) => {
    await supabase.from("salami_submissions").delete().eq("id", id);
    setData((prev) => prev.filter((s) => s.id !== id));
    toast({ title: "Deleted" });
  };

  const toggleCompleted = async (id: string, current: boolean) => {
    await supabase.from("salami_submissions").update({ is_completed: !current }).eq("id", id);
    setData((prev) => prev.map((s) => s.id === id ? { ...s, is_completed: !current } : s));
    toast({ title: !current ? "Completed ✅" : "Unmarked" });
  };

  const copyNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    toast({ title: "Copied!", description: num });
  };

  const completedCount = data.filter((s) => s.is_completed).length;

  if (loading) return <div className="animate-pulse space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2"><Gift className="h-5 w-5 text-primary" /> Eid Salami</h1>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="text-green-600 font-medium">{completedCount} done</span>
          <span>{data.length} জন</span>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">কোনো সাবমিশন নেই</div>
      ) : (
        <div className="space-y-2">
          {data.map((s, i) => (
            <div key={s.id} className={`bg-card border rounded-xl p-4 flex items-start gap-3 ${s.is_completed ? "border-green-200 bg-green-50/50" : "border-border"}`}>
              <span className="text-xs text-muted-foreground mt-1 w-6">{i + 1}</span>
              <button onClick={() => toggleCompleted(s.id, s.is_completed)} className="mt-0.5 shrink-0">
                {s.is_completed
                  ? <CheckCircle2 className="h-5 w-5 text-green-600" />
                  : <Circle className="h-5 w-5 text-muted-foreground/40 hover:text-green-500 transition-colors" />
                }
              </button>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold text-sm truncate ${s.is_completed ? "line-through text-muted-foreground" : ""}`}>{s.name || "—"}</span>
                </div>
                <button onClick={() => copyNumber(s.bkash_number)} className="flex items-center gap-1 text-primary text-sm font-mono hover:underline">
                  {s.bkash_number} <Copy className="h-3 w-3" />
                </button>
                {s.note && <p className="text-xs text-muted-foreground">{s.note}</p>}
                <p className="text-[10px] text-muted-foreground">
                  {new Date(s.created_at).toLocaleString("bn-BD")}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(s.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSalami;

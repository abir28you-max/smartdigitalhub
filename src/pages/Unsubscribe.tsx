import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, MailX, CheckCircle2, AlertCircle } from "lucide-react";

type State = "loading" | "valid" | "used" | "invalid" | "success" | "error";

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<State>("loading");
  const [email, setEmail] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const validate = async () => {
      if (!token) return setState("invalid");
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`;
        const res = await fetch(url, {
          headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data?.valid === false) {
          setState(data?.reason === "already_used" || data?.used ? "used" : "invalid");
          return;
        }
        setEmail(data?.email ?? null);
        setState(data?.used_at ? "used" : "valid");
      } catch {
        setState("error");
      }
    };
    validate();
  }, [token]);

  const confirm = async () => {
    setSubmitting(true);
    const { error } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
    setSubmitting(false);
    setState(error ? "error" : "success");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        {state === "loading" && (
          <>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">Checking your link...</p>
          </>
        )}

        {state === "valid" && (
          <>
            <MailX className="mx-auto h-10 w-10 text-primary" />
            <h1 className="mt-4 text-xl font-bold">Unsubscribe from emails</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {email ? <>You will stop receiving emails at <span className="font-medium text-foreground">{email}</span>.</> : "You will stop receiving emails from Tech Subx BD."}
            </p>
            <Button className="mt-6 w-full" onClick={confirm} disabled={submitting}>
              {submitting ? "Processing..." : "Confirm Unsubscribe"}
            </Button>
          </>
        )}

        {state === "success" && (
          <>
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
            <h1 className="mt-4 text-xl font-bold">You're unsubscribed</h1>
            <p className="mt-2 text-sm text-muted-foreground">You will no longer receive these emails.</p>
          </>
        )}

        {state === "used" && (
          <>
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
            <h1 className="mt-4 text-xl font-bold">Already unsubscribed</h1>
            <p className="mt-2 text-sm text-muted-foreground">This link has already been used.</p>
          </>
        )}

        {(state === "invalid" || state === "error") && (
          <>
            <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
            <h1 className="mt-4 text-xl font-bold">Link not valid</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This unsubscribe link is invalid or expired. Please contact support if you keep receiving emails.
            </p>
          </>
        )}

        <a href="/" className="mt-6 inline-block text-sm text-primary underline">Back to Tech Subx BD</a>
      </div>
    </div>
  );
};

export default Unsubscribe;

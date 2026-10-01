import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2, LogIn, UserPlus } from "lucide-react";

type Mode = "login" | "signup" | "forgot";

const safeNext = (value: string | null) =>
  value && value.startsWith("/") && !value.startsWith("//") ? value : "/account";

const Auth = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const forwardState = (location.state as any)?.checkoutState;
  const { user, loading: authLoading } = useAuth();
  const next = safeNext(params.get("next"));
  const [mode, setMode] = useState<Mode>(params.get("mode") === "signup" ? "signup" : "login");
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authLoading && user) navigate(next, { replace: true, state: forwardState });
  }, [authLoading, user, next, navigate, forwardState]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            data: { full_name: form.name.trim(), phone: form.phone.trim() },
          },
        });
        if (signUpError) throw signUpError;

        let userId = signUpData.user?.id;

        if (!signUpData.session) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: form.email.trim(),
            password: form.password,
          });
          if (signInError) throw signInError;
          userId = signInData.user?.id || userId;
        }

        if (userId) {
          await supabase.from("profiles").upsert({
            id: userId,
            full_name: form.name.trim(),
            phone: form.phone.trim(),
            email: form.email.trim(),
          });
        }

        toast({ title: "Welcome!", description: "Account created and logged in successfully!" });
        navigate(next, { replace: true, state: forwardState });
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });
        if (error) throw error;
        toast({ title: "Logged in successfully" });
        navigate(next, { replace: true, state: forwardState });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(form.email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast({ title: "Reset link sent", description: "Please check your email." });
        setMode("login");
      }
    } catch (err: any) {
      toast({ title: "Something went wrong", description: err?.message ?? "Please try again", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      <main className="container my-6 max-w-md">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h1 className="font-display text-2xl font-bold mb-1">
            {mode === "signup" ? "Create Account" : mode === "login" ? "Log In" : "Reset Password"}
          </h1>
          <p className="text-sm text-muted-foreground mb-5">
            {mode === "forgot"
              ? "Enter your email and we'll send you a reset link."
              : "Use your account to track order history and spending."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <>
                <div>
                  <Label className="text-xs">Full Name</Label>
                  <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Phone Number</Label>
                  <Input required inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </>
            )}

            <div>
              <Label className="text-xs">Email</Label>
              <Input type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>

            {mode !== "forgot" && (
              <div>
                <Label className="text-xs">Password</Label>
                <Input
                  type="password"
                  required
                  minLength={6}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "signup" ? (
                <><UserPlus className="h-4 w-4 mr-1" /> Create Account</>
              ) : mode === "login" ? (
                <><LogIn className="h-4 w-4 mr-1" /> Log In</>
              ) : "Send Reset Link"}
            </Button>
          </form>

          <div className="mt-4 space-y-2 text-sm text-center">
            {mode === "login" && (
              <>
                <button type="button" className="text-primary font-medium" onClick={() => setMode("forgot")}>
                  Forgot password?
                </button>
                <p className="text-muted-foreground">
                  No account yet?{" "}
                  <button type="button" className="text-primary font-medium" onClick={() => setMode("signup")}>
                    Sign Up
                  </button>
                </p>
              </>
            )}
            {mode !== "login" && (
              <p className="text-muted-foreground">
                Already have an account?{" "}
                <button type="button" className="text-primary font-medium" onClick={() => setMode("login")}>
                  Log In
                </button>
              </p>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          <Link to="/terms" className="underline">Terms</Link> and <Link to="/privacy" className="underline">Privacy Policy</Link> apply to all accounts.
        </p>
      </main>
      <BottomNav />
    </div>
  );
};

export default Auth;

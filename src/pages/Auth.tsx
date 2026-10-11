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

  const handleGoogleAuth = async () => {
    try {
      setBusy(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}${next}`,
          skipBrowserRedirect: true,
        },
      });
      if (error) throw error;

      if (data?.url) {
        // Validate if Google provider is enabled on Supabase backend
        try {
          const testRes = await fetch(data.url);
          if (!testRes.ok) {
            const errJson = await testRes.json().catch(() => null);
            if (errJson?.msg?.includes("not enabled") || errJson?.error_code === "validation_failed") {
              toast({
                title: "Google Provider Not Enabled",
                description: "Supabase ব্যাকএন্ডে Google Provider অন করা প্রয়োজন। বর্তমানে ইমেইল ও পাসওয়ার্ড দিয়ে একাউন্ট তৈরি বা লগইন করুন।",
                variant: "destructive",
              });
              setBusy(false);
              return;
            }
          }
        } catch {
          // In case of CORS or offline, fallback to direct redirect
        }

        window.location.href = data.url;
      }
    } catch (err: any) {
      toast({
        title: "Google authentication failed",
        description: err?.message ?? "Please try again or use email login",
        variant: "destructive",
      });
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

          {mode !== "forgot" && (
            <div className="mb-5">
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleAuth}
                disabled={busy}
                className="w-full flex items-center justify-center gap-2.5 h-10 border-border hover:bg-muted font-medium text-foreground transition-all active:scale-[0.98]"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{mode === "signup" ? "Sign up with Google" : "Continue with Google"}</span>
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground font-semibold">Or with email</span>
                </div>
              </div>
            </div>
          )}

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

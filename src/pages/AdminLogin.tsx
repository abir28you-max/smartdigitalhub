import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
    const isAdmin = roles?.some((r) => r.role === "admin");
    if (!isAdmin) {
      await supabase.auth.signOut();
      toast({ title: "Access denied", description: "You are not an admin.", variant: "destructive" });
      setLoading(false);
      return;
    }
    navigate("/admin");
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Account created!", description: "Now ask the system admin to grant you admin access, then login." });
      setIsSignup(false);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 md:p-8 shadow-xl">
        <div className="flex flex-col items-center mb-6">
          <Link to="/" className="mb-3 hover:opacity-90 transition-opacity">
            <img src={logo} alt="Smart Digital Hub" className="h-16 w-auto object-contain rounded-lg" />
          </Link>
          <h1 className="font-display text-xl font-bold text-center">
            {isSignup ? "Create Admin Account" : "Admin Portal Login"}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Smart Digital Hub Management</p>
        </div>
        <form onSubmit={isSignup ? handleSignup : handleLogin} className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Please wait..." : isSignup ? "Sign Up" : "Login"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-4">
          {isSignup ? (
            <>Already have an account? <button onClick={() => setIsSignup(false)} className="text-primary font-medium">Login</button></>
          ) : (
            <>Don't have an account? <button onClick={() => setIsSignup(true)} className="text-primary font-medium">Sign Up</button></>
          )}
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;

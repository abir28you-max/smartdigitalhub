import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Copy, Check, Eye, EyeOff, ShoppingBag, Trash2, Plus, Lock } from "lucide-react";
import { toast } from "@/hooks/use-toast";

function base32Decode(input: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = input.replace(/[\s=-]/g, "").toUpperCase();
  let bits = "";
  for (const c of cleaned) {
    const val = alphabet.indexOf(c);
    if (val === -1) throw new Error("Invalid base32");
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
  return bytes;
}

async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const ck = await crypto.subtle.importKey("raw", key.buffer as ArrayBuffer, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", ck, message.buffer as ArrayBuffer));
}

async function generateTOTP(secret: string, period = 30, digits = 6): Promise<string> {
  const key = base32Decode(secret);
  const counter = Math.floor(Date.now() / 1000 / period);
  const buf = new ArrayBuffer(8);
  new DataView(buf).setUint32(4, counter, false);
  const hmac = await hmacSha1(key, new Uint8Array(buf));
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = (((hmac[offset] & 0x7f) << 24) | ((hmac[offset + 1] & 0xff) << 16) | ((hmac[offset + 2] & 0xff) << 8) | (hmac[offset + 3] & 0xff)) % 10 ** digits;
  return code.toString().padStart(digits, "0");
}

interface SavedKey { label: string; secret: string; }
interface Product { id: string; name: string; image_url: string | null; slug: string | null; price: number; }

const STORAGE_KEY = "2fa_saved_keys";
const getSavedKeys = (): SavedKey[] => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; } };
const setSavedKeys = (keys: SavedKey[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));

const ProductPopup = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [current, setCurrent] = useState<Product | null>(null);
  const [visible, setVisible] = useState(false);
  const idxRef = useRef(0);

  useEffect(() => {
    supabase.from("products").select("id, name, image_url, slug, price").eq("stock_status", "in_stock").limit(20)
      .then(({ data }) => { if (data?.length) setProducts(data); });
  }, []);

  useEffect(() => {
    if (!products.length) return;
    const show = () => {
      setCurrent(products[idxRef.current % products.length]);
      setVisible(true);
      idxRef.current++;
      setTimeout(() => setVisible(false), 4000);
    };
    const t = setTimeout(show, 3000);
    const interval = setInterval(show, 8000);
    return () => { clearTimeout(t); clearInterval(interval); };
  }, [products]);

  if (!current) return null;
  return (
    <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 pointer-events-none"}`}>
      <Link to={`/product/${current.slug || current.id}`} className="flex items-center gap-3 bg-card border border-border rounded-2xl shadow-2xl px-4 py-3 min-w-[280px] max-w-[360px] hover:scale-[1.02] transition-transform">
        {current.image_url ? <img src={current.image_url} alt={current.name} className="h-12 w-12 rounded-xl object-cover shrink-0" /> : <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center shrink-0"><ShoppingBag className="h-5 w-5 text-muted-foreground" /></div>}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">{current.name}</p>
          <p className="text-xs text-primary font-bold">৳{current.price}</p>
        </div>
        <span className="text-xs text-muted-foreground shrink-0">View →</span>
      </Link>
    </div>
  );
};

const TwoFA = () => {
  const [secret, setSecret] = useState("");
  const [label, setLabel] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [active, setActive] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [savedKeys, setSavedKeysState] = useState<SavedKey[]>(getSavedKeys);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [activeLabel, setActiveLabel] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const generate = useCallback(async (s: string) => {
    try { setCode(await generateTOTP(s)); setError(""); }
    catch { setCode(null); setError("Invalid secret key"); setActive(false); }
  }, []);

  const start = (s?: string, lbl?: string) => {
    const key = (s || secret).replace(/\s/g, "");
    if (!key) return;
    setSecret(s || secret);
    setActive(true);
    setActiveLabel(lbl || label || "");
    generate(key);
  };

  useEffect(() => {
    if (!active) return;
    const tick = () => {
      const rem = 30 - (Math.floor(Date.now() / 1000) % 30);
      setTimeLeft(rem);
      if (rem === 30) generate(secret.replace(/\s/g, ""));
    };
    tick();
    intervalRef.current = setInterval(tick, 500);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [active, secret, generate]);

  const copyCode = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast({ title: "Copied!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const saveKey = () => {
    const trimLabel = label.trim() || "Key " + (savedKeys.length + 1);
    const trimSecret = secret.replace(/\s/g, "");
    if (!trimSecret) return;
    if (savedKeys.some(k => k.secret === trimSecret)) { toast({ title: "Already saved", variant: "destructive" }); return; }
    const updated = [...savedKeys, { label: trimLabel, secret: trimSecret }];
    setSavedKeysState(updated);
    setSavedKeys(updated);
    setShowSaveForm(false);
    setLabel("");
    toast({ title: "Key saved!" });
  };

  const deleteKey = (idx: number) => {
    const updated = savedKeys.filter((_, i) => i !== idx);
    setSavedKeysState(updated);
    setSavedKeys(updated);
    toast({ title: "Key removed" });
  };

  const progress = (timeLeft / 30) * 100;
  const urgency = timeLeft <= 5;
  const circumference = 2 * Math.PI * 54;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex flex-col items-center px-4 py-8">
      {/* Header */}
      <div className="w-full max-w-md mb-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
          <ShieldCheck className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Authenticator</h1>
        <p className="text-muted-foreground text-sm mt-1">Secure TOTP code generator</p>
      </div>

      {/* Code Display */}
      {code && active && (
        <div className="w-full max-w-md mb-6 animate-fade-in">
          <div className="relative bg-card border border-border rounded-3xl p-6 shadow-lg overflow-hidden">
            {/* Subtle gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/60 to-primary/20" />

            {activeLabel && (
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4 text-center">{activeLabel}</p>
            )}

            <div className="flex items-center justify-center gap-6">
              {/* Timer ring */}
              <div className="relative w-20 h-20 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" strokeWidth="5" className="stroke-muted/50" />
                  <circle cx="60" cy="60" r="54" fill="none" strokeWidth="5"
                    className={`transition-all duration-500 ease-linear ${urgency ? "stroke-destructive" : "stroke-primary"}`}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - progress / 100)}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-lg font-bold tabular-nums ${urgency ? "text-destructive" : "text-foreground"}`}>{timeLeft}</span>
                  <span className="text-[8px] text-muted-foreground uppercase tracking-widest">sec</span>
                </div>
              </div>

              {/* Code */}
              <button onClick={copyCode} className="flex-1 group text-left active:scale-[0.97] transition-transform">
                <div className={`text-4xl font-mono font-extrabold tracking-[0.3em] transition-colors ${urgency ? "text-destructive" : "text-foreground"}`}>
                  {code.slice(0, 3)}
                  <span className="text-muted-foreground/30 mx-1">·</span>
                  {code.slice(3)}
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-muted-foreground group-hover:text-foreground transition-colors">
                  {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="text-xs">{copied ? "Copied!" : "Tap to copy"}</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input Card */}
      <div className="w-full max-w-md mb-5">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-muted-foreground" />
              Secret Key
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showKey ? "text" : "password"}
                  placeholder="Enter or paste key..."
                  value={secret}
                  onChange={(e) => { setSecret(e.target.value); setActive(false); setCode(null); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && start()}
                  className="font-mono text-sm pr-10"
                />
                <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Button onClick={() => start()} disabled={!secret.trim()} className="px-5 font-semibold">
                Generate
              </Button>
            </div>
            {error && <p className="text-destructive text-xs">{error}</p>}
          </div>

          {/* Save key option */}
          {secret.trim() && !showSaveForm && (
            <button onClick={() => setShowSaveForm(true)} className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors font-medium">
              <Plus className="w-3.5 h-3.5" /> Save this key for quick access
            </button>
          )}

          {showSaveForm && (
            <div className="flex gap-2 animate-fade-in">
              <Input placeholder="Label (e.g. GitHub)" value={label} onChange={(e) => setLabel(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveKey()} className="text-sm" />
              <Button onClick={saveKey} size="sm" variant="secondary" className="shrink-0">Save</Button>
              <Button onClick={() => setShowSaveForm(false)} size="sm" variant="ghost" className="shrink-0 px-2">✕</Button>
            </div>
          )}
        </div>
      </div>

      {/* Saved Keys */}
      {savedKeys.length > 0 && (
        <div className="w-full max-w-md mb-6">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 px-1">Saved Keys</h2>
          <div className="space-y-2">
            {savedKeys.map((k, i) => (
              <div key={i} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between group hover:border-primary/30 transition-colors">
                <button onClick={() => start(k.secret, k.label)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{k.label}</p>
                    <p className="text-xs text-muted-foreground font-mono">••••••{k.secret.slice(-4)}</p>
                  </div>
                </button>
                <button onClick={() => deleteKey(i)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1.5">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="w-full max-w-md">
        <div className="bg-muted/30 rounded-xl p-4 space-y-2">
          <h3 className="text-xs font-semibold text-foreground">How it works</h3>
          <ul className="text-xs text-muted-foreground space-y-1.5">
            <li className="flex items-start gap-2"><span className="text-primary font-bold mt-px">1.</span> Enter or paste your TOTP secret key</li>
            <li className="flex items-start gap-2"><span className="text-primary font-bold mt-px">2.</span> A 6-digit code generates every 30 seconds</li>
            <li className="flex items-start gap-2"><span className="text-primary font-bold mt-px">3.</span> Tap the code to copy it to clipboard</li>
            <li className="flex items-start gap-2"><span className="text-primary font-bold mt-px">4.</span> Keys are stored locally, never sent to any server</li>
          </ul>
        </div>
      </div>

      <p className="text-muted-foreground/50 text-[10px] mt-6">Powered by Smart Digital Hub</p>

      <ProductPopup />
    </div>
  );
};

export default TwoFA;

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Sparkles, Loader2, Search, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { generateLocalSeo } from "@/lib/seoGenerator";

interface OptionItem {
  name: string;
  price: number;
  in_stock?: boolean;
  warranty?: "full" | "none" | "hide";
}

interface ProductCoupon {
  id?: string;
  code: string;
  discount_amount: number;
  discount_type?: "percentage" | "fixed";
  option_name: string | null;
  is_active: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: string | null;
  stock_status: string;
  options: any;
  seo_title?: string | null;
  meta_description?: string | null;
  focus_keywords?: string | null;
  long_description?: string | null;
  short_description?: string | null;
  delivery_time?: string | null;
  brand?: string | null;
  slug?: string | null;
  coupon_code?: string | null;
  coupon_discount?: number | null;
  coupon_option?: string | null;
}

interface Category {
  id: string;
  name: string;
}

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: "", description: "", price: "", category_id: "", stock_status: "in_stock",
    image_url: "", coupon_code: "", coupon_discount: "", coupon_option: "",
    seo_title: "", meta_description: "", focus_keywords: "", long_description: "",
    short_description: "", delivery_time: "", brand: "Smart Digital Hub", slug: "",
  });
  const [optionsList, setOptionsList] = useState<OptionItem[]>([]);
  const [couponList, setCouponList] = useState<ProductCoupon[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [seoLoading, setSeoLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const productSuggestions = searchQuery.trim().length >= 1
    ? filteredProducts.slice(0, 8)
    : [];

  const fetchData = async () => {
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*"),
    ]);
    if (prods) setProducts(prods as Product[]);
    if (cats) setCategories(cats);
  };

  useEffect(() => { fetchData(); }, []);

  const parseOptions = (options: any): OptionItem[] => {
    if (!Array.isArray(options) || options.length === 0) return [];
    if (typeof options[0] === "string") return (options as string[]).map((name) => ({ name, price: 0 }));
    return options as OptionItem[];
  };

  const getCategoryName = (catId: string | null) => {
    if (!catId) return "";
    return categories.find(c => c.id === catId)?.name || "";
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "", description: "", price: "", category_id: "", stock_status: "in_stock",
      image_url: "", coupon_code: "", coupon_discount: "", coupon_option: "",
      seo_title: "", meta_description: "", focus_keywords: "", long_description: "",
      short_description: "", delivery_time: "", brand: "Smart Digital Hub", slug: "",
    });
    setOptionsList([]);
    setCouponList([]);
    setImageFile(null);
    setOpen(true);
  };

  const openEdit = async (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name, description: p.description || "", price: String(p.price),
      category_id: p.category_id || "", stock_status: p.stock_status,
      image_url: p.image_url || "", coupon_code: p.coupon_code || "",
      coupon_discount: String(p.coupon_discount || ""), coupon_option: p.coupon_option || "",
      seo_title: p.seo_title || "", meta_description: p.meta_description || "",
      focus_keywords: p.focus_keywords || "", long_description: p.long_description || "",
      short_description: p.short_description || "", delivery_time: p.delivery_time || "",
      brand: p.brand || "Smart Digital Hub", slug: p.slug || "",
    });
    setOptionsList(parseOptions(p.options));
    setCouponList([]);
    setImageFile(null);
    setOpen(true);
    const { data: pc } = await supabase
      .from("product_coupons")
      .select("id, code, discount_amount, option_name, is_active")
      .eq("product_id", p.id)
      .order("created_at", { ascending: true });
    if (pc && pc.length > 0) {
      setCouponList(pc.map((c: any) => {
        let opt = c.option_name;
        let isFixed = false;
        if (opt && opt.includes(":::fixed")) { isFixed = true; opt = opt.replace(":::fixed", "").trim(); }
        else if (opt === "__fixed__") { isFixed = true; opt = null; }
        else if (opt && opt.includes(":::percent")) { isFixed = false; opt = opt.replace(":::percent", "").trim(); }
        else if (opt === "__percent__") { isFixed = false; opt = null; }
        else if (Number(c.discount_amount) > 100) { isFixed = true; }
        return {
          id: c.id,
          code: c.code,
          discount_amount: Number(c.discount_amount),
          discount_type: isFixed ? "fixed" : "percentage",
          option_name: opt || null,
          is_active: c.is_active !== false,
        };
      }));
    } else if (p.coupon_code) {
      setCouponList([{
        code: p.coupon_code,
        discount_amount: Number(p.coupon_discount) || 0,
        discount_type: Number(p.coupon_discount) > 100 ? "fixed" : "percentage",
        option_name: p.coupon_option || null,
        is_active: true,
      }]);
    }
  };

  const addCoupon = () => setCouponList([...couponList, { code: "", discount_amount: 0, discount_type: "percentage", option_name: null, is_active: true }]);
  const removeCoupon = (idx: number) => setCouponList(couponList.filter((_, i) => i !== idx));
  const updateCoupon = (idx: number, field: keyof ProductCoupon, value: any) => {
    setCouponList(couponList.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));
  };

  const saveCoupons = async (productId: string) => {
    const valid = couponList
      .filter((c) => c.code.trim())
      .map((c) => {
        let optStr = c.option_name ? c.option_name.trim() : "";
        if (c.discount_type === "fixed") {
          optStr = optStr ? `${optStr}:::fixed` : "__fixed__";
        } else {
          optStr = optStr ? `${optStr}:::percent` : "__percent__";
        }
        return {
          product_id: productId,
          code: c.code.trim().toUpperCase(),
          discount_amount: Number(c.discount_amount) || 0,
          option_name: optStr,
          is_active: c.is_active !== false,
        };
      });
    await supabase.from("product_coupons").delete().eq("product_id", productId);
    if (valid.length > 0) {
      await supabase.from("product_coupons").insert(valid);
    }
  };

  const addOption = () => setOptionsList([...optionsList, { name: "", price: 0, in_stock: true, warranty: "hide" }]);
  const removeOption = (idx: number) => setOptionsList(optionsList.filter((_, i) => i !== idx));
  const updateOption = (idx: number, field: keyof OptionItem, value: string) => {
    setOptionsList(optionsList.map((o, i) => i === idx ? { ...o, [field]: field === "price" ? parseFloat(value) || 0 : value } : o));
  };
  const toggleOptionStock = (idx: number) => {
    setOptionsList(optionsList.map((o, i) => i === idx ? { ...o, in_stock: o.in_stock === false } : o));
  };
  const toggleOptionWarranty = (idx: number) => {
    setOptionsList(optionsList.map((o, i) => {
      if (i !== idx) return o;
      const next = o.warranty === "full" ? "none" : o.warranty === "none" ? "hide" : "full";
      return { ...o, warranty: next as OptionItem["warranty"] };
    }));
  };

  const generateSeo = async () => {
    if (!form.name.trim()) {
      toast({ title: "Product name is required to generate SEO", variant: "destructive" });
      return;
    }
    setSeoLoading(true);
    let seoResult: any = null;
    try {
      const { data, error } = await supabase.functions.invoke("generate-seo", {
        body: {
          product_name: form.name,
          category: getCategoryName(form.category_id),
          brand: form.brand || "Smart Digital Hub",
          options: optionsList,
          delivery_time: form.delivery_time,
          price: form.price,
        },
      });
      if (!error && data && !data.error) {
        seoResult = data;
      }
    } catch {
      // Fallback
    }

    if (!seoResult || !seoResult.seo_title) {
      seoResult = generateLocalSeo({
        product_name: form.name,
        category: getCategoryName(form.category_id),
        brand: form.brand || "Smart Digital Hub",
        options: optionsList,
        delivery_time: form.delivery_time,
        price: form.price,
      });
    }

    setForm(prev => ({
      ...prev,
      description: prev.description || seoResult.short_description || `100% genuine ${form.name.trim()} subscription with instant delivery and full warranty support.`,
      short_description: seoResult.short_description || prev.short_description,
      seo_title: seoResult.seo_title || prev.seo_title,
      meta_description: seoResult.meta_description || prev.meta_description,
      focus_keywords: seoResult.focus_keywords || prev.focus_keywords,
      long_description: seoResult.long_description || prev.long_description,
      slug: generateSlug(seoResult.slug || prev.slug || prev.name),
      delivery_time: prev.delivery_time || "Instant (2-30 min)",
    }));
    toast({ title: `✨ AI has generated Description & SEO for "${form.name.trim()}"!` });
    setSeoLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let imageUrl = form.image_url;
    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("product-images").upload(path, imageFile);
      if (upErr) { toast({ title: "Upload failed", description: upErr.message, variant: "destructive" }); setLoading(false); return; }
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
      imageUrl = urlData.publicUrl;
    }

    const validOptions = optionsList.filter((o) => o.name.trim());

    // Auto-generate SEO if fields are empty
    let seoData = {
      seo_title: form.seo_title || null,
      meta_description: form.meta_description || null,
      focus_keywords: form.focus_keywords || null,
      long_description: form.long_description || null,
      slug: form.slug || generateSlug(form.name) || null,
      short_description: form.short_description || null,
    };

    if (!seoData.seo_title && !seoData.meta_description && form.name.trim()) {
      let data: any = null;
      try {
        const res = await supabase.functions.invoke("generate-seo", {
          body: {
            product_name: form.name,
            category: getCategoryName(form.category_id),
            brand: form.brand || "Smart Digital Hub",
            options: validOptions,
            delivery_time: form.delivery_time,
            price: form.price,
          },
        });
        if (!res.error && res.data && !res.data.error) {
          data = res.data;
        }
      } catch { /* proceed with local fallback */ }

      if (!data || !data.seo_title) {
        data = generateLocalSeo({
          product_name: form.name,
          category: getCategoryName(form.category_id),
          brand: form.brand || "Smart Digital Hub",
          options: validOptions,
          delivery_time: form.delivery_time,
          price: form.price,
        });
      }

      if (data) {
        seoData = {
          seo_title: data.seo_title || null,
          meta_description: data.meta_description || null,
          focus_keywords: data.focus_keywords || null,
          long_description: data.long_description || null,
          slug: generateSlug(data.slug || form.name) || null,
          short_description: data.short_description || null,
        };
      }
    }

    const payload: any = {
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price) || 0,
      category_id: form.category_id || null,
      stock_status: form.stock_status,
      options: validOptions.length > 0 ? validOptions.map(o => ({ name: o.name, price: o.price, in_stock: o.in_stock !== false, warranty: o.warranty === "full" ? "full" : o.warranty === "none" ? "none" : "hide" })) : [],
      image_url: imageUrl || null,
      coupon_code: couponList.find((c) => c.code.trim())?.code.trim().toUpperCase() || null,
      coupon_discount: Number(couponList.find((c) => c.code.trim())?.discount_amount) || 0,
      coupon_option: couponList.find((c) => c.code.trim())?.option_name || null,
      brand: form.brand || "Smart Digital Hub",
      delivery_time: form.delivery_time || null,
      ...seoData,
    };

    let error;
    let savedId = editing?.id;
    if (editing) {
      ({ error } = await supabase.from("products").update(payload).eq("id", editing.id));
    } else {
      const res = await supabase.from("products").insert(payload).select("id").single();
      error = res.error;
      savedId = res.data?.id;
    }

    if (!error && savedId) await saveCoupons(savedId);

    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: editing ? "Product updated" : "Product created" }); setOpen(false); fetchData(); }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await supabase.from("products").delete().eq("id", id);
    fetchData();
  };

  const handleBulkSeo = async () => {
    const needsSeo = products.filter(p => !p.seo_title && !p.meta_description);
    if (needsSeo.length === 0) {
      toast({ title: "All products already have SEO content! ✅" });
      return;
    }
    if (!confirm(`Generate SEO for ${needsSeo.length} products without SEO data?`)) return;

    setBulkLoading(true);
    let success = 0;
    let failed = 0;

    for (const p of needsSeo) {
      try {
        let data: any = null;
        try {
          const res = await supabase.functions.invoke("generate-seo", {
            body: {
              product_name: p.name,
              category: getCategoryName(p.category_id),
              brand: p.brand || "Smart Digital Hub",
              options: parseOptions(p.options),
              delivery_time: p.delivery_time,
              price: String(p.price),
            },
          });
          if (!res.error && res.data && !res.data.error) {
            data = res.data;
          }
        } catch {}

        if (!data || !data.seo_title) {
          data = generateLocalSeo({
            product_name: p.name,
            category: getCategoryName(p.category_id),
            brand: p.brand || "Smart Digital Hub",
            options: parseOptions(p.options),
            delivery_time: p.delivery_time,
            price: String(p.price),
          });
        }

        if (data && data.seo_title) {
          await supabase.from("products").update({
            seo_title: data.seo_title,
            meta_description: data.meta_description,
            focus_keywords: data.focus_keywords,
            long_description: data.long_description,
            short_description: data.short_description,
            slug: data.slug || generateSlug(p.name),
          } as any).eq("id", p.id);
          success++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
      // Small delay
      await new Promise(r => setTimeout(r, 400));
    }

    toast({ title: `Bulk SEO done! ✨ ${success} generated, ${failed} failed.` });
    setBulkLoading(false);
    fetchData();
  };

  const hasSeo = (p: Product) => !!(p.seo_title || p.meta_description);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="font-display text-xl font-bold">Products</h1>
        <div className="flex-1 min-w-0 max-w-md mx-4 relative hidden sm:block">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products (type 1-2 letters)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(e.target.value.trim().length >= 1);
              }}
              onFocus={() => setShowSuggestions(searchQuery.trim().length >= 1)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              className="pl-9 pr-8"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(""); setShowSuggestions(false); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {showSuggestions && productSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 max-h-64 overflow-auto">
              {productSuggestions.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-accent flex items-center gap-2 text-sm"
                  onMouseDown={() => { setSearchQuery(p.name); setShowSuggestions(false); openEdit(p); }}
                >
                  {p.image_url ? <img src={p.image_url} alt="" className="w-6 h-6 rounded object-contain bg-muted flex-shrink-0" /> : <div className="w-6 h-6 bg-muted rounded flex-shrink-0" />}
                  <span className="truncate">{p.name}</span>
                  <span className="text-muted-foreground ml-auto flex-shrink-0">৳{p.price}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            onClick={handleBulkSeo}
            size="sm"
            variant="outline"
            disabled={bulkLoading}
            className="h-10 px-4 rounded-xl border border-border bg-background hover:bg-muted/80 text-foreground font-semibold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
          >
            {bulkLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <Sparkles className="h-4 w-4 text-foreground stroke-[2.2]" />
            )}
            <span className="text-sm font-medium tracking-tight">
              {bulkLoading ? "Generating..." : "Generate SEO for All"}
            </span>
          </Button>
          <Button onClick={openCreate} size="sm" className="h-10 px-4 rounded-xl shadow-xs"><Plus className="h-4 w-4 mr-1" /> Add Product</Button>
        </div>
      </div>

      {/* Mobile search */}
      <div className="sm:hidden mb-4 relative">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(e.target.value.trim().length >= 1);
            }}
            onFocus={() => setShowSuggestions(searchQuery.trim().length >= 1)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            className="pl-9 pr-8"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(""); setShowSuggestions(false); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {showSuggestions && productSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 max-h-64 overflow-auto">
            {productSuggestions.map((p) => (
              <button
                key={p.id}
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-accent flex items-center gap-2 text-sm"
                onMouseDown={() => { setSearchQuery(p.name); setShowSuggestions(false); openEdit(p); }}
              >
                {p.image_url ? <img src={p.image_url} alt="" className="w-6 h-6 rounded object-contain bg-muted flex-shrink-0" /> : <div className="w-6 h-6 bg-muted rounded flex-shrink-0" />}
                <span className="truncate">{p.name}</span>
                <span className="text-muted-foreground ml-auto flex-shrink-0">৳{p.price}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3">Image</th>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Price</th>
                <th className="text-left p-3">SEO</th>
                <th className="text-left p-3">Status</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-3">
                    {p.image_url ? <img src={p.image_url} alt="" className="w-10 h-10 rounded object-contain bg-muted" /> : <div className="w-10 h-10 bg-muted rounded" />}
                  </td>
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3">৳{p.price}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${hasSeo(p) ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {hasSeo(p) ? '✅ Done' : '⚠️ Missing'}
                    </span>
                  </td>
                  <td className="p-3">{p.stock_status}</td>
                  <td className="p-3 text-right space-x-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-3 w-3" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(p.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">
                  {searchQuery.trim() ? "No products match your search." : "No products yet."}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filteredProducts.map((p) => (
          <div key={p.id} className="bg-card rounded-lg border border-border p-3">
            <div className="flex items-center gap-3">
              {p.image_url ? <img src={p.image_url} alt="" className="w-14 h-14 rounded-lg object-contain bg-muted flex-shrink-0" /> : <div className="w-14 h-14 bg-muted rounded-lg flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate">{p.name}</h3>
                <p className="text-primary font-bold text-sm mt-0.5">৳{p.price}</p>
                <div className="flex gap-1 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.stock_status === 'in_stock' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {p.stock_status === 'in_stock' ? 'In Stock' : 'Out of Stock'}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${hasSeo(p) ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {hasSeo(p) ? 'SEO ✅' : 'SEO ⚠️'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDelete(p.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
              </div>
            </div>
          </div>
        ))}
        {filteredProducts.length === 0 && <p className="text-center text-muted-foreground py-8">
          {searchQuery.trim() ? "No products match your search." : "No products yet."}
        </p>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Tabs defaultValue="basic">
              <TabsList className="w-full">
                <TabsTrigger value="basic" className="flex-1">Basic Info</TabsTrigger>
                <TabsTrigger value="seo" className="flex-1">SEO & AI</TabsTrigger>
                <TabsTrigger value="coupon" className="flex-1">Coupon</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-3 mt-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label className="font-semibold">Product Name</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateSeo}
                      disabled={seoLoading || !form.name.trim()}
                      className="h-7 text-xs bg-primary/10 text-primary border-primary/30 hover:bg-primary hover:text-white"
                    >
                      {seoLoading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
                      {seoLoading ? "Generating..." : "✨ AI Auto-Fill All Details"}
                    </Button>
                  </div>
                  <Input 
                    required 
                    value={form.name} 
                    onChange={(e) => setForm({ ...form, name: e.target.value })} 
                    placeholder="e.g. Duolingo Super, Netflix Premium, ChatGPT Plus" 
                  />
                </div>
                <div>
                  <Label>Short Description</Label>
                  <Input value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} placeholder="One-line product summary" />
                </div>
                <div>
                  <Label>Description / Summary</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Product overview..." rows={3} />
                </div>
                <div><Label>Base Price (BDT)</Label><Input type="number" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Category</Label>
                    <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Stock Status</Label>
                    <Select value={form.stock_status} onValueChange={(v) => setForm({ ...form, stock_status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in_stock">In Stock</SelectItem>
                        <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Brand</Label><Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></div>
                  <div><Label>Delivery Time</Label><Input value={form.delivery_time} onChange={(e) => setForm({ ...form, delivery_time: e.target.value })} placeholder="e.g. Instant (2-30 min)" /></div>
                </div>

                {/* Options */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Options (Duration, Price, Stock & Warranty)</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addOption}><Plus className="h-3 w-3 mr-1" /> Add Option</Button>
                  </div>
                  {optionsList.length === 0 && <p className="text-xs text-muted-foreground">No options added. Base price will be used.</p>}
                  <div className="space-y-2">
                    {optionsList.map((opt, idx) => (
                      <div key={idx} className="flex flex-wrap items-center gap-2">
                        <Input placeholder="e.g. 1 Month" value={opt.name} onChange={(e) => updateOption(idx, "name", e.target.value)} className="flex-1" />
                        <Input type="number" step="0.01" placeholder="Price" value={opt.price || ""} onChange={(e) => updateOption(idx, "price", e.target.value)} className="w-24" />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => toggleOptionStock(idx)}
                          className={`h-8 px-2 text-[11px] flex-shrink-0 ${opt.in_stock === false ? "border-destructive text-destructive" : "border-green-500 text-green-600"}`}
                        >
                          {opt.in_stock === false ? "Stock Out" : "In Stock"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => toggleOptionWarranty(idx)}
                          className={`h-8 px-2 text-[11px] flex-shrink-0 ${opt.warranty === "none" ? "border-amber-500 text-amber-600" : opt.warranty === "full" ? "border-primary text-primary" : "border-border text-muted-foreground"}`}
                        >
                          {opt.warranty === "none" ? "Non Warranty" : opt.warranty === "full" ? "Full Warranty" : "No Warranty Label"}
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => removeOption(idx)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div><Label>Image</Label><Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} /></div>
                {form.image_url && !imageFile && <img src={form.image_url} alt="" className="w-20 h-20 object-contain rounded bg-muted" />}
              </TabsContent>

              <TabsContent value="seo" className="space-y-3 mt-3">
                <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-transparent border border-primary/20 rounded-2xl p-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                          AI SEO Content Generator
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          প্রোডাক্ট ইনফো অনুযায়ী স্বয়ংক্রিয়ভাবে টাইটেল, মেটা ডেসক্রিপশন ও কি-ওয়ার্ড তৈরি করুন
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={generateSeo}
                      disabled={seoLoading}
                      className="h-10 px-4 rounded-xl border border-border bg-background hover:bg-muted text-foreground font-semibold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 flex-shrink-0"
                    >
                      {seoLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      ) : (
                        <Sparkles className="h-4 w-4 text-foreground stroke-[2.2]" />
                      )}
                      <span className="text-sm font-medium tracking-tight">
                        {seoLoading ? "Generating..." : "Generate SEO Content"}
                      </span>
                    </Button>
                  </div>
                </div>
                <div><Label>SEO Title</Label><Input value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} placeholder="SEO-optimized title (max 60 chars)" /><p className="text-xs text-muted-foreground mt-0.5">{form.seo_title.length}/60 characters</p></div>
                <div><Label>Meta Description</Label><Textarea value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} placeholder="Compelling meta description (max 160 chars)" rows={2} /><p className="text-xs text-muted-foreground mt-0.5">{form.meta_description.length}/160 characters</p></div>
                <div><Label>Focus Keywords</Label><Input value={form.focus_keywords} onChange={(e) => setForm({ ...form, focus_keywords: e.target.value })} placeholder="keyword1, keyword2, keyword3..." /></div>
                <div>
                  <Label>URL Slug</Label>
                  <div className="flex gap-2">
                    <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: generateSlug(e.target.value) })} placeholder="product-url-slug" className="flex-1" />
                    <Button type="button" variant="outline" size="sm" onClick={() => setForm(prev => ({ ...prev, slug: generateSlug(prev.name) }))}>Regenerate</Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">/product/{form.slug || generateSlug(form.name) || "..."}</p>
                </div>
                <div>
                  <Label>Long Description</Label>
                  <p className="text-xs text-muted-foreground mb-1.5">AI writes this automatically — edit the text directly here, exactly as customers will see it.</p>
                  <RichTextEditor
                    value={form.long_description}
                    onChange={(html) => setForm((prev) => ({ ...prev, long_description: html }))}
                    placeholder="Full product description..."
                  />
                </div>
              </TabsContent>

              <TabsContent value="coupon" className="space-y-3 mt-3">
                <div className="flex items-center justify-between">
                  <Label>Product Coupons (একাধিক কুপন যোগ করা যাবে)</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addCoupon}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Coupon
                  </Button>
                </div>

                {couponList.length === 0 && (
                  <p className="text-xs text-muted-foreground">এখনো কোনো কুপন নেই। "Add Coupon" চাপুন।</p>
                )}

                {couponList.map((c, idx) => (
                  <div key={idx} className="border border-border rounded-lg p-3 space-y-2.5 bg-secondary/15">
                    <div className="flex items-center justify-between pb-2 border-b border-border/50">
                      <div className="flex items-center gap-1.5 bg-background p-0.5 rounded-lg border border-border">
                        <Button
                          type="button"
                          size="sm"
                          variant={c.discount_type === "percentage" ? "default" : "ghost"}
                          className={`h-7 text-xs px-2.5 font-medium ${c.discount_type === "percentage" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"}`}
                          onClick={() => updateCoupon(idx, "discount_type", "percentage")}
                        >
                          % পার্সেন্টেজ
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={c.discount_type === "fixed" ? "default" : "ghost"}
                          className={`h-7 text-xs px-2.5 font-medium ${c.discount_type === "fixed" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"}`}
                          onClick={() => updateCoupon(idx, "discount_type", "fixed")}
                        >
                          ৳ নির্দিষ্ট টাকা
                        </Button>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant={c.is_active ? "secondary" : "outline"}
                          className="h-7 text-xs px-2"
                          onClick={() => updateCoupon(idx, "is_active", !c.is_active)}
                        >
                          {c.is_active ? "Active" : "Inactive"}
                        </Button>
                        <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => removeCoupon(idx)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label className="text-[11px] text-muted-foreground mb-1 block">কুপন কোড (Coupon Code)</Label>
                        <Input
                          placeholder="e.g. SUPER10"
                          value={c.code}
                          onChange={(e) => updateCoupon(idx, "code", e.target.value.toUpperCase())}
                        />
                      </div>
                      <div className="w-36">
                        <Label className="text-[11px] text-muted-foreground mb-1 block">
                          {c.discount_type === "percentage" ? "ছাড় (%)" : "ছাড় (৳ টাকা)"}
                        </Label>
                        <Input
                          type="number"
                          step={c.discount_type === "percentage" ? "0.1" : "1"}
                          min="1"
                          max={c.discount_type === "percentage" ? "100" : "100000"}
                          placeholder={c.discount_type === "percentage" ? "যেমন: 10" : "যেমন: 50"}
                          value={c.discount_amount || ""}
                          onChange={(e) => updateCoupon(idx, "discount_amount", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    {optionsList.filter(o => o.name.trim()).length > 1 && (
                      <div>
                        <Label className="text-xs">কোন প্যাকেজে কুপন কাজ করবে?</Label>
                        <Select
                          value={c.option_name || "__all__"}
                          onValueChange={(v) => updateCoupon(idx, "option_name", v === "__all__" ? null : v)}
                        >
                          <SelectTrigger className="mt-1"><SelectValue placeholder="সব প্যাকেজে প্রযোজ্য" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__all__">সব প্যাকেজে প্রযোজ্য</SelectItem>
                            {optionsList.filter(o => o.name.trim()).map((opt, i) => (
                              <SelectItem key={i} value={opt.name}>{opt.name}{opt.price > 0 ? ` - ৳${opt.price}` : ""}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">কুপনগুলো শুধু এই নির্দিষ্ট প্রোডাক্টেই কাজ করবে।</p>
              </TabsContent>
            </Tabs>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProducts;

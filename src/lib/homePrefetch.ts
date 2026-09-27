// Kick off the home page's data requests the moment the entry script runs, in
// parallel with React booting. Uses raw fetch so it does not have to wait for
// the Supabase client chunk to download and evaluate.
const URL_BASE = import.meta.env.VITE_SUPABASE_URL as string;
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const rest = async <T>(path: string): Promise<T[]> => {
  const res = await fetch(`${URL_BASE}/rest/v1/${path}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return (await res.json()) as T[];
};

export interface HomeShell {
  categories: any[];
  banners: any[];
}
export interface HomeRest {
  products: any[];
  hotDeals: any[];
}

let shellPromise: Promise<HomeShell> | null = null;
let restPromise: Promise<HomeRest> | null = null;

export const fetchHomeShell = (): Promise<HomeShell> => {
  if (!shellPromise) {
    shellPromise = Promise.all([
      rest<any>("categories?select=*&order=sort_order.asc"),
      rest<any>("banners?select=*&is_active=eq.true&order=sort_order.asc"),
    ])
      .then(([categories, banners]) => ({ categories, banners }))
      .catch((e) => {
        shellPromise = null;
        throw e;
      });
  }
  return shellPromise;
};

export const fetchHomeRest = (): Promise<HomeRest> => {
  if (!restPromise) {
    restPromise = Promise.all([
      rest<any>(
        "products?select=id,name,short_description,price,image_url,stock_status,category_id,slug,options,created_at&order=created_at.desc"
      ),
      rest<any>(
        "hot_deals?select=id,name,image_url,product_id,products(slug)&is_active=eq.true&order=sort_order.asc"
      ),
    ])
      .then(([products, hotDeals]) => ({ products, hotDeals }))
      .catch((e) => {
        restPromise = null;
        throw e;
      });
  }
  return restPromise;
};

// Warm the cache immediately on the home route.
if (typeof window !== "undefined" && window.location.pathname === "/") {
  fetchHomeShell().catch(() => {});
  fetchHomeRest().catch(() => {});
}

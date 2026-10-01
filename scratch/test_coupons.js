const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://eybsbcaoboispmzuvjkw.supabase.co";
const SUPABASE_KEY = "sb_publishable_os_8QleRlZQ3xNoQGnS38A_qK30c4Gb";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
  const [c, pc, p, rpcRes] = await Promise.all([
    supabase.from("coupons").select("*"),
    supabase.from("product_coupons").select("*"),
    supabase.from("products").select("id, name, coupon_code, coupon_discount, coupon_option"),
    supabase.rpc("get_product_coupons_by_code", { p_code: "test" }),
  ]);

  console.log("=== GLOBAL COUPONS ===");
  console.log(c.data, "Error:", c.error);

  console.log("\n=== PRODUCT COUPONS TABLE ===");
  console.log(pc.data, "Error:", pc.error);

  console.log("\n=== PRODUCTS WITH COUPONS ===");
  console.log(p.data?.filter(x => x.coupon_code), "Error:", p.error);

  console.log("\n=== RPC TEST ===");
  console.log("RPC Error:", rpcRes.error);
}

check();

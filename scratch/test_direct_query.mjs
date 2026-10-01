import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://eybsbcaoboispmzuvjkw.supabase.co";
const SUPABASE_KEY = "sb_publishable_os_8QleRlZQ3xNoQGnS38A_qK30c4Gb";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function test() {
  const code = "DARA";
  
  // 1. Direct product_coupons query
  const { data: pc, error: pcErr } = await supabase
    .from("product_coupons")
    .select("product_id, discount_amount, option_name, is_active, code")
    .ilike("code", code)
    .eq("is_active", true);

  console.log("Direct product_coupons query for 'DARA':", pc, "Error:", pcErr);

  // 2. Direct products query fallback
  const { data: p, error: pErr } = await supabase
    .from("products")
    .select("id, name, coupon_code, coupon_discount, coupon_option")
    .ilike("coupon_code", code);

  console.log("Direct products query for 'DARA':", p, "Error:", pErr);
}

test();

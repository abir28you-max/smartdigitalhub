import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://eybsbcaoboispmzuvjkw.supabase.co";
const SUPABASE_KEY = "sb_publishable_os_8QleRlZQ3xNoQGnS38A_qK30c4Gb";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testCols() {
  const { data, error } = await supabase.from("product_coupons").select("*").limit(1);
  console.log("product_coupons sample row:", data?.[0]);
  
  const { data: cData } = await supabase.from("coupons").select("*").limit(1);
  console.log("coupons sample row:", cData?.[0]);
}

testCols();

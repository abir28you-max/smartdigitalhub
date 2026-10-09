import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://eybsbcaoboispmzuvjkw.supabase.co",
  "sb_publishable_os_8QleRlZQ3xNoQGnS38A_qK30c4Gb"
);

async function check() {
  const { data, error } = await supabase
    .from("orders")
    .select("id, customer_name, customer_phone, total_price, transaction_id, status, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  console.log("Latest Orders in Supabase:", JSON.stringify(data, null, 2));
  if (error) console.error("Supabase Error:", error);
}

check();

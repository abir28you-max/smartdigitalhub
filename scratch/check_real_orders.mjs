import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://eybsbcaoboispmzuvjkw.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5YnNiY2FvYm9pc3BtenV2amt3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDM3MTgyMSwiZXhwIjoyMTA1OTQ3ODIxfQ.n_Zaa52kJVtQFx9bmXq8ao4L4w5_8Kub7vYD5ZCRTQU";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function check() {
  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, customer_name, customer_email, customer_phone, total_price, status, transaction_id, delivery_notes, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  console.log("Real Orders in Supabase:", JSON.stringify(orders, null, 2));
  if (error) console.error("Error:", error);
}

check();

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { phone, transaction_id } = await req.json();
    if ((!phone || phone.length < 5) && (!transaction_id || transaction_id.length < 3)) {
      return new Response(JSON.stringify({ error: "Phone number or Transaction ID required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let query = supabase
      .from("orders")
      .select("id, created_at, total_price, status, items, customer_name, transaction_id, payment_method_id, payment_methods(name), delivery_notes")
      .order("created_at", { ascending: false });

    if (phone && phone.length >= 5) {
      query = query.eq("customer_phone", phone);
    }
    if (transaction_id && transaction_id.length >= 3) {
      query = query.eq("transaction_id", transaction_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    return new Response(JSON.stringify(data || []), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

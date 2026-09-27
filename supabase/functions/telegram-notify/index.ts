import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID");

const escapeHtml = (v: unknown) =>
  String(v ?? "-")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const nowBD = () =>
  new Date().toLocaleString("en-GB", {
    timeZone: "Asia/Dhaka",
    dateStyle: "medium",
    timeStyle: "short",
  });

async function sendTelegram(text: string) {
  if (!BOT_TOKEN || !CHAT_ID) throw new Error("Telegram credentials not configured");
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  let lastError = "";
  // retry with exponential backoff
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body?.ok) return body;
      lastError = `[${res.status}] ${JSON.stringify(body)}`;
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
    }
    console.error(`Telegram sendMessage attempt ${attempt} failed: ${lastError}`);
    if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 1000));
  }
  throw new Error(lastError);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const payload = await req.json().catch(() => null);
    const type = payload?.type;
    if (type !== "order" && type !== "support") {
      return new Response(JSON.stringify({ error: "Invalid type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const d = payload.data ?? {};
    const name = escapeHtml(String(d.name ?? "").slice(0, 200));
    const phone = escapeHtml(String(d.phone ?? "").slice(0, 50));
    let text: string;

    if (type === "order") {
      const dd = d.delivery_details
        ? `\n📝 Delivery Details: ${escapeHtml(String(d.delivery_details).slice(0, 1000))}`
        : "";
      text =
        `🛒 <b>New Order Received</b>\n\n` +
        `👤 Name: ${name}\n` +
        `📞 Phone: ${phone}\n` +
        `📦 Product: ${escapeHtml(String(d.product ?? "").slice(0, 1500))}\n` +
        `💳 Payment Method: ${escapeHtml(String(d.payment_method ?? "").slice(0, 100))}\n` +
        `🆔 Transaction ID: ${escapeHtml(String(d.transaction_id ?? "").slice(0, 100))}\n` +
        `📧 Email: ${escapeHtml(String(d.email ?? "-").slice(0, 200))}\n` +
        `💰 Total: ৳${escapeHtml(String(d.total ?? "-").slice(0, 30))}${dd}\n` +
        `🕒 Time: ${escapeHtml(nowBD())}\n\n` +
        `↩️ <i>Reply to this message with the delivery details (links + instructions) to deliver instantly.</i>`;
    } else {
      text =
        `📩 <b>New Support Request</b>\n\n` +
        `👤 Name: ${name}\n` +
        `📞 Phone: ${phone}\n` +
        `🕒 Time: ${escapeHtml(nowBD())}`;
    }

    const sent = await sendTelegram(text);

    // Link the Telegram message to the order so an admin reply delivers it.
    const orderId = typeof d.order_id === "string" ? d.order_id : null;
    const messageId = sent?.result?.message_id;
    if (type === "order" && orderId && messageId) {
      try {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );
        await supabase.from("orders").update({ telegram_message_id: messageId }).eq("id", orderId);
      } catch (e) {
        console.error("Failed to link telegram message to order:", e);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("telegram-notify failed:", message);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

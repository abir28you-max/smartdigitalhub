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

async function sendTelegram(text: string, replyMarkup?: any) {
  if (!BOT_TOKEN || !CHAT_ID) throw new Error("Telegram credentials not configured");
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  let lastError = "";
  
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
          ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
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
    const orderId = typeof d.order_id === "string" ? d.order_id : null;
    const formattedOrderId = orderId ? (orderId.startsWith("#") ? orderId : `#${orderId}`) : "#SDH-NEW";
    let text: string;
    let replyMarkup: any = undefined;

    if (type === "order") {
      const dd = d.delivery_details
        ? `\nDelivery Details: ${escapeHtml(String(d.delivery_details).slice(0, 1000))}`
        : "";
      
      const cleanPhone = String(d.phone || "").replace(/[^0-9]/g, "");
      const waPhone = cleanPhone.startsWith("880")
        ? cleanPhone
        : cleanPhone.startsWith("0")
        ? `88${cleanPhone}`
        : cleanPhone ? `880${cleanPhone}` : "";

      text =
        `<b>NEW ORDER RECEIVED (${escapeHtml(formattedOrderId)})</b>\n` +
        `----------------------------------------\n` +
        `Customer: ${name}\n` +
        `Email: ${escapeHtml(String(d.email ?? "-").slice(0, 200))}\n` +
        `Phone: <code>${phone}</code>\n` +
        `Product: ${escapeHtml(String(d.product ?? "").slice(0, 1500))}\n` +
        `Amount: ${escapeHtml(String(d.total ?? "-").slice(0, 30))} BDT\n` +
        `Payment Method: ${escapeHtml(String(d.payment_method ?? "").slice(0, 100))}\n` +
        `Transaction ID: <code>${escapeHtml(String(d.transaction_id ?? "N/A").slice(0, 100))}</code>${dd}\n` +
        `----------------------------------------\n` +
        `<i>Reply directly to this message with Email/Password/Link to deliver.</i>`;

      const keyboard: any[][] = [];

      if (orderId) {
        keyboard.push([
          { text: "Approve & Deliver", callback_data: `verify_${orderId}` },
          { text: "Reject Order", callback_data: `reject_${orderId}` },
        ]);
      }

      if (waPhone) {
        keyboard.push([
          { text: "Contact Customer", url: `https://wa.me/${waPhone}` },
        ]);
      } else {
        keyboard.push([
          { text: "Open FastAdmin", url: "https://smartdigitalhub.site/fast-admin" },
        ]);
      }

      replyMarkup = { inline_keyboard: keyboard };
    } else {
      text =
        `<b>New Support Request</b>\n\n` +
        `Customer: ${name}\n` +
        `Phone: ${phone}\n` +
        `Time: ${new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })}`;
    }

    const sent = await sendTelegram(text, replyMarkup);

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

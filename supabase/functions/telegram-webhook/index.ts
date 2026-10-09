import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || "8636262237:AAFLQWn9Nh1IlHf7aPRj2-OvFyZK-JFbV6E";
const CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID") || "8944136914";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://eybsbcaoboispmzuvjkw.supabase.co";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5YnNiY2FvYm9pc3BtenV2amt3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDM3MTgyMSwiZXhwIjoyMTA1OTQ3ODIxfQ.n_Zaa52kJVtQFx9bmXq8ao4L4w5_8Kub7vYD5ZCRTQU";

const escapeHtml = (v: unknown) =>
  String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function deriveSecret(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`telegram-webhook:${token}`));
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function safeEqual(a: string | null, b: string) {
  if (!a || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Ultra-fast Telegram API dispatcher
function replyFast(chatId: number | string, text: string, replyTo?: number, replyMarkup?: any) {
  return fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      ...(replyTo ? { reply_to_message_id: replyTo } : {}),
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    }),
  }).catch(() => {});
}

function answerCallbackFast(callbackQueryId: string, text?: string) {
  return fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      ...(text ? { text, show_alert: false } : {}),
    }),
  }).catch(() => {});
}

function parseNotes(raw: string) {
  const text = raw.split("\n").map((l) => l.trim()).filter(Boolean).join("\n").trim();
  const link = text.match(/https?:\/\/(?:www\.)?(?!youtube\.com|youtu\.be)\S+/i)?.[0] ?? "";
  const video_url = text.match(/https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\S+/i)?.[0] ?? "";
  return [{ note: text, link, video_url }];
}

// Background transactional email dispatch (never blocks bot execution)
function triggerEmailAsync(templateName: string, order: Record<string, unknown>, extra: Record<string, unknown>) {
  const email = order.customer_email as string | null;
  if (!email) return;
  fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_KEY}`,
      apikey: SERVICE_KEY,
    },
    body: JSON.stringify({
      templateName,
      recipientEmail: email,
      idempotencyKey: `${templateName}-${order.id}-${Date.now()}`,
      templateData: {
        customerName: order.customer_name,
        orderId: order.id,
        transactionId: order.transaction_id ?? null,
        totalPrice: order.total_price,
        items: Array.isArray(order.items) ? order.items : [],
        ...extra,
      },
    }),
  }).catch((err) => console.error(`Async ${templateName} email error:`, err));
}

Deno.serve(async (req) => {
  if (req.method === "GET") {
    const secret = await deriveSecret(BOT_TOKEN);
    const url = `https://${new URL(req.url).host}/functions/v1/telegram-webhook`;
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        secret_token: secret,
        allowed_updates: ["message", "edited_message", "callback_query"],
      }),
    });

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setMyCommands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commands: [
          { command: "orders", description: "View pending orders" },
          { command: "verify", description: "Verify & deliver order" },
          { command: "stats", description: "View sales & statistics" },
          { command: "help", description: "Admin bot instructions" },
        ],
      }),
    });

    const info = await res.json().catch(() => ({}));
    return new Response(JSON.stringify({ url, telegram: info }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const expected = await deriveSecret(BOT_TOKEN);
  if (!safeEqual(req.headers.get("X-Telegram-Bot-Api-Secret-Token"), expected)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const update = await req.json().catch(() => null);
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Handle Inline Button Clicks
  if (update?.callback_query) {
    const cb = update.callback_query;
    const cbData = String(cb.data || "");
    const fromId = cb.from?.id;

    if (String(fromId) !== String(CHAT_ID)) {
      answerCallbackFast(cb.id, "Unauthorized");
      return new Response(JSON.stringify({ ok: true }));
    }

    if (cbData.startsWith("verify_")) {
      const orderId = cbData.replace("verify_", "").trim();
      answerCallbackFast(cb.id);

      const cleanId = orderId.replace(/^#/, "");
      let order: any = null;
      const { data } = await supabase.from("orders").select("id, customer_name, customer_email, total_price, items").eq("id", cleanId).maybeSingle();
      order = data;
      if (!order) {
        const { data: fuzzy } = await supabase.from("orders").select("id, customer_name, customer_email, total_price, items").ilike("id", `%${cleanId}%`).maybeSingle();
        order = fuzzy;
      }

      const formattedId = orderId.startsWith("#") ? orderId : `#${orderId}`;
      const productName = Array.isArray(order?.items) && order.items.length > 0
        ? order.items.map((i: any) => `${i.name || "Product"}${i.option ? ` (${i.option})` : ""}`).join(", ")
        : "Subscription";

      await replyFast(
        CHAT_ID,
        `<b>Deliver Order (${escapeHtml(formattedId)})</b>\n` +
        `----------------------------------------\n` +
        `Customer: <b>${escapeHtml(order?.customer_name || "Customer")}</b>\n` +
        `Email: ${escapeHtml(order?.customer_email || "-")}\n` +
        `Subscriptions: <b>${escapeHtml(productName)}</b>\n` +
        `----------------------------------------\n` +
        `Reply directly to this message with:\n` +
        `<code>Email: user@example.com\nPassword: password123\nLogin URL: https://...</code>`,
        undefined,
        {
          force_reply: true,
          input_field_placeholder: `Email: ... Pass: ...`,
        }
      );
      return new Response(JSON.stringify({ ok: true }));
    }

    if (cbData.startsWith("reject_")) {
      const orderId = cbData.replace("reject_", "").trim();
      answerCallbackFast(cb.id, "Order rejected");
      
      const cleanId = orderId.replace(/^#/, "");
      let order: any = null;
      const { data } = await supabase.from("orders").select("id, customer_name, customer_email, transaction_id").eq("id", cleanId).maybeSingle();
      order = data;
      if (!order) {
        const { data: fuzzy } = await supabase.from("orders").select("id, customer_name, customer_email, transaction_id").ilike("id", `%${cleanId}%`).maybeSingle();
        order = fuzzy;
      }

      const formattedId = orderId.startsWith("#") ? orderId : `#${orderId}`;
      const trxId = order?.transaction_id || "N/A";

      if (order?.id) {
        supabase.from("orders").update({ status: "rejected" }).eq("id", order.id).then(() => {});
        triggerEmailAsync("order-rejected", order as Record<string, unknown>, { reason: "Invalid Transaction ID" });
      }

      const rejectTemplate =
        `<b>ORDER STATUS UPDATE (${escapeHtml(formattedId)})</b>\n\n` +
        `Dear Customer,\n` +
        `Your order could not be verified due to an invalid or missing Transaction ID (${escapeHtml(trxId)}).\n\n` +
        `Please verify your payment and re-submit or contact our live support: @SmartDigitalHubSupport`;

      await replyFast(CHAT_ID, rejectTemplate);
      return new Response(JSON.stringify({ ok: true }));
    }
  }

  const msg = update?.message ?? update?.edited_message;
  const chatId = msg?.chat?.id;
  const text: string = (msg?.text ?? msg?.caption ?? "").trim();

  if (!msg || String(chatId) !== String(CHAT_ID) || !text) {
    return new Response(JSON.stringify({ ok: true, ignored: true }));
  }

  // /stats
  if (/^\/stats\b/i.test(text)) {
    const { data: orders } = await supabase.from("orders").select("total_price, status");
    const totalOrders = orders?.length || 0;
    const pendingOrders = orders?.filter((o) => o.status === "pending" || o.status === "verified").length || 0;
    const deliveredOrders = orders?.filter((o) => o.status === "delivered").length || 0;
    const totalRevenue = orders?.filter((o) => o.status === "delivered").reduce((sum, o) => sum + Number(o.total_price || 0), 0) || 0;

    await replyFast(
      chatId,
      `<b>STORE STATISTICS</b>\n` +
      `----------------------------------------\n` +
      `Total Orders: ${totalOrders}\n` +
      `Pending Orders: ${pendingOrders}\n` +
      `Delivered Orders: ${deliveredOrders}\n` +
      `Total Revenue: ${totalRevenue} BDT\n` +
      `----------------------------------------`,
      msg.message_id
    );
    return new Response(JSON.stringify({ ok: true }));
  }

  // /orders
  if (/^\/orders\b/i.test(text)) {
    const { data: list } = await supabase
      .from("orders")
      .select("id, customer_name, customer_phone, total_price, status, created_at")
      .in("status", ["pending", "verified"])
      .order("created_at", { ascending: false })
      .limit(6);

    if (!list?.length) {
      await replyFast(chatId, "No pending orders. Everything is up to date.", msg.message_id);
      return new Response(JSON.stringify({ ok: true }));
    }

    let responseText = `<b>PENDING ORDERS LIST (${list.length})</b>\n----------------------------------------\n\n`;
    const keyboard: any[][] = [];

    list.forEach((o, index) => {
      const formattedId = o.id.startsWith("#") ? o.id : `#${o.id}`;
      responseText +=
        `<b>#${index + 1}. Order ID:</b> <code>${formattedId}</code>\n` +
        `Customer: ${escapeHtml(o.customer_name)}\n` +
        `Phone: ${escapeHtml(o.customer_phone)}\n` +
        `Amount: ${o.total_price} BDT\n\n`;

      keyboard.push([
        { text: `Approve #${o.id.slice(0, 8)}`, callback_data: `verify_${o.id}` },
        { text: `Reject`, callback_data: `reject_${o.id}` },
      ]);
    });

    keyboard.push([{ text: "Open FastAdmin", url: "https://smartdigitalhub.site/fast-admin" }]);

    await replyFast(chatId, responseText, msg.message_id, { inline_keyboard: keyboard });
    return new Response(JSON.stringify({ ok: true }));
  }

  // /verify
  const verifyMatch = text.match(/^\/verify(?:\s+(\S+))?$/i);
  if (verifyMatch) {
    const rawId = verifyMatch[1]?.trim();
    if (!rawId) {
      await replyFast(chatId, "Usage: <code>/verify &lt;order_id&gt;</code>\nOr tap /orders to see pending orders.", msg.message_id);
      return new Response(JSON.stringify({ ok: true }));
    }

    const cleanId = rawId.replace(/^#/, "");
    let order: any = null;
    const { data } = await supabase.from("orders").select("*").eq("id", cleanId).maybeSingle();
    order = data;
    if (!order) {
      const { data: fuzzy } = await supabase.from("orders").select("*").ilike("id", `%${cleanId}%`).maybeSingle();
      order = fuzzy;
    }

    const formattedId = rawId.startsWith("#") ? rawId : `#${rawId}`;

    await replyFast(
      chatId,
      `<b>Order Details: ${escapeHtml(formattedId)}</b>\n` +
      `----------------------------------------\n` +
      `Customer: ${escapeHtml(order?.customer_name || "Customer")}\n` +
      `Phone: ${escapeHtml(order?.customer_phone || "-")}\n` +
      `Email: ${escapeHtml(order?.customer_email || "-")}\n` +
      `Amount: ${order?.total_price || 0} BDT\n` +
      `Transaction ID: <code>${escapeHtml(order?.transaction_id || "-")}</code>\n` +
      `Status: ${escapeHtml(order?.status || "pending")}\n\n` +
      `Reply with credentials/link to deliver.`,
      msg.message_id,
      {
        inline_keyboard: [
          [
            { text: "Approve & Deliver", callback_data: `verify_${rawId}` },
            { text: "Reject Order", callback_data: `reject_${rawId}` },
          ],
        ],
      }
    );
    return new Response(JSON.stringify({ ok: true }));
  }

  // /help
  if (/^\/help\b/i.test(text) || /^\/start\b/i.test(text)) {
    await replyFast(
      chatId,
      `<b>Smart Digital Hub Admin Bot</b>\n` +
      `----------------------------------------\n` +
      `Commands:\n` +
      `• /orders - View all pending orders\n` +
      `• /verify &lt;order_id&gt; - View order details & deliver\n` +
      `• /deliver &lt;order_id&gt; &lt;details&gt; - Deliver order\n` +
      `• /reject &lt;order_id&gt; &lt;reason&gt; - Reject invalid order\n` +
      `• /stats - View sales and statistics\n\n` +
      `Tip: Reply directly to any order notification with Email/Password/Link to deliver instantly.`,
      msg.message_id
    );
    return new Response(JSON.stringify({ ok: true }));
  }

  // Smart Order Extraction for Direct Replies
  let targetOrderId: string | null = null;
  let action: "deliver" | "reject" = "deliver";
  let contentText = "";

  const deliverCmd = text.match(/^\/deliver\s+(\S+)\s*([\s\S]*)$/i);
  const rejectCmd = text.match(/^\/reject\s+(\S+)\s*([\s\S]*)$/i);
  const plainReject = text.match(/^\/reject\b\s*([\s\S]*)$/i);
  const plainDeliver = text.match(/^\/deliver\b\s*([\s\S]*)$/i);

  if (deliverCmd) {
    targetOrderId = deliverCmd[1].trim();
    contentText = deliverCmd[2].trim();
    action = "deliver";
  } else if (rejectCmd) {
    targetOrderId = rejectCmd[1].trim();
    contentText = rejectCmd[2].trim();
    action = "reject";
  } else if (plainReject) {
    action = "reject";
    contentText = plainReject[1].trim();
  } else if (plainDeliver) {
    action = "deliver";
    contentText = plainDeliver[1].trim();
  } else if (msg.reply_to_message) {
    action = "deliver";
    contentText = text;
  }

  // Extract order ID from replied message
  if (!targetOrderId && msg.reply_to_message?.text) {
    const idInReplied = msg.reply_to_message.text.match(/(?:Order\s*\(?#?|Order ID:\s*<code>#?|\b)([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|SDH-[A-Z0-9]+)/i);
    if (idInReplied) {
      targetOrderId = idInReplied[1].trim();
    }
  }

  let order: any = null;
  const cleanId = (targetOrderId || "").replace(/^#/, "").trim();

  if (cleanId) {
    const { data } = await supabase.from("orders").select("*").eq("id", cleanId).maybeSingle();
    order = data;
    if (!order) {
      const { data: fuzzy } = await supabase.from("orders").select("*").ilike("id", `%${cleanId}%`).maybeSingle();
      order = fuzzy;
    }
  }

  if (!order && msg.reply_to_message?.message_id) {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("telegram_message_id", msg.reply_to_message.message_id)
      .maybeSingle();
    order = data;
  }

  if (!order) {
    const { data: latest } = await supabase
      .from("orders")
      .select("*")
      .in("status", ["pending", "verified"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    order = latest;
  }

  const finalOrderId = order?.id || targetOrderId || "SDH-1049";
  const formattedId = finalOrderId.startsWith("#") ? finalOrderId : `#${finalOrderId}`;

  if (action === "reject") {
    const reason = contentText || "Invalid Transaction ID";
    if (order?.id) {
      supabase
        .from("orders")
        .update({
          status: "rejected",
          delivery_notes: [{ note: `Rejected: ${reason}`, link: "" }],
        })
        .eq("id", order.id)
        .then(() => {});

      triggerEmailAsync("order-rejected", order as Record<string, unknown>, { reason });
    }

    const rejectTemplate =
      `<b>ORDER STATUS UPDATE (${escapeHtml(formattedId)})</b>\n\n` +
      `Dear Customer,\n` +
      `Your order could not be verified due to an invalid or missing Transaction ID (${escapeHtml(order?.transaction_id || "9H76GF23LM")}).\n\n` +
      `Please verify your payment and re-submit or contact support: @SmartDigitalHubSupport`;

    await replyFast(chatId, rejectTemplate, msg.message_id);
    return new Response(JSON.stringify({ ok: true }));
  }

  // Deliver
  if (!contentText) {
    await replyFast(chatId, `Please provide credentials or link for ${finalOrderId}.`, msg.message_id);
    return new Response(JSON.stringify({ ok: true }));
  }

  const notes = parseNotes(contentText);
  
  // Instant parallel DB write + async email
  if (order?.id) {
    supabase.from("orders").update({ status: "delivered", delivery_notes: notes }).eq("id", order.id).then(() => {});
    triggerEmailAsync("order-delivered", order as Record<string, unknown>, { notes });
  }

  const productName = Array.isArray(order?.items) && order.items.length > 0
    ? order.items.map((i: any) => `${i.name || "Product"}${i.option ? ` (${i.option})` : ""}`).join(", ")
    : "Cruchyroll (1 Month Profile)";

  const deliveryTemplate =
    `<b>ORDER COMPLETED & DELIVERED</b>\n\n` +
    `Dear Customer,\n` +
    `Thank you for purchasing from Smart Digital Hub.\n` +
    `Your order <b>${escapeHtml(formattedId)}</b> has been successfully verified.\n\n` +
    `<b>Subscriptions:</b>\n` +
    `• ${escapeHtml(productName)}\n\n` +
    `<b>Delivery Access & Credentials:</b>\n` +
    `----------------------------------------\n` +
    `<code>${escapeHtml(contentText)}</code>\n` +
    `----------------------------------------\n` +
    `Note: Please do not change account security settings.\n\n` +
    `Support: @SmartDigitalHubSupport\n` +
    `Website: https://smartdigitalhub.site`;

  await replyFast(chatId, deliveryTemplate, msg.message_id);
  return new Response(JSON.stringify({ ok: true }));
});

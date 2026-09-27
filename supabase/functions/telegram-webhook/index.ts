import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

async function reply(chatId: number | string, text: string, replyTo?: number) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      ...(replyTo ? { reply_to_message_id: replyTo } : {}),
    }),
  }).catch(() => {});
}

// Keeps the admin's message as ONE delivery note (line breaks preserved).
// The first URL found becomes the clickable link.
function parseNotes(raw: string) {
  const text = raw.split("\n").map((l) => l.trim()).filter(Boolean).join("\n").trim();
  const link = text.match(/https?:\/\/\S+/)?.[0] ?? "";
  return [{ note: text, link }];
}

// Sends the delivery details to the customer's email (best-effort).
async function sendOrderEmail(
  templateName: string,
  order: Record<string, unknown>,
  extra: Record<string, unknown>,
) {
  const email = order.customer_email as string | null;
  if (!email) return;
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_KEY}`,
        apikey: SERVICE_KEY,
      },
      body: JSON.stringify({
        templateName,
        recipientEmail: email,
        idempotencyKey: `${templateName}-${order.id}`,
        templateData: {
          customerName: order.customer_name,
          orderId: order.id,
          transactionId: order.transaction_id ?? null,
          totalPrice: order.total_price,
          items: Array.isArray(order.items) ? order.items : [],
          ...extra,
        },
      }),
    });
  } catch (e) {
    console.error(`${templateName} email failed:`, e);
  }
}

async function sendDeliveryEmail(order: Record<string, unknown>, notes: { note: string; link: string }[]) {
  const email = order.customer_email as string | null;
  if (!email) return;
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_KEY}`,
        apikey: SERVICE_KEY,
      },
      body: JSON.stringify({
        templateName: "order-delivered",
        recipientEmail: email,
        idempotencyKey: `order-delivered-${order.id}`,
        templateData: {
          customerName: order.customer_name,
          orderId: order.id,
          transactionId: order.transaction_id ?? null,
          totalPrice: order.total_price,
          items: Array.isArray(order.items) ? order.items : [],
          notes,
        },
      }),
    });
  } catch (e) {
    console.error("delivery email failed:", e);
  }
}

Deno.serve(async (req) => {
  if (!BOT_TOKEN || !CHAT_ID) return new Response("Not configured", { status: 500 });

  // GET registers this endpoint as the bot's webhook (idempotent, points at itself).
  if (req.method === "GET") {
    const secret = await deriveSecret(BOT_TOKEN);
    const url = `https://${new URL(req.url).host}/functions/v1/telegram-webhook`;
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, secret_token: secret, allowed_updates: ["message", "edited_message"] }),
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
  const msg = update?.message ?? update?.edited_message;
  const chatId = msg?.chat?.id;
  const text: string = (msg?.text ?? msg?.caption ?? "").trim();

  // Only the configured admin chat may deliver orders.
  if (!msg || String(chatId) !== String(CHAT_ID) || !text) {
    return new Response(JSON.stringify({ ok: true, ignored: true }));
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  // /orders — list the latest orders that still need action (with their IDs).
  if (/^\/orders\b/i.test(text)) {
    const { data: list } = await supabase
      .from("orders")
      .select("id, customer_name, total_amount, status, created_at")
      .in("status", ["pending", "verified"])
      .order("created_at", { ascending: false })
      .limit(10);

    if (!list?.length) {
      await reply(chatId, "✅ No pending orders.", msg.message_id);
      return new Response(JSON.stringify({ ok: true }));
    }

    const lines = list.map(
      (o) =>
        `• <b>${escapeHtml(o.customer_name)}</b> — ${escapeHtml(o.total_amount)} (${escapeHtml(o.status)})\n<code>${escapeHtml(o.id)}</code>`,
    );
    await reply(
      chatId,
      `📋 <b>Pending orders</b>\n\n${lines.join("\n\n")}\n\nDeliver: <code>/deliver &lt;id&gt; details</code>\nReject: <code>/reject &lt;id&gt; reason</code>`,
      msg.message_id,
    );
    return new Response(JSON.stringify({ ok: true }));
  }

  let orderQuery: { column: string; value: string | number } | null = null;
  let body = text;
  let action: "deliver" | "reject" = "deliver";

  const deliverCmd = text.match(/^\/deliver\s+(\S+)\s+([\s\S]+)$/i);
  const rejectCmd = text.match(/^\/reject\s+(\S+)(?:\s+([\s\S]+))?$/i);
  const replyReject = text.match(/^\/reject\b\s*([\s\S]*)$/i);
  const replyDeliver = text.match(/^\/deliver\b\s*([\s\S]*)$/i);

  if (msg.reply_to_message?.message_id) {
    // Replying to an order notification: the order comes from the replied message.
    orderQuery = { column: "telegram_message_id", value: msg.reply_to_message.message_id };
    if (replyReject) {
      action = "reject";
      body = replyReject[1] ?? "";
    } else if (replyDeliver) {
      body = replyDeliver[1] ?? "";
    }
  } else if (deliverCmd) {
    orderQuery = { column: "id", value: deliverCmd[1] };
    body = deliverCmd[2];
  } else if (rejectCmd) {
    action = "reject";
    orderQuery = { column: "id", value: rejectCmd[1] };
    body = rejectCmd[2] ?? "";
  }

  if (orderQuery && action === "deliver" && !body.trim()) {
    await reply(chatId, "ℹ️ Add the delivery details after <code>/deliver</code> — e.g. <code>/deliver https://link.com Login details here</code>", msg.message_id);
    return new Response(JSON.stringify({ ok: true }));
  }

  if (!orderQuery) {
    await reply(
      chatId,
      "ℹ️ <b>How to use</b>\n\n• Reply to an order notification with the delivery details → delivered\n• Reply with <code>/reject reason</code> → rejected\n• <code>/orders</code> — list pending orders with IDs\n• <code>/deliver &lt;order-id&gt; details</code>\n• <code>/reject &lt;order-id&gt; reason</code>",
      msg.message_id,
    );
    return new Response(JSON.stringify({ ok: true }));
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, customer_name, customer_email, transaction_id, total_price, items, status")
    .eq(orderQuery.column, orderQuery.value as never)
    .maybeSingle();

  if (!order) {
    await reply(
      chatId,
      "❌ Order not found. Use <code>/orders</code> to see pending order IDs.",
      msg.message_id,
    );
    return new Response(JSON.stringify({ ok: true }));
  }

  if (action === "reject") {
    const reason = body.trim();
    const { error: rejErr } = await supabase
      .from("orders")
      .update({
        status: "rejected",
        ...(reason ? { delivery_notes: [{ note: `Rejected: ${reason}`, link: "" }] } : {}),
      })
      .eq("id", order.id);

    if (rejErr) {
      console.error("reject update failed:", rejErr.message);
      await reply(chatId, `❌ Failed to reject: ${escapeHtml(rejErr.message)}`, msg.message_id);
      return new Response(JSON.stringify({ ok: false }), { status: 500 });
    }

    await reply(
      chatId,
      `🚫 <b>Rejected</b> — ${escapeHtml(order.customer_name)}\nOrder: <code>${escapeHtml(order.id)}</code>${reason ? `\nReason: ${escapeHtml(reason)}` : ""}`,
      msg.message_id,
    );

    await sendOrderEmail("order-rejected", order as Record<string, unknown>, {
      reason: reason || null,
    });

    return new Response(JSON.stringify({ ok: true }));
  }

  const notes = parseNotes(body);
  const { error } = await supabase
    .from("orders")
    .update({ status: "delivered", delivery_notes: notes })
    .eq("id", order.id);

  if (error) {
    console.error("delivery update failed:", error.message);
    await reply(chatId, `❌ Failed to save delivery: ${escapeHtml(error.message)}`, msg.message_id);
    return new Response(JSON.stringify({ ok: false }), { status: 500 });
  }

  await reply(
    chatId,
    `✅ <b>Delivered</b> to ${escapeHtml(order.customer_name)}\nOrder: <code>${escapeHtml(order.id)}</code>\nThe customer can now see it on the website.`,
    msg.message_id,
  );

  await sendDeliveryEmail(order as Record<string, unknown>, notes);

  return new Response(JSON.stringify({ ok: true }));
});

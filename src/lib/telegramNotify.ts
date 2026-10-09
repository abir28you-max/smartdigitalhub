import { supabase } from "@/integrations/supabase/client";

export const DEFAULT_TELEGRAM_BOT_TOKEN = "8636262237:AAFLQWn9Nh1IlHf7aPRj2-OvFyZK-JFbV6E";
export const DEFAULT_TELEGRAM_CHAT_ID = "8944136914";

export interface OrderNotificationData {
  order_id?: string;
  name: string;
  phone: string;
  email?: string;
  product: string;
  payment_method: string;
  transaction_id?: string;
  total: number;
  delivery_details?: string;
}

export const getTelegramConfig = async () => {
  try {
    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["telegram_bot_token", "telegram_chat_id"]);

    const settings: Record<string, string> = {};
    if (data) {
      data.forEach((r: any) => {
        settings[r.key] = r.value;
      });
    }

    return {
      botToken:
        settings.telegram_bot_token ||
        localStorage.getItem("telegram_bot_token") ||
        DEFAULT_TELEGRAM_BOT_TOKEN,
      chatId:
        settings.telegram_chat_id ||
        localStorage.getItem("telegram_chat_id") ||
        DEFAULT_TELEGRAM_CHAT_ID,
    };
  } catch {
    return {
      botToken: localStorage.getItem("telegram_bot_token") || DEFAULT_TELEGRAM_BOT_TOKEN,
      chatId: localStorage.getItem("telegram_chat_id") || DEFAULT_TELEGRAM_CHAT_ID,
    };
  }
};

export const sendTelegramOrderAlert = async (data: OrderNotificationData) => {
  try {
    const { botToken, chatId } = await getTelegramConfig();
    if (!botToken || !chatId) return;

    const cleanPhone = (data.phone || "").replace(/[^0-9]/g, "");
    const waPhone = cleanPhone.startsWith("880")
      ? cleanPhone
      : cleanPhone.startsWith("0")
      ? `88${cleanPhone}`
      : cleanPhone ? `880${cleanPhone}` : "";

    const dd = data.delivery_details
      ? `\n📝 <b>Delivery Details:</b> ${data.delivery_details}`
      : "";

    const text =
      `🛍️ <b>NEW ORDER RECEIVED!</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🆔 <b>Order ID:</b> <code>${data.order_id || "N/A"}</code>\n` +
      `👤 <b>Customer:</b> ${data.name}\n` +
      `📞 <b>Phone:</b> <code>${data.phone}</code>\n` +
      `📧 <b>Email:</b> ${data.email || "-"}\n` +
      `📦 <b>Product:</b> ${data.product}\n` +
      `💳 <b>Payment Method:</b> ${data.payment_method}\n` +
      `🔢 <b>TrxID:</b> <code>${data.transaction_id || "N/A"}</code>\n` +
      `💰 <b>Total Amount:</b> ৳${data.total} BDT${dd}\n` +
      `🕒 <b>Time:</b> ${new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `⚡ <i>Verify payment & deliver directly via FastAdmin or by replying to this message!</i>`;

    const inline_keyboard: any[][] = [
      [
        {
          text: "⚡ Open FastAdmin",
          url: "https://smartdigitalhub.site/fast-admin",
        },
      ],
    ];

    if (waPhone) {
      inline_keyboard.push([
        {
          text: "💬 WhatsApp Customer",
          url: `https://wa.me/${waPhone}`,
        },
      ]);
    }

    // Direct Telegram API dispatch (instant, 0 delay)
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard,
        },
      }),
    });
  } catch (error) {
    console.error("Failed to send Telegram order alert:", error);
  }
};

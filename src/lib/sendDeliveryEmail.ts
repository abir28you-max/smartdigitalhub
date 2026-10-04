import { supabase } from "@/integrations/supabase/client";

interface Item {
  name?: string;
  option?: string | null;
  quantity?: number;
  price?: number;
}

interface Note {
  note?: string;
  link?: string;
  video_url?: string;
}

interface DeliveryEmailParams {
  recipientEmail: string;
  customerName: string;
  orderId: string;
  transactionId?: string | null;
  totalPrice: number;
  items: Item[];
  notes: Note[];
}

export const getEmailSettings = async () => {
  try {
    const { data } = await supabase.from("site_settings").select("key, value");
    const settings: Record<string, string> = {};
    if (data) {
      data.forEach((r: any) => {
        settings[r.key] = r.value;
      });
    }
    return {
      apiKey: settings.resend_api_key || localStorage.getItem("resend_api_key") || "",
      senderEmail: settings.sender_email || localStorage.getItem("sender_email") || "Smart Digital Hub <onboarding@resend.dev>",
    };
  } catch {
    return {
      apiKey: localStorage.getItem("resend_api_key") || "",
      senderEmail: localStorage.getItem("sender_email") || "Smart Digital Hub <onboarding@resend.dev>",
    };
  }
};

export const saveEmailSettings = async (apiKey: string, senderEmail: string) => {
  localStorage.setItem("resend_api_key", apiKey.trim());
  localStorage.setItem("sender_email", senderEmail.trim());

  try {
    await supabase.from("site_settings").upsert([
      { key: "resend_api_key", value: apiKey.trim(), updated_at: new Date().toISOString() },
      { key: "sender_email", value: senderEmail.trim(), updated_at: new Date().toISOString() },
    ]);
  } catch (e) {
    console.error("Failed to save email settings to DB:", e);
  }
};

export const generateDeliveryHtml = (params: DeliveryEmailParams): string => {
  const itemsHtml = params.items
    .map(
      (it) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 0; font-weight: 600; color: #1e293b;">
          ${it.name || "Digital Product"} ${it.option ? `<span style="color: #64748b; font-size: 12px;">(${it.option})</span>` : ""}
        </td>
        <td style="padding: 10px 0; text-align: right; color: #64748b;">
          ${it.quantity || 1}x
        </td>
      </tr>
    `
    )
    .join("");

  const notesHtml = params.notes
    .map(
      (n, i) => `
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #7c3aed; border-radius: 8px; padding: 14px; margin-bottom: 12px;">
        <div style="font-weight: 700; color: #7c3aed; margin-bottom: 6px; font-size: 13px;">Credential / Item #${i + 1}</div>
        ${n.note ? `<div style="font-family: monospace; font-size: 14px; color: #0f172a; white-space: pre-wrap; word-break: break-word; background: #ffffff; padding: 10px; border-radius: 6px; border: 1px solid #cbd5e1;">${n.note.replace(/\n/g, "<br/>")}</div>` : ""}
        ${
          n.link
            ? `<div style="margin-top: 10px;">
                <a href="${n.link}" target="_blank" style="display: inline-block; background-color: #7c3aed; color: #ffffff; text-decoration: none; padding: 8px 18px; border-radius: 6px; font-weight: 600; font-size: 13px;">
                  Access Link / Subscription &rarr;
                </a>
               </div>`
            : ""
        }
        ${
          n.video_url
            ? `<div style="margin-top: 8px;">
                <a href="${n.video_url}" target="_blank" style="display: inline-block; background-color: #e11d48; color: #ffffff; text-decoration: none; padding: 8px 18px; border-radius: 6px; font-weight: 600; font-size: 13px;">
                  🎬 Watch Redemption Guide Video Tutorial &rarr;
                </a>
               </div>`
            : ""
        }
      </div>
    `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Order Delivery Details</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 600px; margin: 24px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 30px 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 0.5px;">SMART DIGITAL HUB</h1>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #c7d2fe; font-weight: 500;">Your Trusted Store for Digital Product Subscriptions</p>
          </div>

          <!-- Main Body -->
          <div style="padding: 28px 24px;">
            <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; text-align: center;">
              <span style="color: #065f46; font-weight: 700; font-size: 15px;">🎉 Your Order Has Been Successfully Delivered!</span>
            </div>

            <p style="font-size: 15px; color: #334155; margin-top: 0; line-height: 1.6;">
              Dear <strong>${params.customerName}</strong>,<br/>
              Your <strong>Smart Digital Hub</strong> order is ready. Below are your product access credentials and details:
            </p>

            <!-- Delivery Credentials Box -->
            <div style="margin: 24px 0;">
              <h3 style="font-size: 15px; font-weight: 700; color: #1e293b; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                📦 Delivery Information
              </h3>
              ${notesHtml}
            </div>

            <!-- Order Summary Table -->
            <div style="margin: 24px 0; background-color: #f8fafc; border-radius: 8px; padding: 16px; border: 1px solid #e2e8f0;">
              <h4 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase;">
                Order Summary (${params.orderId.slice(0, 8)})
              </h4>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                ${itemsHtml}
                <tr>
                  <td style="padding: 10px 0; font-weight: 700; color: #1e293b;">Total Amount</td>
                  <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #7c3aed; font-size: 16px;">
                    ৳${params.totalPrice}
                  </td>
                </tr>
              </table>
            </div>

            <!-- Important Instructions -->
            <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 14px; margin-top: 24px;">
              <h4 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #92400e;">⚠️ Important Guidelines:</h4>
              <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #78350f; line-height: 1.5;">
                <li>Do not change passwords or email settings if this is a shared or managed account.</li>
                <li>For any issues or warranty assistance, contact our WhatsApp support right away.</li>
              </ul>
            </div>

            <!-- Support Helpline -->
            <div style="margin-top: 28px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px;">
              <p style="font-size: 13px; color: #64748b; margin-bottom: 10px;">If you have any questions or need assistance, feel free to contact us:</p>
              <a href="https://wa.me/8801516524644" target="_blank" style="display: inline-block; background-color: #16a34a; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; font-size: 14px;">
                💬 WhatsApp Support (+8801516524644)
              </a>
            </div>

          </div>

          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
            &copy; ${new Date().getFullYear()} Smart Digital Hub. All rights reserved.
          </div>

        </div>
      </body>
    </html>
  `;
};

export const sendDeliveryEmail = async (params: DeliveryEmailParams): Promise<{ success: boolean; error?: string }> => {
  const settings = await getEmailSettings();
  if (!settings.apiKey) {
    return {
      success: false,
      error: "Resend API Key is missing. Please set your Resend API Key in Admin Email Settings.",
    };
  }

  try {
    const html = generateDeliveryHtml(params);
    const subject = `Your Smart Digital Hub Order is Delivered! (Order #${params.orderId.slice(0, 8)})`;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${settings.apiKey.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: settings.senderEmail.trim(),
        to: [params.recipientEmail.trim()],
        subject: subject,
        html: html,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      console.error("Resend API Error:", result);
      return {
        success: false,
        error: result?.message || result?.error || "Failed to send email via Resend API",
      };
    }

    return { success: true };
  } catch (err: any) {
    console.error("sendDeliveryEmail exception:", err);
    return {
      success: false,
      error: err?.message || "Network error while sending email",
    };
  }
};

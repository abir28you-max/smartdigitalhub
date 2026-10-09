import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://eybsbcaoboispmzuvjkw.supabase.co",
  "sb_publishable_os_8QleRlZQ3xNoQGnS38A_qK30c4Gb"
);

async function setSettings() {
  const { data, error } = await supabase.from("site_settings").upsert([
    { key: "telegram_bot_token", value: "8636262237:AAFLQWn9Nh1IlHf7aPRj2-OvFyZK-JFbV6E", updated_at: new Date().toISOString() },
    { key: "telegram_chat_id", value: "8944136914", updated_at: new Date().toISOString() },
  ]);

  console.log("Save site_settings result:", { data, error });
}

setSettings();

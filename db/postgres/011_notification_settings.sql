CREATE TABLE IF NOT EXISTS notification_settings (
  id TEXT PRIMARY KEY,
  target_email TEXT NOT NULL DEFAULT '',
  formspree_endpoint TEXT NOT NULL DEFAULT '',
  telegram_bot_token TEXT NOT NULL DEFAULT '',
  telegram_chat_id TEXT NOT NULL DEFAULT '',
  is_email_active BOOLEAN NOT NULL DEFAULT FALSE,
  is_telegram_active BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS target_email TEXT NOT NULL DEFAULT '';
ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS formspree_endpoint TEXT NOT NULL DEFAULT '';
ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS telegram_bot_token TEXT NOT NULL DEFAULT '';
ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT NOT NULL DEFAULT '';
ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS is_email_active BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS is_telegram_active BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

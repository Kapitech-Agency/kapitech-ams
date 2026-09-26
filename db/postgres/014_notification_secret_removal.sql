-- AMS PostgreSQL migration 014
-- Remove the legacy Telegram bot-token column from relational storage.
--
-- The bot token is an infrastructure secret and must remain runtime-managed
-- through KAPITECH_TELEGRAM_BOT_TOKEN. Existing persisted values are removed
-- by dropping the column.
BEGIN;

ALTER TABLE notification_settings
  DROP COLUMN IF EXISTS telegram_bot_token;

COMMIT;

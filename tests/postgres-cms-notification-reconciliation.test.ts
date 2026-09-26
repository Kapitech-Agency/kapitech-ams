import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('PostgreSQL importer includes CMS and notification configuration without importing Telegram secrets', async () => {
  const source = await fs.readFile(path.join(root, 'scripts/postgres-import.ts'), 'utf8');

  for (const table of ['cms_services', 'cms_projects', 'cms_testimonials', 'cms_settings', 'notification_settings']) {
    assert.match(source, new RegExp(table));
  }

  assert.match(source, /telegramChatId/);
  assert.doesNotMatch(source, /telegram_bot_token/);
  assert.doesNotMatch(source, /notificationSettings\.telegramBotToken/);
});

test('reconciliation checks CMS and notification configuration without exposing token values', async () => {
  const source = await fs.readFile(path.join(root, 'scripts/postgres-reconcile.ts'), 'utf8');

  assert.match(source, /cmsSettingsParity/);
  assert.match(source, /notificationSettingsParity/);
  assert.match(source, /hasTelegramToken/);
  assert.doesNotMatch(source, /telegram_bot_token/);
  assert.doesNotMatch(source, /console\.log\([^\n]*telegramBotToken/);
});

test('PostgreSQL notification settings use the fixed singleton id and do not read secrets from the database', async () => {
  const repository = await fs.readFile(path.join(root, 'server/postgres-notification-settings-repository.ts'), 'utf8');
  const databaseRepository = await fs.readFile(path.join(root, 'server/postgres-database-repository.ts'), 'utf8');

  assert.match(repository, /WHERE id = 1/);
  assert.match(repository, /VALUES \(1, \$1, \$2, \$3, \$4, \$5, NOW\(\)\)/);
  assert.doesNotMatch(repository, /telegram_bot_token/);
  assert.doesNotMatch(databaseRepository, /telegram_bot_token/);
});

test('migration 014 removes the legacy Telegram bot-token column', async () => {
  const migration = await fs.readFile(path.join(root, 'db/postgres/014_notification_secret_removal.sql'), 'utf8');
  assert.match(migration, /DROP COLUMN IF EXISTS telegram_bot_token/i);
});

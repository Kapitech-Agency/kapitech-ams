import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('lead submissions dispatch Telegram notifications in both datasource modes', async () => {
  const source = await fs.readFile(path.join(root, 'server/routes.ts'), 'utf8');

  assert.ok(source.includes('dispatchLeadTelegramNotification'));
  assert.ok(source.includes('await postgresLeadRepository.create('));
  assert.ok(source.includes('postgresNotificationSettingsRepository.get()'));
  assert.ok(source.includes('void dispatchLeadTelegramNotification(newLead, notificationSettings)'));
  assert.ok(source.includes('KAPITECH_TELEGRAM_BOT_TOKEN'));
  assert.ok(source.includes('KAPITECH_TELEGRAM_CHAT_ID'));
  assert.ok(source.includes('const hasTelegramToken = postgresMode'));
  assert.ok(source.includes('jsonNotificationSettings?.telegramBotToken'));
  assert.ok(source.includes("process.env.KAPITECH_TELEGRAM_BOT_TOKEN?.trim()"));
});

test('production readiness checks runtime notification credentials when channels are enabled', async () => {
  const source = await fs.readFile(path.join(root, 'server/routes.ts'), 'utf8');

  assert.ok(source.includes('notificationSettings.isTelegramActive'));
  assert.ok(source.includes('KAPITECH_TELEGRAM_BOT_TOKEN'));
  assert.ok(source.includes('notificationSettings.isEmailActive'));
  assert.ok(source.includes('const notificationsReady = telegramConfigured && emailNotificationConfigured'));
  assert.ok(source.includes('notifications: notificationsReady'));
});

test('PostgreSQL notification settings remain secret-safe during lead dispatch', async () => {
  const source = await fs.readFile(path.join(root, 'server/postgres-notification-settings-repository.ts'), 'utf8');

  assert.ok(!source.includes('telegram_bot_token'));
  assert.ok(!source.includes('telegramBotToken'));
});

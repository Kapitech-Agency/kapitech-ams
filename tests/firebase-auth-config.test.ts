import test from 'node:test';
import assert from 'node:assert/strict';
import { isFirebaseAuthEnabled } from '../server/firebase-token.ts';

test('Firebase authentication is disabled unless explicitly enabled', () => {
  const previous = process.env.KAPITECH_FIREBASE_AUTH_ENABLED;
  delete process.env.KAPITECH_FIREBASE_AUTH_ENABLED;
  assert.equal(isFirebaseAuthEnabled(), false);
  if (previous === undefined) delete process.env.KAPITECH_FIREBASE_AUTH_ENABLED;
  else process.env.KAPITECH_FIREBASE_AUTH_ENABLED = previous;
});

test('Firebase authentication enable flag accepts only true', () => {
  const previous = process.env.KAPITECH_FIREBASE_AUTH_ENABLED;
  process.env.KAPITECH_FIREBASE_AUTH_ENABLED = 'true';
  assert.equal(isFirebaseAuthEnabled(), true);
  process.env.KAPITECH_FIREBASE_AUTH_ENABLED = '1';
  assert.equal(isFirebaseAuthEnabled(), false);
  if (previous === undefined) delete process.env.KAPITECH_FIREBASE_AUTH_ENABLED;
  else process.env.KAPITECH_FIREBASE_AUTH_ENABLED = previous;
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { api, apiRequest } from '../src/lib/apiClient.ts';

async function withTimedOutRequest<T>(run: () => Promise<T>): Promise<T> {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const originalFetch = globalThis.fetch;

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      setTimeout: (callback: () => void) => {
        callback();
        return 1;
      },
      clearTimeout: () => {}
    }
  });

  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    assert.equal(init?.signal?.aborted, true, 'the timeout should abort the request');
    throw Object.assign(new Error('The request was aborted.'), { name: 'AbortError' });
  }) as typeof fetch;

  try {
    return await run();
  } finally {
    globalThis.fetch = originalFetch;
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
    else delete (globalThis as typeof globalThis & { window?: Window }).window;
  }
}

test('timed-out mutating requests report an unknown outcome rather than inviting a blind retry', async () => {
  const response = await withTimedOutRequest(() => apiRequest('/finance/invoices', {
    method: 'POST',
    body: JSON.stringify({ clientId: 'isolated-test-client' })
  }));

  assert.equal(response.success, false);
  assert.equal(
    response.error,
    'The server response was not received. The operation may have completed; check its current status before retrying.'
  );
  assert.doesNotMatch(response.error || '', /please try again/i);
});

test('read request timeout retains a retry-appropriate message', async () => {
  const response = await withTimedOutRequest(() => apiRequest('/finance/invoices'));

  assert.equal(response.success, false);
  assert.equal(response.error, 'Request timed out. Please try again.');
});

test('timed-out document uploads instruct the operator to inspect the vault before retrying', async () => {
  const response = await withTimedOutRequest(() =>
    api.documents.uploadContent('isolated-test-document', new Blob(['test upload content'], { type: 'text/plain' }))
  );

  assert.equal(response.success, false);
  assert.equal(
    response.error,
    'The upload result could not be confirmed. Check the document list before retrying to avoid duplicate or orphaned files.'
  );
  assert.doesNotMatch(response.error || '', /please try again/i);
});

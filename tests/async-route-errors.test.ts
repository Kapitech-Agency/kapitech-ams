import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { installRouterErrorForwarding, withAsyncErrorForwarding } from '../server/async-route-errors.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('router registration forwards asynchronous handler rejections to next(error)', async () => {
  let registeredHandler: ((...args: any[]) => any) | undefined;
  const fakeRouter = {
    get(...args: any[]) {
      registeredHandler = args[1];
      return this;
    }
  };

  installRouterErrorForwarding(fakeRouter);
  fakeRouter.get('/health-probe', async () => {
    throw new Error('database temporarily unavailable');
  });

  assert.equal(typeof registeredHandler, 'function');
  let received: unknown;
  await registeredHandler!({}, {}, (error: unknown) => { received = error; });
  assert.ok(received instanceof Error);
  assert.equal((received as Error).message, 'database temporarily unavailable');
});

test('router registration forwards synchronous handler exceptions to next(error)', () => {
  let registeredHandler: ((...args: any[]) => any) | undefined;
  const fakeRouter = {
    post(...args: any[]) {
      registeredHandler = args[1];
      return this;
    }
  };

  installRouterErrorForwarding(fakeRouter);
  fakeRouter.post('/mutation-probe', () => {
    throw new Error('synchronous route failure');
  });

  let received: unknown;
  registeredHandler!({}, {}, (error: unknown) => { received = error; });
  assert.ok(received instanceof Error);
  assert.equal((received as Error).message, 'synchronous route failure');
});

test('router registration handles handler arrays and preserves nested Express routers', async () => {
  let registeredHandler: ((...args: any[]) => any) | undefined;
  const nestedRouter = Object.assign(() => undefined, { handle() {} });
  let registeredNested: unknown;
  const fakeRouter = {
    use(...args: any[]) {
      registeredHandler = args[1][0];
      registeredNested = args[2];
      return this;
    }
  };

  installRouterErrorForwarding(fakeRouter);
  fakeRouter.use('/nested', [async () => { throw new Error('array middleware failure'); }], nestedRouter);

  let received: unknown;
  await registeredHandler!({}, {}, (error: unknown) => { received = error; });
  assert.equal((received as Error)?.message, 'array middleware failure');
  assert.equal(registeredNested, nestedRouter);
});

test('AMS installs async error forwarding before registering private API routes', async () => {
  const source = await fs.readFile(path.join(root, 'server/routes.ts'), 'utf8');
  const declaration = source.indexOf('export const apiRouter = Router();');
  const forwarding = source.indexOf('installRouterErrorForwarding(apiRouter)');
  const firstMiddleware = source.indexOf('apiRouter.use(authenticate)');

  assert.ok(declaration >= 0);
  assert.ok(forwarding > declaration);
  assert.ok(firstMiddleware > forwarding);
});


test('wrapped Express error middleware retains its four-argument signature', () => {
  const errorHandler = async (_error: unknown, _req: unknown, _res: unknown, _next: unknown) => undefined;
  const wrapped = withAsyncErrorForwarding(errorHandler);
  assert.equal(wrapped.length, 4);
});

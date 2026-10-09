type AnyHandler = (...args: any[]) => any;

function invokeWithForwarding(handler: AnyHandler, context: unknown, args: any[]): unknown {
  const next = args[args.length - 1];
  let result: unknown;

  try {
    result = handler.apply(context, args);
  } catch (error) {
    if (typeof next === 'function') return next(error);
    throw error;
  }

  if (result && typeof (result as { then?: unknown }).then === 'function') {
    return Promise.resolve(result).catch((error) => {
      if (typeof next === 'function') return next(error);
      throw error;
    });
  }

  return result;
}

/** Forward handler failures to Express 4's next(error) without changing middleware arity. */
export function withAsyncErrorForwarding<T extends AnyHandler>(handler: T): T {
  // Express identifies error middleware by Function.length === 4.
  switch (handler.length) {
    case 4:
      return function errorForwardingHandler(error: unknown, req: unknown, res: unknown, next: unknown) {
        return invokeWithForwarding(handler, this, [error, req, res, next]);
      } as T;
    case 3:
      return function errorForwardingHandler(req: unknown, res: unknown, next: unknown) {
        return invokeWithForwarding(handler, this, [req, res, next]);
      } as T;
    case 2:
      return function errorForwardingHandler(req: unknown, res: unknown) {
        return invokeWithForwarding(handler, this, Array.from(arguments));
      } as T;
    case 1:
      return function errorForwardingHandler(req: unknown) {
        return invokeWithForwarding(handler, this, Array.from(arguments));
      } as T;
    default:
      return function errorForwardingHandler(...args: any[]) {
        return invokeWithForwarding(handler, this, args);
      } as T;
  }
}

function wrapRegistrationArgument(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(wrapRegistrationArgument);
  if (typeof value !== 'function') return value;

  // Express apps and routers are callable functions too; keep them unchanged.
  if (typeof (value as { handle?: unknown }).handle === 'function') return value;
  return withAsyncErrorForwarding(value as AnyHandler);
}

export function installRouterErrorForwarding(router: object): void {
  const target = router as Record<string, any>;
  const methods = ['use', 'all', 'get', 'post', 'put', 'patch', 'delete', 'options', 'head'] as const;

  for (const method of methods) {
    const original = target[method];
    if (typeof original !== 'function') continue;

    target[method] = (...args: unknown[]) =>
      original.apply(router, args.map(wrapRegistrationArgument));
  }
}

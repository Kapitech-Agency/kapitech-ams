type AnyHandler = (...args: any[]) => any;

/** Forward handler failures to Express 4's next(error). */
export function withAsyncErrorForwarding<T extends AnyHandler>(handler: T): T {
  return function errorForwardingHandler(this: unknown, ...args: any[]) {
    const next = args[args.length - 1];
    let result: unknown;

    try {
      result = handler.apply(this, args);
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
  } as T;
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

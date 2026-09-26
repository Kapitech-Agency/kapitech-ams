import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { URL } from 'node:url';
import { apiRouter } from './server/routes';
import { getDataSourceMode } from './server/data-source.ts';
import { checkPostgresConnection, closePostgresPool } from './server/postgres.ts';
import { postgresAuthRepository } from './server/postgres-repository.ts';
import { ensurePostgresInitialAdmin } from './server/postgres-bootstrap.ts';
import { ensurePostgresCmsDefaults } from './server/postgres-cms-bootstrap.ts';
import { runPostgresMigrations } from './server/postgres-migrations.ts';
import { flushAuditLogWrites, isDataEncryptionEnabled } from './server/db.ts';

dotenv.config();

function validateProductionDataSource(): string | null {
  if (process.env.NODE_ENV !== 'production') return null;

  const mode = (process.env.KAPITECH_DATA_SOURCE || '').trim().toLowerCase();
  if (mode !== 'postgres') {
    return 'Production runtime requires KAPITECH_DATA_SOURCE=postgres.';
  }

  const postgresUrl = process.env.KAPITECH_POSTGRES_URL?.trim();
  if (!postgresUrl) {
    return 'Production runtime requires KAPITECH_POSTGRES_URL.';
  }

  try {
    const parsed = new URL(postgresUrl);
    if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
      return 'KAPITECH_POSTGRES_URL must use postgres:// or postgresql://.';
    }
    if (!parsed.hostname || !parsed.pathname || parsed.pathname === '/') {
      return 'KAPITECH_POSTGRES_URL must include a PostgreSQL host and database name.';
    }
  } catch {
    return 'KAPITECH_POSTGRES_URL is invalid. Use postgresql://USER:PASSWORD@HOST:PORT/DATABASE and URL-encode special characters in the username/password.';
  }

  if (!process.env.KAPITECH_DATA_ENCRYPTION_KEY?.trim()) {
    return 'Production runtime requires KAPITECH_DATA_ENCRYPTION_KEY.';
  }

  try {
    isDataEncryptionEnabled();
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }

  return null;
}

async function startServer() {
  const productionConfigError = validateProductionDataSource();

  const app = express();
  let shuttingDown = false;
  let postgresReady = getDataSourceMode() !== 'postgres' && !productionConfigError;
  let postgresStartupError: string | null = productionConfigError;
  let postgresInitializationInFlight = false;

  const initializePostgres = async (): Promise<void> => {
    if (postgresInitializationInFlight || postgresReady || productionConfigError) return;
    postgresInitializationInFlight = true;
    try {
      await runPostgresMigrations();
      await ensurePostgresInitialAdmin();
      await ensurePostgresCmsDefaults();
      const migratedMfaSecrets = await postgresAuthRepository.migrateLegacyMfaSecrets();
      if (migratedMfaSecrets > 0) {
        console.log(`[Security] Re-encrypted ${migratedMfaSecrets} legacy PostgreSQL MFA secret record(s).`);
      }
      postgresReady = true;
      postgresStartupError = null;
      console.log('[Kapitech AMS] PostgreSQL runtime is ready.');
    } catch (error) {
      postgresReady = false;
      postgresStartupError = error instanceof Error ? error.message : String(error);
      console.error('[Kapitech AMS] PostgreSQL initialization failed. Web runtime remains online and will retry.', error);
    } finally {
      postgresInitializationInFlight = false;
    }
  };
  app.disable('x-powered-by');
  const PORT = Number(process.env.PORT) || 3000;

  // Hostinger/reverse-proxy aware client IP handling for rate limiting and audit logs.
  app.set('trust proxy', 1);

  // Reject new requests while graceful shutdown drains in-flight work and audit writes.
  app.use((_req, res, next) => {
    if (!shuttingDown) {
      next();
      return;
    }
    res.setHeader('Connection', 'close');
    res.status(503).json({ success: false, error: 'Server is shutting down. Please retry shortly.' });
  });

  // Security Headers Middleware
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), usb=()');
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

    if (process.env.NODE_ENV === 'production') {
      res.setHeader(
        'Content-Security-Policy',
        [
          "default-src 'self'",
          "script-src 'self'",
          "style-src 'self' 'unsafe-inline'",
          "font-src 'self' data:",
          "img-src 'self' data: blob: https:",
          "connect-src 'self'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'none'",
          "upgrade-insecure-requests"
        ].join('; ')
      );
      if (req.secure) {
        res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
      }
    }
    next();
  });

  // Binary private-document uploads are parsed before the JSON body parser.
  // The vault route is authenticated again inside apiRouter, and files are stored outside public static assets.
  app.put('/api/documents/:id/content', express.raw({ type: () => true, limit: '25mb' }));

  // Body parsers
  app.use(express.json({ limit: '512kb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Prevent browsers and intermediary caches from storing authenticated API responses.
  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });

  // Keep the private AMS surface out of search indexes and intermediary caches.
  app.use((req, res, next) => {
    if (req.path === '/admin' || req.path.startsWith('/admin/') || req.path === '/api' || req.path.startsWith('/api/')) {
      res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    }
    next();
  });

  // Health check
  app.get('/api/health', async (_req, res) => {
    if (productionConfigError) {
      res.status(503).json({
        status: 'error',
        version: process.env.APP_VERSION || '2.6.0-enterprise',
        services: {
          application: 'healthy',
          database: 'misconfigured',
          dataSource: 'invalid',
          auth: 'blocked'
        },
        message: productionConfigError
      });
      return;
    }
    try {
      const dataSource = getDataSourceMode();
      let databaseStatus: 'connected' | 'unavailable' = 'connected';
      let databaseLatencyMs: number | undefined;

      if (dataSource === 'postgres') {
        if (!postgresReady) {
          res.status(503).json({
            status: 'starting',
            version: process.env.APP_VERSION || '2.6.0-enterprise',
            services: {
              application: 'healthy',
              database: 'initializing',
              dataSource,
              auth: 'waiting'
            },
            retryAfterSeconds: 10,
            message: postgresStartupError || 'PostgreSQL runtime is initializing.'
          });
          return;
        }
        const postgresHealth = await checkPostgresConnection();
        databaseLatencyMs = postgresHealth.latencyMs;
      } else {
        const { getDatabase } = await import('./server/db');
        getDatabase();
      }

      res.json({
        status: 'ok',
        version: process.env.APP_VERSION || '2.6.0-enterprise',
        services: {
          application: 'healthy',
          database: databaseStatus,
          dataSource,
          databaseLatencyMs,
          auth: 'operational'
        },
        time: new Date().toISOString()
      });
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(503).json({
        status: 'error',
        services: {
          application: 'degraded',
          database: 'unavailable',
          auth: 'unknown'
        },
        message: 'Health check failed'
      });
    }
  });

  // Keep the web shell online while PostgreSQL initializes or recovers.
  app.use('/api', (req, res, next) => {
    if (req.path === '/health') {
      next();
      return;
    }
    if (productionConfigError) {
      res.status(503).json({
        success: false,
        code: 'PRODUCTION_DATA_SOURCE_MISCONFIGURED',
        error: 'Production API is disabled until the PostgreSQL configuration is corrected.'
      });
      return;
    }
    if (getDataSourceMode() === 'postgres' && !postgresReady) {
      res.setHeader('Retry-After', '10');
      res.status(503).json({
        success: false,
        code: 'DATABASE_STARTING',
        error: 'The application is online, but PostgreSQL is still initializing. Please retry shortly.'
      });
      return;
    }
    next();
  });

  // API Routes
  app.use('/api', apiRouter);

  // Keep unknown API routes as JSON 404s instead of letting SPA fallback return index.html.
  app.use('/api', (_req, res) => {
    res.status(404).json({ success: false, error: 'API route not found.' });
  });

  // Vite middleware in dev, static files in prod
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');

    // Never expose backend bundles or source maps as public static assets.
    app.use((req, res, next) => {
      if (req.path === '/server.cjs' || req.path.endsWith('.map')) {
        res.status(404).end();
        return;
      }
      next();
    });

    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Kapitech AMS Server] Running on http://0.0.0.0:${PORT}`);

    if (getDataSourceMode() === 'postgres' && !productionConfigError) {
      void initializePostgres();
      const retryTimer = setInterval(() => {
        if (postgresReady) {
          clearInterval(retryTimer);
          return;
        }
        void initializePostgres();
      }, 10_000);
      retryTimer.unref();
    }
  });

  const SHUTDOWN_TIMEOUT_MS = 10_000;
  let shutdownStarted = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (shutdownStarted) return;
    shutdownStarted = true;
    shuttingDown = true;
    console.info(`[Kapitech AMS] Received ${signal}; waiting for in-flight requests and audit writes.`);

    const forceExitTimer = setTimeout(() => {
      console.error('[Kapitech AMS] Graceful shutdown timed out.');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExitTimer.unref();

    try {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
      });
      if (getDataSourceMode() === 'postgres') {
        await flushAuditLogWrites();
        await closePostgresPool();
      }
      clearTimeout(forceExitTimer);
      process.exit(0);
    } catch (error) {
      clearTimeout(forceExitTimer);
      console.error('[Kapitech AMS] Graceful shutdown failed:', error);
      process.exit(1);
    }
  };

  process.once('SIGTERM', () => { void shutdown('SIGTERM'); });
  process.once('SIGINT', () => { void shutdown('SIGINT'); });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

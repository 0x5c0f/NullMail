import express from 'express';
import http, { IncomingMessage } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { setupSocketIO } from './modules/io.js';
import { startSmtp } from './modules/smtp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function normalizeOrigin(origin: string): string | null {
  try {
    const url = new URL(origin);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }
    return url.origin.toLowerCase();
  } catch {
    return null;
  }
}

function inferRequestOrigin(req: IncomingMessage): string | null {
  const host = typeof req.headers.host === 'string' ? req.headers.host : undefined;
  if (!host) {
    return null;
  }

  const forwardedProtoHeader = req.headers['x-forwarded-proto'];
  const forwardedProto = Array.isArray(forwardedProtoHeader)
    ? forwardedProtoHeader[0]
    : forwardedProtoHeader;
  const protocol = forwardedProto?.split(',')[0].trim() || 'http';

  return normalizeOrigin(`${protocol}://${host}`);
}

function buildAllowedOrigins(): Set<string> {
  const allowed = new Set<string>();

  for (const origin of config.web.allowedOrigins) {
    const normalized = normalizeOrigin(origin);
    if (normalized) {
      allowed.add(normalized);
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    const devOrigins = [
      `http://localhost:${config.web.port}`,
      `http://127.0.0.1:${config.web.port}`,
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ];

    for (const origin of devOrigins) {
      const normalized = normalizeOrigin(origin);
      if (normalized) {
        allowed.add(normalized);
      }
    }
  }

  return allowed;
}

function isAllowedSocketOrigin(origin: string | undefined, req: IncomingMessage, allowedOrigins: Set<string>): boolean {
  if (!origin) {
    return true;
  }

  const normalizedOrigin = normalizeOrigin(origin);
  if (!normalizedOrigin) {
    return false;
  }

  if (allowedOrigins.has(normalizedOrigin)) {
    return true;
  }

  const requestOrigin = inferRequestOrigin(req);
  return requestOrigin === normalizedOrigin;
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const allowedOrigins = buildAllowedOrigins();

  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Permissions-Policy', 'accelerometer=(), camera=(), geolocation=(), microphone=()');
    next();
  });
  
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }

        const normalizedOrigin = normalizeOrigin(origin);
        callback(null, Boolean(normalizedOrigin && allowedOrigins.has(normalizedOrigin)));
      },
      methods: ['GET', 'POST'],
    },
    allowRequest: (req, callback) => {
      const origin = typeof req.headers.origin === 'string' ? req.headers.origin : undefined;
      callback(null, isAllowedSocketOrigin(origin, req, allowedOrigins));
    },
  });

  // Setup Socket.io
  setupSocketIO(io);

  // API Routes
  app.get('/api/config', (req, res) => {
    res.json({
      mailDomain: config.web.domain,
      securityNotice: config.securityNotice,
    });
  });

  // Vite integration for development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
      configFile: path.join(__dirname, '../vite.config.ts'),
      root: path.join(__dirname, 'client'),
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const publicPath = path.join(__dirname, '../dist/client');
    app.use(express.static(publicPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(publicPath, 'index.html'));
    });
  }

  // Start services
  server.listen(config.web.port, '0.0.0.0', () => {
    console.log(`Web server running on http://0.0.0.0:${config.web.port}`);
    startSmtp();
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});

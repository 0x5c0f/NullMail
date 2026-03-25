import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { config } from './config.js';
import { setupSocketIO } from './modules/io.js';
import { startSmtp } from './modules/smtp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  // CORS Configuration
  const envOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : [];
  
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        // 1. Always allow if origin is missing (e.g. same-origin or non-browser)
        if (!origin) return callback(null, true);
        
        // 2. Check whitelist (localhost, APP_URL, user-defined)
        const whitelist = [
          process.env.APP_URL,
          'http://localhost:3000',
          'http://127.0.0.1:3000',
          ...envOrigins
        ].filter(Boolean) as string[];

        if (whitelist.some(w => w.includes(origin))) return callback(null, true);

        // 3. Automatically allow platform domains (*.run.app)
        if (origin.endsWith('.run.app')) return callback(null, true);

        // 4. Default to allow all if no strict origins are set, otherwise deny
        if (envOrigins.length === 0) return callback(null, true);
        
        callback(null, false); // Deny others if whitelist is active
      },
      methods: ["GET", "POST"]
    }
  });

  // Setup Socket.io
  setupSocketIO(io);

  // API Routes
  app.get('/api/config', (req, res) => {
    res.json({ securityNotice: config.securityNotice });
  });

  // Vite integration for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
      root: path.join(__dirname, '../'), // Point to project root for vite.config.ts
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

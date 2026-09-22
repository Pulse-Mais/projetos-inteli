import path from 'path';
import express from 'express';
import cors from 'cors';
import api from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { NotFoundError } from './errors/AppError';

export function createApp() {
  const app = express();

  // Log de requisições no terminal: método, rota, status HTTP e duração.
  // Desativado em testes para não poluir a saída do Jest/Supertest.
  if (process.env.NODE_ENV !== 'test') {
    app.use((req, res, next) => {
      const inicio = Date.now();
      res.on('finish', () => {
        console.log(`${req.method} ${req.originalUrl} → ${res.statusCode} (${Date.now() - inicio}ms)`);
      });
      next();
    });
  }

  app.use(cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);

      const localOrigin =
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

      const cloudflareOrigin =
        /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/.test(origin);

      if (localOrigin || cloudflareOrigin) {
        return cb(null, true);
      }

      cb(new Error(`CORS: origem não permitida: ${origin}`));
    },

    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],

    allowedHeaders: ['Content-Type', 'Authorization'],

    credentials: true,

  }));

  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api', api);

  // Frontend estático (páginas em src/view, copiadas para dist/view no build).
  // Resolvido a partir de __dirname, funciona tanto em dev (ts-node em src/)
  // quanto em produção (node em dist/).
  const viewDir = path.join(__dirname, 'view');
  app.use(express.static(viewDir));
  app.get('/', (_req, res) => res.redirect('/dashboard.html'));

  app.use((_req, _res, next) => next(new NotFoundError('rota')));

  app.use(errorHandler);

  return app;
}
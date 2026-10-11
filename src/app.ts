import express from 'express';
import cors from 'cors';

import routes from './routes';
import adminRoutes from './routes/adminRoutes';
import { errorHandler } from './lib/http';
import { UPLOAD_DIR } from './lib/uploads';

const app = express();

// ─── Middleware ──────────────────────────────────────────────────────────────
// Allowed browser origins for the admin dashboard. The mobile app is native and
// sends no Origin header, so those requests are always allowed. Add more via the
// CORS_ORIGINS env var (comma-separated), or set CORS_ORIGINS=* to allow all.
const ALLOWED_ORIGINS = [
  'http://localhost:5273',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://56.228.42.75:3000',
  'http://56.228.42.75:5273',
  'http://56.228.42.75:5173',
  'http://56.228.42.75:4173',
  'http://56.228.42.75',
  ...(process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) ?? []),
];
const ALLOW_ALL = ALLOWED_ORIGINS.includes('*') || process.env.CORS_ORIGINS === '*';

app.use(
  cors({
    origin(origin, cb) {
      // No Origin header → native app / curl / server-to-server → allow.
      if (!origin || ALLOW_ALL || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use(express.json({ limit: '10mb' })); // photos are sent as data URIs

// ─── Static: uploaded photos served from the server folder ───────────────────
app.use('/uploads', express.static(UPLOAD_DIR));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/admin', adminRoutes);
app.use('/admin', adminRoutes);
app.use('/api', routes);
app.use('/', routes);

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `API route not found: ${req.method} ${req.path}` });
});

// ─── Error handler ───────────────────────────────────────────────────────────
app.use(errorHandler);

export default app;

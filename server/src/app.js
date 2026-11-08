const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');

const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');

const app = express();

// Security HTTP headers
app.use(helmet());

// Dynamic Cross-Origin Resource Sharing (CORS)
// Reads CLIENT_URL from environment (supports single URL, comma-separated URLs, or '*')
// Automatically preserves local development hosts so you can deploy without breaking local tests
const getDynamicCorsOrigins = () => {
  const envUrl = process.env.CLIENT_URL || '';
  const configured = envUrl
    .split(',')
    .map((url) => url.trim().replace(/\/$/, ''))
    .filter(Boolean);

  const localDefaults = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174'
  ];

  return Array.from(new Set([...configured, ...localDefaults]));
};

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      const allowed = getDynamicCorsOrigins();
      const normalizedOrigin = origin.replace(/\/$/, '');

      // Allow if wildcard configured, origin is explicitly in allowed list, or ends with vercel.app preview
      if (
        allowed.includes('*') ||
        allowed.includes(normalizedOrigin) ||
        (process.env.NODE_ENV !== 'production' && normalizedOrigin.includes('localhost'))
      ) {
        return callback(null, true);
      }

      console.warn(`[CORS Blocked]: Origin '${origin}' is not in allowed CLIENT_URL list`);
      return callback(new Error(`CORS blocked request from origin: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Data sanitization against NoSQL query injection (Express 5 compatible in-place sanitization)
app.use((req, res, next) => {
  ['body', 'params', 'headers', 'query'].forEach((key) => {
    if (req[key]) {
      mongoSanitize.sanitize(req[key]);
    }
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// API Routes
app.use('/api/v1', routes);

// 404 and global error handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

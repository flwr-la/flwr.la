import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import * as Sentry from '@sentry/node';

import { validateEnv } from './config/env.validation';
import { logger, logRequest } from './utils/logger';
import { connectDatabase } from './utils/database';
import { WebSocketHandler } from './websocket/handler';
import { QueueProcessor } from './queue/processor';
import { BloomEngine } from './core/bloom-engine';
import { metricsMiddleware, metricsHandler, healthCheck } from './monitoring/metrics';
import { errorHandler } from './middleware/error';
import { authenticate, rateLimit } from './middleware/auth';

// Routes
import flowerRoutes from './api/routes/flowers';
import userRoutes from './api/routes/users';
import authRoutes from './api/routes/auth';

// Load and validate environment variables
dotenv.config();
const env = validateEnv();

// Initialize Sentry
if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app: express() }),
    ],
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
  });
}

const app = express();
const server = createServer(app);
const PORT = env.PORT || 3000;

// Initialize core services
const bloomEngine = new BloomEngine();
const websocketHandler = new WebSocketHandler(server, bloomEngine);
const queueProcessor = new QueueProcessor(bloomEngine);

// Global middleware
app.use(Sentry.Handlers.requestHandler());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));
app.use(compression());
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging and metrics
app.use(logRequest);
app.use(metricsMiddleware);

// Health and metrics endpoints (no auth required)
app.get('/health', healthCheck);
app.get('/metrics', metricsHandler);

// API version prefix
const apiV1 = express.Router();

// Public routes
apiV1.use('/auth', authRoutes);

// Protected routes
apiV1.use('/users', authenticate, rateLimit, userRoutes);
apiV1.use('/flowers', authenticate, rateLimit, flowerRoutes);

// Mount API router
app.use('/api/v1', apiV1);

// Error handling
app.use(Sentry.Handlers.errorHandler());
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Resource not found',
    },
  });
});

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Received shutdown signal, starting graceful shutdown...');

  // Stop accepting new connections
  server.close(() => {
    logger.info('HTTP server closed');
  });

  // Close database connections
  // await closeDatabase();

  // Close Redis connections
  // await redisClient.quit();

  // Wait for ongoing requests to complete (max 30s)
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Database connected');

    // Start queue processors
    logger.info('Queue processors started');

    // Start server
    server.listen(PORT, () => {
      logger.info(`🌸 flwr.la blooming on port ${PORT} in ${env.NODE_ENV} mode`);
      logger.info(`WebSocket server ready`);
      logger.info(`Metrics available at /metrics`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

startServer();

export { app, server, bloomEngine };

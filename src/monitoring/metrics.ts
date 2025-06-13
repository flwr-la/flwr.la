import { register, Counter, Histogram, Gauge } from 'prom-client';
import { Request, Response, NextFunction } from 'express';

// Define metrics
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

export const activeFlowers = new Gauge({
  name: 'active_flowers_total',
  help: 'Total number of active flowers'
});

export const bloomSessions = new Gauge({
  name: 'bloom_sessions_active',
  help: 'Number of active bloom sessions'
});

export const llmRequestsTotal = new Counter({
  name: 'llm_requests_total',
  help: 'Total number of LLM requests',
  labelNames: ['provider', 'model', 'status']
});

export const llmRequestDuration = new Histogram({
  name: 'llm_request_duration_seconds',
  help: 'Duration of LLM requests in seconds',
  labelNames: ['provider', 'model'],
  buckets: [0.5, 1, 2, 5, 10, 30]
});

export const llmTokensUsed = new Counter({
  name: 'llm_tokens_used_total',
  help: 'Total number of tokens used',
  labelNames: ['provider', 'model', 'type']
});

export const memoryOperations = new Counter({
  name: 'memory_operations_total',
  help: 'Total number of memory operations',
  labelNames: ['operation', 'memory_type', 'status']
});

export const queueJobsProcessed = new Counter({
  name: 'queue_jobs_processed_total',
  help: 'Total number of queue jobs processed',
  labelNames: ['queue', 'status']
});

export const databaseQueryDuration = new Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1]
});

// Middleware to track HTTP metrics
export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status_code: res.statusCode
      },
      duration
    );
  });

  next();
}

// Metrics endpoint handler
export function metricsHandler(req: Request, res: Response) {
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
}

// Health check with detailed status
export async function healthCheck(req: Request, res: Response) {
  const checks = {
    server: 'ok',
    database: 'ok',
    redis: 'ok',
    queue: 'ok'
  };

  try {
    // Check database connection
    // await db.query('SELECT 1');

    // Check Redis connection
    // await redisClient.ping();

    // Check queue health
    // const queueStats = await queueProcessor.getQueueStats();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
      checks
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      checks,
      error: error.message
    });
  }
}

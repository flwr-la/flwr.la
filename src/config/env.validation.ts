import Joi from 'joi';

export const envSchema = Joi.object({
  // Server
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  API_VERSION: Joi.string().default('v1'),

  // Security
  JWT_SECRET: Joi.string().required().min(32),
  JWT_EXPIRY: Joi.string().default('7d'),
  BCRYPT_ROUNDS: Joi.number().default(10),
  RATE_LIMIT_MAX: Joi.number().default(100),
  CORS_ORIGIN: Joi.string().default('*'),

  // Database
  DATABASE_URL: Joi.string().required(),
  DATABASE_SSL: Joi.boolean().default(true),
  DATABASE_POOL_SIZE: Joi.number().default(10),

  // Redis
  REDIS_URL: Joi.string().required(),
  REDIS_PASSWORD: Joi.string().allow(''),
  REDIS_TLS: Joi.boolean().default(false),

  // LLM Providers
  OPENAI_API_KEY: Joi.string().required(),
  OPENAI_ORG_ID: Joi.string().allow(''),
  ANTHROPIC_API_KEY: Joi.string().required(),

  // Storage
  STORAGE_TYPE: Joi.string().valid('local', 's3', 'gcs').default('local'),
  S3_BUCKET: Joi.string().when('STORAGE_TYPE', {
    is: 's3',
    then: Joi.required()
  }),
  S3_REGION: Joi.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: Joi.string().when('STORAGE_TYPE', {
    is: 's3',
    then: Joi.required()
  }),
  AWS_SECRET_ACCESS_KEY: Joi.string().when('STORAGE_TYPE', {
    is: 's3',
    then: Joi.required()
  }),

  // Monitoring
  SENTRY_DSN: Joi.string().allow(''),
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info'),
  METRICS_ENABLED: Joi.boolean().default(true),

  // Email
  SMTP_HOST: Joi.string().allow(''),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().allow(''),
  SMTP_PASS: Joi.string().allow(''),
  EMAIL_FROM: Joi.string().default('noreply@flwr.la')
}).unknown();

export function validateEnv() {
  const { error, value } = envSchema.validate(process.env);

  if (error) {
    throw new Error(`Environment validation failed: ${error.message}`);
  }

  return value;
}

import * as Joi from 'joi';

export interface EnvironmentVariables {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  API_PREFIX: string;
  FRONTEND_ORIGINS: string;
  MYSQL_HOST: string;
  MYSQL_PORT: number;
  MYSQL_DATABASE: string;
  MYSQL_USER: string;
  MYSQL_PASSWORD: string;
  JWT_ACCESS_SECRET: string;
  JWT_ACCESS_TTL: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_TTL: string;
  PASSWORD_RESET_TTL_MINUTES: number;
  RESET_PASSWORD_URL: string;
  SMTP_ENABLED: boolean;
  SMTP_HOST?: string;
  SMTP_PORT: number;
  SMTP_SECURE: boolean;
  SMTP_USER?: string;
  SMTP_PASSWORD?: string;
  SMTP_FROM?: string;
}

export function validateEnvironment(config: Record<string, unknown>): EnvironmentVariables {
  const schema = Joi.object<EnvironmentVariables>({
    NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
    PORT: Joi.number().port().default(3001),
    API_PREFIX: Joi.string().default('api/v1'),
    FRONTEND_ORIGINS: Joi.string().default('http://localhost:5173'),
    MYSQL_HOST: Joi.string().hostname().required(),
    MYSQL_PORT: Joi.number().port().default(3306),
    MYSQL_DATABASE: Joi.string().max(64).required(),
    MYSQL_USER: Joi.string().max(32).required(),
    MYSQL_PASSWORD: Joi.string().min(1).required(),
    JWT_ACCESS_SECRET: Joi.string().min(32).required(),
    JWT_ACCESS_TTL: Joi.string()
      .pattern(/^\d+[smhd]$/)
      .default('15m'),
    JWT_REFRESH_SECRET: Joi.string().min(32).required(),
    JWT_REFRESH_TTL: Joi.string()
      .pattern(/^\d+[smhd]$/)
      .default('30d'),
    PASSWORD_RESET_TTL_MINUTES: Joi.number().integer().min(5).max(1440).default(30),
    RESET_PASSWORD_URL: Joi.string()
      .uri({ scheme: ['http', 'https'] })
      .default('http://localhost:5173/reinitialiser-mot-de-passe'),
    SMTP_ENABLED: Joi.boolean().default(false),
    SMTP_HOST: Joi.when('SMTP_ENABLED', {
      is: true,
      then: Joi.string().hostname().required(),
      otherwise: Joi.string().hostname().optional(),
    }),
    SMTP_PORT: Joi.number().port().default(587),
    SMTP_SECURE: Joi.boolean().default(false),
    SMTP_USER: Joi.when('SMTP_ENABLED', {
      is: true,
      then: Joi.string().min(1).required(),
      otherwise: Joi.string().optional(),
    }),
    SMTP_PASSWORD: Joi.when('SMTP_ENABLED', {
      is: true,
      then: Joi.string().min(1).required(),
      otherwise: Joi.string().optional(),
    }),
    SMTP_FROM: Joi.when('SMTP_ENABLED', {
      is: true,
      then: Joi.string().min(3).max(320).required(),
      otherwise: Joi.string().max(320).optional(),
    }),
  }).unknown(true);

  const { error, value } = schema.validate(config, { abortEarly: false });
  if (error) {
    throw new Error(`Variables d'environnement invalides : ${error.message}`);
  }

  return value;
}

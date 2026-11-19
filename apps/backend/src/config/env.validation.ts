const MIN_PRODUCTION_SECRET_LENGTH = 32;

// Fails fast on boot instead of on the first request that needs a variable.
export function validateEnv(config: Record<string, unknown>) {
  const errors: string[] = [];
  const isProduction = config.NODE_ENV === 'production';

  if (typeof config.DATABASE_URL !== 'string' || !config.DATABASE_URL) {
    errors.push('DATABASE_URL is required');
  }

  const secret = config.JWT_SECRET;

  if (typeof secret !== 'string' || !secret) {
    errors.push('JWT_SECRET is required');
  } else if (isProduction && secret.length < MIN_PRODUCTION_SECRET_LENGTH) {
    errors.push(
      `JWT_SECRET must have at least ${MIN_PRODUCTION_SECRET_LENGTH} characters in production`,
    );
  }

  if (errors.length > 0) {
    throw new Error(`Invalid environment:\n- ${errors.join('\n- ')}`);
  }

  return config;
}

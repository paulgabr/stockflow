import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  const base = {
    DATABASE_URL: 'postgresql://localhost:5432/stockflow',
    JWT_SECRET: 'short',
  };

  it('accepts a short secret outside production', () => {
    expect(validateEnv(base)).toEqual(base);
  });

  it('rejects a short secret in production', () => {
    expect(() => validateEnv({ ...base, NODE_ENV: 'production' })).toThrow(
      /JWT_SECRET must have at least 32 characters/,
    );
  });

  it('accepts a long secret in production', () => {
    const config = {
      ...base,
      NODE_ENV: 'production',
      JWT_SECRET: 'x'.repeat(32),
    };

    expect(validateEnv(config)).toEqual(config);
  });

  it('lists every missing variable', () => {
    expect(() => validateEnv({})).toThrow(
      /DATABASE_URL is required[\s\S]*JWT_SECRET is required/,
    );
  });
});

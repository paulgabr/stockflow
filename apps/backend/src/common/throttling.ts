import { SetMetadata, type ExecutionContext } from '@nestjs/common';
import type { ThrottlerOptions } from '@nestjs/throttler';

const THROTTLE_BY_EMAIL = 'throttle:by-email';

// Limits attempts per e-mail address on top of the per-IP limit. The frontend
// calls the API from its own server, so a per-IP limit alone does not protect
// a single account against password guessing.
export const ThrottleByEmail = () => SetMetadata(THROTTLE_BY_EMAIL, true);

function readEmail(request: Record<string, unknown>) {
  const body = request.body as { email?: unknown } | undefined;

  return typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
}

export const throttlers: ThrottlerOptions[] = [
  // Every route, per client IP.
  { name: 'default', ttl: 60_000, limit: 120 },
  {
    name: 'email',
    ttl: 15 * 60_000,
    limit: 10,
    getTracker: (request) => readEmail(request),
    skipIf: (context: ExecutionContext) =>
      Reflect.getMetadata(THROTTLE_BY_EMAIL, context.getHandler()) !== true,
  },
];

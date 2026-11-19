# syntax=docker/dockerfile:1

FROM node:24-bookworm-slim AS base
WORKDIR /app
# OpenSSL is required by the Prisma schema engine that runs migrations.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# All dependencies, for building.
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
COPY . .
RUN npx prisma generate && npm run build

# Only runtime dependencies. The Prisma CLI is one of them, to run migrations.
FROM base AS prod-deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json prisma.config.ts ./
COPY prisma ./prisma

USER node
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + process.env.PORT + '/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Applies pending migrations, then starts the API. `exec` makes node PID 1 so
# it receives SIGTERM and shuts down cleanly.
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && exec node dist/src/main.js"]

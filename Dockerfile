# ---------- deps ----------
FROM node:22-slim AS deps
WORKDIR /app

# Prisma needs OpenSSL at build time
RUN apt-get update -y && apt-get install -y openssl

COPY package.json package-lock.json* ./
RUN npm ci

# ---------- builder ----------
FROM node:22-slim AS builder
WORKDIR /app

# Prisma needs OpenSSL here too
RUN apt-get update -y && apt-get install -y openssl

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time DB path ONLY for prisma generate
ENV DATABASE_URL="file:/app/data/dev.db"

# Generate Prisma client
RUN npx prisma generate

# Build Next.js
# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---------- runner ----------
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
# Disable telemetry during runtime
ENV NEXT_TELEMETRY_DISABLED=1

# Install OpenSSL for production runtime
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh

# Ensure proper permissions and fix line endings (CRLF -> LF)
RUN mkdir -p /app/data .next \
 && chown -R nextjs:nodejs /app \
 && sed -i 's/\r$//' ./entrypoint.sh \
 && chmod +x ./entrypoint.sh

# Copy standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]

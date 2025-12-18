# ---------- deps ----------
FROM node:24-slim AS deps
WORKDIR /app

# Prisma needs OpenSSL at build time
RUN apt-get update -y && apt-get install -y openssl

COPY package.json package-lock.json* ./
RUN npm ci

# ---------- builder ----------
FROM node:24-slim AS builder
WORKDIR /app

# Prisma needs OpenSSL here too
RUN apt-get update -y && apt-get install -y openssl

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time DB path ONLY for prisma generate
ENV DATABASE_URL="file:/app/data/dev.db"

# Generate Prisma client with correct OpenSSL target
RUN npx prisma generate

RUN npm run build

# ---------- runner ----------
FROM node:24-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

RUN mkdir -p /app/data .next \
 && chown -R nextjs:nodejs /app

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
CMD ["node", "server.js"]

# Stage 1: Установка зависимостей
FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache python3 make g++ libc6-compat

COPY package.json ./
RUN npm install

# Stage 2: Сборка приложения
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache python3 make g++ libc6-compat

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* нужны во время сборки
ARG NEXT_PUBLIC_BASE_URL=http://localhost:3000
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY

RUN npx prisma generate
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

# Безопасность: непривилегированный пользователь
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Директории для БД и prisma schema
RUN mkdir -p /app/prisma /app/data && chown -R nextjs:nodejs /app/prisma /app/data

# Копируем собранное приложение
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma/schema.prisma ./prisma/schema.prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
# Prisma CLI и скрипты
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --from=builder /app/node_modules/.bin ./node_modules/.bin
COPY --from=builder /app/scripts ./scripts

RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/groups || exit 1

CMD ["node", "server.js"]

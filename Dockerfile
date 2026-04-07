FROM node:22-alpine AS base

# ---- 安装依赖阶段 ----
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
# NOTE: 直接使用 npm ci，不执行 npm update -g npm（Node 22 自带 npm 已足够新）
RUN npm ci

# ---- 构建阶段 ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ---- 运行阶段 ----
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# NOTE: 确保 public 目录存在（项目可能没有该目录），避免 COPY 失败
RUN mkdir -p ./public
COPY --from=builder /app/public ./public

RUN mkdir -p .next && chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

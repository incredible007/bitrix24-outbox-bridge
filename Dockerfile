# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml tsconfig*.json ./
RUN pnpm install --frozen-lockfile
COPY src ./src
RUN pnpm run build

# Prod stage
FROM node:20-alpine AS production
ENV NODE_ENV=PROD
WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S -D -H -u 1001 -h /app -s /sbin/nologin -G nodejs -g nodejs nodejs
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

USER nodejs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s \
  CMD node dist/main.js || exit 1
CMD ["node", "dist/main.js"]

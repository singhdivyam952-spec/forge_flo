# syntax=docker/dockerfile:1

# ---------- Base ----------
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# ---------- Dependencies ----------
FROM base AS deps
COPY backend/package.json backend/package-lock.json* ./
RUN npm install --omit=dev --ignore-scripts && cp -R node_modules prod_node_modules
RUN npm install --ignore-scripts

# ---------- Build ----------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY backend/ ./
RUN npm run build

# ---------- Production ----------
FROM base AS production
ENV NODE_ENV=production

COPY --from=deps /app/prod_node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY backend/package.json ./package.json

RUN mkdir -p /app/uploads /app/logs \
  && addgroup -S appgroup && adduser -S appuser -G appgroup \
  && chown -R appuser:appgroup /app

USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/v1/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "dist/server.js"]

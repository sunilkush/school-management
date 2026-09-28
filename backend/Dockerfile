# ── Stage 1: dependencies ─────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ── Stage 2: runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Run on the school calendar. Without this the container is UTC while every developer machine is
# IST, so "today" / "this month" ranges built with new Date(y, m, 1) and setHours(0) started at
# 5:30 AM IST in production and midnight everywhere it was tested.
RUN apk add --no-cache tzdata
ENV TZ=Asia/Kolkata

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Create upload temp dir
RUN mkdir -p public/temp && chown -R appuser:appgroup /app

USER appuser

EXPOSE 9000

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:9000/api/v1/health || exit 1

CMD ["node", "src/index.js"]

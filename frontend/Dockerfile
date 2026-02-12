# Build stage
FROM node:20-alpine AS builder

# Labels for container metadata
LABEL org.opencontainers.image.title="Job Platform Frontend"
LABEL org.opencontainers.image.description="Next.js frontend for Job Platform"
LABEL org.opencontainers.image.vendor="Job Platform"

# Install dependencies for node-gyp (if needed)
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json yarn.lock ./

# Install dependencies with Yarn
RUN yarn install --frozen-lockfile --network-timeout 100000

# Copy source code
COPY . .

# Set build-time environment variables
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_POSTHOG_KEY
ARG NEXT_PUBLIC_POSTHOG_HOST

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_POSTHOG_KEY=$NEXT_PUBLIC_POSTHOG_KEY
ENV NEXT_PUBLIC_POSTHOG_HOST=$NEXT_PUBLIC_POSTHOG_HOST

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN yarn build

# Production stage - SECURITY HARDENED
FROM node:20-alpine AS runner

WORKDIR /app

# Install ONLY tini for signal handling - NO curl, wget, or other tools
# This prevents attackers from downloading malware even if they get RCE
RUN apk add --no-cache tini && \
    rm -rf /var/cache/apk/* && \
    # Remove potentially dangerous binaries
    rm -f /usr/bin/wget /usr/bin/curl /usr/bin/nc /usr/bin/telnet 2>/dev/null || true

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy built assets with proper ownership
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check using node instead of curl (more secure)
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Use tini as init system for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

CMD ["node", "server.js"]

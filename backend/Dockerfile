# Build stage
FROM golang:1.24-alpine AS builder

# Build arguments for version info
ARG BUILD_VERSION=dev
ARG BUILD_TIME=unknown

# Install build dependencies
RUN apk add --no-cache git gcc musl-dev

# Set working directory
WORKDIR /app

# Copy go mod files first for better layer caching
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download && go mod verify

# Copy source code
COPY . .

# Build the application with version info
RUN CGO_ENABLED=0 GOOS=linux go build \
    -a \
    -installsuffix cgo \
    -ldflags="-w -s -X main.Version=${BUILD_VERSION} -X main.BuildTime=${BUILD_TIME}" \
    -o main ./cmd/main.go

# Final stage - use distroless for smaller, more secure image
FROM alpine:3.20

# Labels for container metadata
LABEL org.opencontainers.image.title="Job Platform Backend"
LABEL org.opencontainers.image.description="Go backend API for Job Platform"
LABEL org.opencontainers.image.vendor="Job Platform"

# Install runtime dependencies
# - ca-certificates: for HTTPS connections
# - tzdata: for timezone support
# - curl: for health checks (smaller than wget)
RUN apk --no-cache add ca-certificates tzdata curl && \
    rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

WORKDIR /app

# Copy the binary from builder
COPY --from=builder --chown=appuser:appgroup /app/main .

# Copy migrations
COPY --from=builder --chown=appuser:appgroup /app/migrations ./migrations

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Environment defaults
ENV APP_ENV=production \
    APP_PORT=8080 \
    APP_HOST=0.0.0.0

# Health check - use curl for better reliability
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Run the application
CMD ["./main"]

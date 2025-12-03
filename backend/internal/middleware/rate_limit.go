package middleware

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

// RateLimitMiddleware implements rate limiting using Redis
func RateLimitMiddleware(redisClient *redis.Client, limit int, window time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get client identifier (IP address or user ID if authenticated)
		identifier := c.ClientIP()

		// If user is authenticated, use user ID for better tracking
		if userID, exists := c.Get("user_id"); exists {
			identifier = fmt.Sprintf("user:%v", userID)
		}

		// Create rate limit key
		key := fmt.Sprintf("rate_limit:%s:%s", c.Request.URL.Path, identifier)

		// Get current count
		ctx := c.Request.Context()
		count, err := redisClient.Get(ctx, key).Int()
		if err != nil && err != redis.Nil {
			// If Redis fails, allow request but log error
			c.Next()
			return
		}

		// Check if limit exceeded
		if count >= limit {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "RATE_LIMIT_EXCEEDED",
					"message": "Too many requests. Please try again later.",
				},
			})
			c.Abort()
			return
		}

		// Increment counter
		pipe := redisClient.Pipeline()
		pipe.Incr(ctx, key)
		pipe.Expire(ctx, key, window)
		_, err = pipe.Exec(ctx)

		if err != nil {
			// If Redis fails, allow request but log error
			fmt.Printf("❌ Rate limit pipeline error for key %s: %v\n", key, err)
			c.Next()
			return
		}

		// Add rate limit headers
		c.Header("X-RateLimit-Limit", fmt.Sprintf("%d", limit))
		c.Header("X-RateLimit-Remaining", fmt.Sprintf("%d", limit-count-1))
		c.Header("X-RateLimit-Reset", fmt.Sprintf("%d", time.Now().Add(window).Unix()))

		c.Next()
	}
}

// IPRateLimitMiddleware implements IP-based rate limiting
func IPRateLimitMiddleware(redisClient *redis.Client, limit int, window time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		key := fmt.Sprintf("ip_rate_limit:%s:%s", c.Request.URL.Path, ip)

		ctx := c.Request.Context()
		count, err := redisClient.Get(ctx, key).Int()
		if err != nil && err != redis.Nil {
			c.Next()
			return
		}

		if count >= limit {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "RATE_LIMIT_EXCEEDED",
					"message": "Too many requests from this IP. Please try again later.",
				},
			})
			c.Abort()
			return
		}

		pipe := redisClient.Pipeline()
		pipe.Incr(ctx, key)
		pipe.Expire(ctx, key, window)
		_, pipeErr := pipe.Exec(ctx)

		if pipeErr != nil {
			// If pipeline fails, log but allow request
			fmt.Printf("❌ Rate limit pipeline error for key %s: %v\n", key, pipeErr)
		}

		c.Next()
	}
}

// LoginRateLimitMiddleware implements strict rate limiting for login endpoints
func LoginRateLimitMiddleware(redisClient *redis.Client) gin.HandlerFunc {
	// 5 attempts per 15 minutes per IP
	return IPRateLimitMiddleware(redisClient, 5, 15*time.Minute)
}

// EmailRateLimitMiddleware implements rate limiting for email sending
func EmailRateLimitMiddleware(redisClient *redis.Client) gin.HandlerFunc {
	// 3 emails per hour per user
	return RateLimitMiddleware(redisClient, 3, 1*time.Hour)
}

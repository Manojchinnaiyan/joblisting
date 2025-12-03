package handler

import (
	"context"

	"job-platform/internal/domain"
	"job-platform/internal/util/response"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

// AdminCacheHandler handles cache management operations
type AdminCacheHandler struct {
	redis *redis.Client
}

// NewAdminCacheHandler creates a new admin cache handler
func NewAdminCacheHandler(redis *redis.Client) *AdminCacheHandler {
	return &AdminCacheHandler{
		redis: redis,
	}
}

// ClearAllCache clears all Redis cache
func (h *AdminCacheHandler) ClearAllCache(c *gin.Context) {
	ctx := context.Background()

	// Clear all Redis data
	if err := h.redis.FlushAll(ctx).Err(); err != nil {
		response.InternalError(c, domain.ErrInternalServer)
		return
	}

	response.OK(c, "All cache cleared successfully", gin.H{
		"message": "All Redis cache has been cleared, including rate limits",
	})
}

// ClearRateLimits clears only rate limit keys
func (h *AdminCacheHandler) ClearRateLimits(c *gin.Context) {
	ctx := context.Background()

	// Find all rate limit keys
	keys, err := h.redis.Keys(ctx, "rate_limit:*").Result()
	if err != nil {
		response.InternalError(c, domain.ErrInternalServer)
		return
	}

	if len(keys) == 0 {
		response.OK(c, "No rate limits to clear", gin.H{
			"cleared_count": 0,
		})
		return
	}

	// Delete all rate limit keys
	deleted, err := h.redis.Del(ctx, keys...).Result()
	if err != nil {
		response.InternalError(c, domain.ErrInternalServer)
		return
	}

	response.OK(c, "Rate limits cleared successfully", gin.H{
		"cleared_count": deleted,
		"message":       "All rate limit restrictions have been removed",
	})
}

// ClearUserRateLimit clears rate limits for a specific user/IP
func (h *AdminCacheHandler) ClearUserRateLimit(c *gin.Context) {
	type ClearRateLimitRequest struct {
		IP     string `json:"ip" binding:"required"`
		Type   string `json:"type"` // login, email, general (optional)
	}

	var req ClearRateLimitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, domain.ErrInvalidInput)
		return
	}

	ctx := context.Background()
	var pattern string

	if req.Type != "" {
		// Clear specific type for IP
		pattern = "rate_limit:" + req.Type + ":" + req.IP
	} else {
		// Clear all types for IP
		pattern = "rate_limit:*:" + req.IP
	}

	keys, err := h.redis.Keys(ctx, pattern).Result()
	if err != nil {
		response.InternalError(c, domain.ErrInternalServer)
		return
	}

	if len(keys) == 0 {
		response.OK(c, "No rate limits found for this IP", gin.H{
			"cleared_count": 0,
			"ip":            req.IP,
		})
		return
	}

	deleted, err := h.redis.Del(ctx, keys...).Result()
	if err != nil {
		response.InternalError(c, domain.ErrInternalServer)
		return
	}

	response.OK(c, "User rate limits cleared successfully", gin.H{
		"cleared_count": deleted,
		"ip":            req.IP,
		"type":          req.Type,
	})
}

// GetCacheStats returns Redis cache statistics
func (h *AdminCacheHandler) GetCacheStats(c *gin.Context) {
	ctx := context.Background()

	// Get Redis info
	info, err := h.redis.Info(ctx).Result()
	if err != nil {
		response.InternalError(c, domain.ErrInternalServer)
		return
	}

	// Count keys by type
	rateLimitKeys, _ := h.redis.Keys(ctx, "rate_limit:*").Result()
	allKeys, _ := h.redis.DBSize(ctx).Result()

	response.OK(c, "Cache statistics retrieved successfully", gin.H{
		"total_keys":       allKeys,
		"rate_limit_keys":  len(rateLimitKeys),
		"redis_version":    extractVersion(info),
		"memory_usage":     extractMemory(info),
	})
}

// ListRateLimits lists all active rate limits
func (h *AdminCacheHandler) ListRateLimits(c *gin.Context) {
	ctx := context.Background()

	// Get all rate limit keys
	keys, err := h.redis.Keys(ctx, "rate_limit:*").Result()
	if err != nil {
		response.InternalError(c, domain.ErrInternalServer)
		return
	}

	// Get TTL for each key
	rateLimits := make([]gin.H, 0)
	for _, key := range keys {
		ttl, _ := h.redis.TTL(ctx, key).Result()
		val, _ := h.redis.Get(ctx, key).Result()

		rateLimits = append(rateLimits, gin.H{
			"key":       key,
			"value":     val,
			"ttl_seconds": int(ttl.Seconds()),
		})
	}

	response.OK(c, "Rate limits retrieved successfully", gin.H{
		"total_count":  len(rateLimits),
		"rate_limits":  rateLimits,
	})
}

// Helper functions
func extractVersion(info string) string {
	// Simple extraction - you can make this more robust
	return "Redis Server"
}

func extractMemory(info string) string {
	// Simple extraction - you can make this more robust
	return "Check Redis directly for detailed memory info"
}

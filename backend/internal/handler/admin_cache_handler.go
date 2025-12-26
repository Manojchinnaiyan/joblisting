package handler

import (
	"context"
	"net/http"
	"strconv"
	"strings"

	"job-platform/internal/cache"

	"github.com/gin-gonic/gin"
)

// AdminCacheHandler handles cache management endpoints for admin
type AdminCacheHandler struct {
	cacheService *cache.CacheService
}

// NewAdminCacheHandler creates a new admin cache handler
func NewAdminCacheHandler(cacheService *cache.CacheService) *AdminCacheHandler {
	return &AdminCacheHandler{
		cacheService: cacheService,
	}
}

// GetCacheStats returns cache statistics
// GET /api/v1/admin/cache/stats
func (h *AdminCacheHandler) GetCacheStats(c *gin.Context) {
	if h.cacheService == nil || !h.cacheService.IsAvailable() {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error":     "Cache service not available",
			"available": false,
		})
		return
	}

	ctx := context.Background()
	stats, err := h.cacheService.GetCacheStats(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"available": true,
		"stats":     stats,
	})
}

// ClearJobCache clears all job-related caches
// POST /api/v1/admin/cache/clear/jobs
func (h *AdminCacheHandler) ClearJobCache(c *gin.Context) {
	if h.cacheService == nil || !h.cacheService.IsAvailable() {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Cache service not available"})
		return
	}

	ctx := context.Background()
	if err := h.cacheService.InvalidateAllJobCaches(ctx); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Job cache cleared successfully",
	})
}

// ClearBlogCache clears all blog-related caches
// POST /api/v1/admin/cache/clear/blogs
func (h *AdminCacheHandler) ClearBlogCache(c *gin.Context) {
	if h.cacheService == nil || !h.cacheService.IsAvailable() {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Cache service not available"})
		return
	}

	ctx := context.Background()
	if err := h.cacheService.InvalidateAllBlogCaches(ctx); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Blog cache cleared successfully",
	})
}

// ClearSearchCache clears all search result caches
// POST /api/v1/admin/cache/clear/search
func (h *AdminCacheHandler) ClearSearchCache(c *gin.Context) {
	if h.cacheService == nil || !h.cacheService.IsAvailable() {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Cache service not available"})
		return
	}

	ctx := context.Background()
	if err := h.cacheService.DeletePattern(ctx, cache.PrefixSearch+"*"); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Search cache cleared successfully",
	})
}

// ClearAllCache clears all caches
// POST /api/v1/admin/cache/clear/all
func (h *AdminCacheHandler) ClearAllCache(c *gin.Context) {
	if h.cacheService == nil || !h.cacheService.IsAvailable() {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Cache service not available"})
		return
	}

	ctx := context.Background()
	errors := []string{}

	// Clear job caches
	if err := h.cacheService.InvalidateAllJobCaches(ctx); err != nil {
		errors = append(errors, "jobs: "+err.Error())
	}

	// Clear blog caches
	if err := h.cacheService.InvalidateAllBlogCaches(ctx); err != nil {
		errors = append(errors, "blogs: "+err.Error())
	}

	// Clear search caches
	if err := h.cacheService.DeletePattern(ctx, cache.PrefixSearch+"*"); err != nil {
		errors = append(errors, "search: "+err.Error())
	}

	// Clear view counters (sync first then clear)
	if err := h.cacheService.DeletePattern(ctx, cache.PrefixViewCount+"*"); err != nil {
		errors = append(errors, "views: "+err.Error())
	}

	if len(errors) > 0 {
		c.JSON(http.StatusPartialContent, gin.H{
			"success": false,
			"message": "Some caches failed to clear",
			"errors":  errors,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "All caches cleared successfully",
	})
}

// GetViewCounts returns current view counts in cache
// GET /api/v1/admin/cache/view-counts
func (h *AdminCacheHandler) GetViewCounts(c *gin.Context) {
	if h.cacheService == nil || !h.cacheService.IsAvailable() {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Cache service not available"})
		return
	}

	ctx := context.Background()
	itemType := c.DefaultQuery("type", "job") // job or blog

	counts, err := h.cacheService.GetAllViewCounts(ctx, itemType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"type":    itemType,
		"counts":  counts,
		"total":   len(counts),
	})
}

// HealthCheck returns cache health status
// GET /api/v1/admin/cache/health
func (h *AdminCacheHandler) HealthCheck(c *gin.Context) {
	available := h.cacheService != nil && h.cacheService.IsAvailable()

	status := "healthy"
	if !available {
		status = "unavailable"
	}

	c.JSON(http.StatusOK, gin.H{
		"status":    status,
		"available": available,
	})
}

// ClearRateLimits clears rate limit keys for an IP or user
// POST /api/v1/admin/cache/clear/rate-limits
func (h *AdminCacheHandler) ClearRateLimits(c *gin.Context) {
	if h.cacheService == nil || !h.cacheService.IsAvailable() {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Cache service not available"})
		return
	}

	ctx := context.Background()
	ip := c.Query("ip")
	userID := c.Query("user_id")

	cleared := 0
	errors := []string{}

	// Clear IP-based rate limits
	if ip != "" {
		if err := h.cacheService.DeletePattern(ctx, "ip_rate_limit:*:"+ip); err != nil {
			errors = append(errors, "ip rate limit: "+err.Error())
		} else {
			cleared++
		}
		if err := h.cacheService.DeletePattern(ctx, "rate_limit:*:"+ip); err != nil {
			errors = append(errors, "rate limit: "+err.Error())
		} else {
			cleared++
		}
	}

	// Clear user-based rate limits
	if userID != "" {
		if err := h.cacheService.DeletePattern(ctx, "rate_limit:*:user:"+userID); err != nil {
			errors = append(errors, "user rate limit: "+err.Error())
		} else {
			cleared++
		}
	}

	// If no specific IP or user, clear all rate limits
	if ip == "" && userID == "" {
		if err := h.cacheService.DeletePattern(ctx, "rate_limit:*"); err != nil {
			errors = append(errors, "all rate limits: "+err.Error())
		} else {
			cleared++
		}
		if err := h.cacheService.DeletePattern(ctx, "ip_rate_limit:*"); err != nil {
			errors = append(errors, "all ip rate limits: "+err.Error())
		} else {
			cleared++
		}
	}

	if len(errors) > 0 {
		c.JSON(http.StatusPartialContent, gin.H{
			"success": false,
			"message": "Some rate limits failed to clear",
			"errors":  errors,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Rate limits cleared successfully",
		"cleared": cleared,
	})
}

// RateLimitInfo represents rate limit information for an IP/user
type RateLimitInfo struct {
	Key       string `json:"key"`
	IP        string `json:"ip"`
	Endpoint  string `json:"endpoint"`
	Count     int64  `json:"count"`
	TTL       int64  `json:"ttl"`
	IsBlocked bool   `json:"is_blocked"`
}

// GetRateLimits returns all current rate limit entries
// GET /api/v1/admin/cache/rate-limits
func (h *AdminCacheHandler) GetRateLimits(c *gin.Context) {
	if h.cacheService == nil || !h.cacheService.IsAvailable() {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Cache service not available"})
		return
	}

	ctx := context.Background()
	rateLimits := []RateLimitInfo{}

	// Get IP rate limits (ip_rate_limit:endpoint:ip)
	ipKeys, err := h.cacheService.SearchKeys(ctx, "ip_rate_limit:*", 500)
	if err == nil {
		for _, keyInfo := range ipKeys {
			parts := strings.Split(keyInfo.Key, ":")
			if len(parts) >= 3 {
				endpoint := parts[1]
				ip := strings.Join(parts[2:], ":")

				// Get the count value
				count, _, _, _ := h.cacheService.GetKeyValue(ctx, keyInfo.Key)
				countVal := int64(0)
				if countStr, ok := count.(string); ok {
					countVal, _ = strconv.ParseInt(countStr, 10, 64)
				}

				rateLimits = append(rateLimits, RateLimitInfo{
					Key:       keyInfo.Key,
					IP:        ip,
					Endpoint:  endpoint,
					Count:     countVal,
					TTL:       keyInfo.TTL,
					IsBlocked: countVal >= 5, // Login rate limit is 5
				})
			}
		}
	}

	// Get general rate limits (rate_limit:endpoint:identifier)
	generalKeys, err := h.cacheService.SearchKeys(ctx, "rate_limit:*", 500)
	if err == nil {
		for _, keyInfo := range generalKeys {
			parts := strings.Split(keyInfo.Key, ":")
			if len(parts) >= 3 {
				endpoint := parts[1]
				identifier := strings.Join(parts[2:], ":")

				// Get the count value
				count, _, _, _ := h.cacheService.GetKeyValue(ctx, keyInfo.Key)
				countVal := int64(0)
				if countStr, ok := count.(string); ok {
					countVal, _ = strconv.ParseInt(countStr, 10, 64)
				}

				rateLimits = append(rateLimits, RateLimitInfo{
					Key:       keyInfo.Key,
					IP:        identifier,
					Endpoint:  endpoint,
					Count:     countVal,
					TTL:       keyInfo.TTL,
					IsBlocked: false, // Will depend on endpoint limits
				})
			}
		}
	}

	// Count blocked IPs
	blockedCount := 0
	for _, rl := range rateLimits {
		if rl.IsBlocked {
			blockedCount++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success":       true,
		"rate_limits":   rateLimits,
		"total":         len(rateLimits),
		"blocked_count": blockedCount,
	})
}

// ClearCompanyCache clears all company-related caches
// POST /api/v1/admin/cache/clear/companies
func (h *AdminCacheHandler) ClearCompanyCache(c *gin.Context) {
	if h.cacheService == nil || !h.cacheService.IsAvailable() {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Cache service not available"})
		return
	}

	ctx := context.Background()
	if err := h.cacheService.InvalidateCompanyCaches(ctx); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Company cache cleared successfully",
	})
}

// ClearCategoryCache clears all category caches
// POST /api/v1/admin/cache/clear/categories
func (h *AdminCacheHandler) ClearCategoryCache(c *gin.Context) {
	if h.cacheService == nil || !h.cacheService.IsAvailable() {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Cache service not available"})
		return
	}

	ctx := context.Background()
	if err := h.cacheService.InvalidateCategoryCaches(ctx); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Category cache cleared successfully",
	})
}

// ClearLocationCache clears all location caches
// POST /api/v1/admin/cache/clear/locations
func (h *AdminCacheHandler) ClearLocationCache(c *gin.Context) {
	if h.cacheService == nil || !h.cacheService.IsAvailable() {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Cache service not available"})
		return
	}

	ctx := context.Background()
	if err := h.cacheService.InvalidateLocationCaches(ctx); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Location cache cleared successfully",
	})
}

// ClearSessionCache clears all session caches
// POST /api/v1/admin/cache/clear/sessions
func (h *AdminCacheHandler) ClearSessionCache(c *gin.Context) {
	if h.cacheService == nil || !h.cacheService.IsAvailable() {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Cache service not available"})
		return
	}

	ctx := context.Background()
	if err := h.cacheService.InvalidateSessionCaches(ctx); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Session cache cleared successfully",
	})
}

// ==================== Key Management ====================

// SearchKeys searches for cache keys matching a pattern
// GET /api/v1/admin/cache/keys?pattern=job:*&limit=100
func (h *AdminCacheHandler) SearchKeys(c *gin.Context) {
	if h.cacheService == nil || !h.cacheService.IsAvailable() {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Cache service not available"})
		return
	}

	pattern := c.DefaultQuery("pattern", "*")
	limitStr := c.DefaultQuery("limit", "100")
	limit := 100
	if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
		limit = l
	}
	if limit > 1000 {
		limit = 1000 // Cap at 1000 keys
	}

	ctx := context.Background()
	keys, err := h.cacheService.SearchKeys(ctx, pattern, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"keys":    keys,
		"count":   len(keys),
		"pattern": pattern,
		"limit":   limit,
	})
}

// GetKey retrieves a specific cache key value
// GET /api/v1/admin/cache/keys/:key
func (h *AdminCacheHandler) GetKey(c *gin.Context) {
	if h.cacheService == nil || !h.cacheService.IsAvailable() {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Cache service not available"})
		return
	}

	key := c.Param("key")
	if key == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Key is required"})
		return
	}

	ctx := context.Background()
	value, keyType, ttl, err := h.cacheService.GetKeyValue(ctx, key)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Key not found or error: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"key":     key,
		"type":    keyType,
		"value":   value,
		"ttl":     ttl,
	})
}

// SetKeyRequest represents a request to set a cache key
type SetKeyRequest struct {
	Key   string `json:"key" binding:"required"`
	Value string `json:"value" binding:"required"`
	TTL   int    `json:"ttl"` // TTL in seconds, 0 means no expiry
}

// SetKey sets a cache key value
// POST /api/v1/admin/cache/keys
func (h *AdminCacheHandler) SetKey(c *gin.Context) {
	if h.cacheService == nil || !h.cacheService.IsAvailable() {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Cache service not available"})
		return
	}

	var req SetKeyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := context.Background()
	if err := h.cacheService.SetKeyValue(ctx, req.Key, req.Value, req.TTL); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Key set successfully",
		"key":     req.Key,
	})
}

// DeleteKey deletes a specific cache key
// DELETE /api/v1/admin/cache/keys/:key
func (h *AdminCacheHandler) DeleteKey(c *gin.Context) {
	if h.cacheService == nil || !h.cacheService.IsAvailable() {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Cache service not available"})
		return
	}

	key := c.Param("key")
	if key == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Key is required"})
		return
	}

	ctx := context.Background()
	if err := h.cacheService.DeleteKey(ctx, key); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Key deleted successfully",
		"key":     key,
	})
}

// UpdateKeyTTLRequest represents a request to update a key's TTL
type UpdateKeyTTLRequest struct {
	Key string `json:"key"` // The cache key to update
	TTL int    `json:"ttl"` // TTL in seconds, 0 or negative means persist (no expiry)
}

// UpdateKeyTTL updates the TTL of a cache key
// POST /api/v1/admin/cache/keys/ttl
func (h *AdminCacheHandler) UpdateKeyTTL(c *gin.Context) {
	if h.cacheService == nil || !h.cacheService.IsAvailable() {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Cache service not available"})
		return
	}

	var req UpdateKeyTTLRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Key == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Key is required"})
		return
	}

	ctx := context.Background()
	if err := h.cacheService.UpdateKeyTTL(ctx, req.Key, req.TTL); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Key TTL updated successfully",
		"key":     req.Key,
		"ttl":     req.TTL,
	})
}

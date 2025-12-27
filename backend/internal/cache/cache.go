package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// Cache prefixes for different data types
const (
	PrefixJob          = "job:"
	PrefixJobList      = "job_list:"
	PrefixBlog         = "blog:"
	PrefixBlogList     = "blog_list:"
	PrefixSearch       = "search:"
	PrefixViewCount    = "views:"
	PrefixSession      = "session:"
	PrefixUserSessions = "user_sessions:"
	PrefixCategory     = "category:"
	PrefixCompany      = "company:"
	PrefixCompanyList  = "company_list:"
	PrefixLocation     = "locations:"
)

// Default TTLs
const (
	DefaultJobTTL        = 10 * time.Minute
	DefaultBlogTTL       = 10 * time.Minute
	DefaultSearchTTL     = 5 * time.Minute
	DefaultListTTL       = 2 * time.Minute
	DefaultFeaturedTTL   = 30 * time.Minute // Featured jobs change rarely
	DefaultSessionTTL    = 24 * time.Hour
	ViewCountSyncPeriod  = 5 * time.Minute
	DefaultCategoryTTL   = 1 * time.Hour  // Categories change rarely
	DefaultCompanyTTL    = 15 * time.Minute
	DefaultLocationTTL   = 30 * time.Minute // Locations change rarely
)

// CacheService provides caching operations using Redis
type CacheService struct {
	client *redis.Client
}

// NewCacheService creates a new cache service
func NewCacheService(client *redis.Client) *CacheService {
	return &CacheService{client: client}
}

// IsAvailable checks if Redis is available
func (c *CacheService) IsAvailable() bool {
	if c.client == nil {
		return false
	}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	return c.client.Ping(ctx).Err() == nil
}

// ==================== Generic Cache Operations ====================

// Set stores a value in cache with TTL
func (c *CacheService) Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	data, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("failed to marshal cache value: %w", err)
	}
	return c.client.Set(ctx, key, data, ttl).Err()
}

// Get retrieves a value from cache
func (c *CacheService) Get(ctx context.Context, key string, dest interface{}) error {
	data, err := c.client.Get(ctx, key).Bytes()
	if err != nil {
		return err
	}
	return json.Unmarshal(data, dest)
}

// Delete removes a key from cache
func (c *CacheService) Delete(ctx context.Context, key string) error {
	return c.client.Del(ctx, key).Err()
}

// DeletePattern removes all keys matching a pattern
func (c *CacheService) DeletePattern(ctx context.Context, pattern string) error {
	keys, err := c.client.Keys(ctx, pattern).Result()
	if err != nil {
		return err
	}
	if len(keys) > 0 {
		return c.client.Del(ctx, keys...).Err()
	}
	return nil
}

// Exists checks if a key exists
func (c *CacheService) Exists(ctx context.Context, key string) (bool, error) {
	result, err := c.client.Exists(ctx, key).Result()
	return result > 0, err
}

// ==================== Job Caching ====================

// CacheJob stores a job in cache
func (c *CacheService) CacheJob(ctx context.Context, jobID string, job interface{}) error {
	key := PrefixJob + jobID
	return c.Set(ctx, key, job, DefaultJobTTL)
}

// GetCachedJob retrieves a job from cache
func (c *CacheService) GetCachedJob(ctx context.Context, jobID string, dest interface{}) error {
	key := PrefixJob + jobID
	return c.Get(ctx, key, dest)
}

// InvalidateJob removes a job from cache
func (c *CacheService) InvalidateJob(ctx context.Context, jobID string) error {
	key := PrefixJob + jobID
	return c.Delete(ctx, key)
}

// InvalidateAllJobCaches clears all job-related caches
func (c *CacheService) InvalidateAllJobCaches(ctx context.Context) error {
	if err := c.DeletePattern(ctx, PrefixJob+"*"); err != nil {
		return err
	}
	if err := c.DeletePattern(ctx, PrefixJobList+"*"); err != nil {
		return err
	}
	return c.DeletePattern(ctx, PrefixSearch+"jobs:*")
}

// CacheJobList stores a job list result
func (c *CacheService) CacheJobList(ctx context.Context, cacheKey string, result interface{}) error {
	key := PrefixJobList + cacheKey
	return c.Set(ctx, key, result, DefaultListTTL)
}

// CacheFeaturedJobs stores featured jobs with longer TTL
func (c *CacheService) CacheFeaturedJobs(ctx context.Context, cacheKey string, result interface{}) error {
	key := PrefixJobList + cacheKey
	return c.Set(ctx, key, result, DefaultFeaturedTTL)
}

// GetCachedJobList retrieves a job list from cache
func (c *CacheService) GetCachedJobList(ctx context.Context, cacheKey string, dest interface{}) error {
	key := PrefixJobList + cacheKey
	return c.Get(ctx, key, dest)
}

// ==================== Blog Caching ====================

// CacheBlog stores a blog in cache
func (c *CacheService) CacheBlog(ctx context.Context, blogID string, blog interface{}) error {
	key := PrefixBlog + blogID
	return c.Set(ctx, key, blog, DefaultBlogTTL)
}

// CacheBlogBySlug stores a blog by slug
func (c *CacheService) CacheBlogBySlug(ctx context.Context, slug string, blog interface{}) error {
	key := PrefixBlog + "slug:" + slug
	return c.Set(ctx, key, blog, DefaultBlogTTL)
}

// GetCachedBlog retrieves a blog from cache
func (c *CacheService) GetCachedBlog(ctx context.Context, blogID string, dest interface{}) error {
	key := PrefixBlog + blogID
	return c.Get(ctx, key, dest)
}

// GetCachedBlogBySlug retrieves a blog by slug from cache
func (c *CacheService) GetCachedBlogBySlug(ctx context.Context, slug string, dest interface{}) error {
	key := PrefixBlog + "slug:" + slug
	return c.Get(ctx, key, dest)
}

// InvalidateBlog removes a blog from cache
func (c *CacheService) InvalidateBlog(ctx context.Context, blogID string, slug string) error {
	if err := c.Delete(ctx, PrefixBlog+blogID); err != nil {
		return err
	}
	if slug != "" {
		return c.Delete(ctx, PrefixBlog+"slug:"+slug)
	}
	return nil
}

// InvalidateAllBlogCaches clears all blog-related caches
func (c *CacheService) InvalidateAllBlogCaches(ctx context.Context) error {
	if err := c.DeletePattern(ctx, PrefixBlog+"*"); err != nil {
		return err
	}
	if err := c.DeletePattern(ctx, PrefixBlogList+"*"); err != nil {
		return err
	}
	return c.DeletePattern(ctx, PrefixSearch+"blogs:*")
}

// ==================== Category Caching ====================

// CacheCategories stores categories list
func (c *CacheService) CacheCategories(ctx context.Context, cacheKey string, categories interface{}) error {
	key := PrefixCategory + cacheKey
	return c.Set(ctx, key, categories, DefaultCategoryTTL)
}

// GetCachedCategories retrieves categories from cache
func (c *CacheService) GetCachedCategories(ctx context.Context, cacheKey string, dest interface{}) error {
	key := PrefixCategory + cacheKey
	return c.Get(ctx, key, dest)
}

// InvalidateCategories clears category cache
func (c *CacheService) InvalidateCategories(ctx context.Context) error {
	return c.DeletePattern(ctx, PrefixCategory+"*")
}

// ==================== Location Caching ====================

// CacheLocations stores locations list
func (c *CacheService) CacheLocations(ctx context.Context, locations interface{}) error {
	key := PrefixLocation + "all"
	return c.Set(ctx, key, locations, DefaultLocationTTL)
}

// GetCachedLocations retrieves locations from cache
func (c *CacheService) GetCachedLocations(ctx context.Context, dest interface{}) error {
	key := PrefixLocation + "all"
	return c.Get(ctx, key, dest)
}

// InvalidateLocations clears location cache
func (c *CacheService) InvalidateLocations(ctx context.Context) error {
	return c.DeletePattern(ctx, PrefixLocation+"*")
}

// ==================== Company Caching ====================

// CacheCompany stores a company in cache
func (c *CacheService) CacheCompany(ctx context.Context, companyID string, company interface{}) error {
	key := PrefixCompany + companyID
	return c.Set(ctx, key, company, DefaultCompanyTTL)
}

// CacheCompanyBySlug stores a company by slug
func (c *CacheService) CacheCompanyBySlug(ctx context.Context, slug string, company interface{}) error {
	key := PrefixCompany + "slug:" + slug
	return c.Set(ctx, key, company, DefaultCompanyTTL)
}

// GetCachedCompany retrieves a company from cache
func (c *CacheService) GetCachedCompany(ctx context.Context, companyID string, dest interface{}) error {
	key := PrefixCompany + companyID
	return c.Get(ctx, key, dest)
}

// GetCachedCompanyBySlug retrieves a company by slug from cache
func (c *CacheService) GetCachedCompanyBySlug(ctx context.Context, slug string, dest interface{}) error {
	key := PrefixCompany + "slug:" + slug
	return c.Get(ctx, key, dest)
}

// CacheCompanyList stores a company list result
func (c *CacheService) CacheCompanyList(ctx context.Context, cacheKey string, result interface{}) error {
	key := PrefixCompanyList + cacheKey
	return c.Set(ctx, key, result, DefaultListTTL)
}

// GetCachedCompanyList retrieves a company list from cache
func (c *CacheService) GetCachedCompanyList(ctx context.Context, cacheKey string, dest interface{}) error {
	key := PrefixCompanyList + cacheKey
	return c.Get(ctx, key, dest)
}

// InvalidateCompany removes a company from cache
func (c *CacheService) InvalidateCompany(ctx context.Context, companyID string, slug string) error {
	if err := c.Delete(ctx, PrefixCompany+companyID); err != nil {
		return err
	}
	if slug != "" {
		if err := c.Delete(ctx, PrefixCompany+"slug:"+slug); err != nil {
			return err
		}
	}
	// Also invalidate company lists
	return c.DeletePattern(ctx, PrefixCompanyList+"*")
}

// InvalidateAllCompanyCaches clears all company-related caches
func (c *CacheService) InvalidateAllCompanyCaches(ctx context.Context) error {
	if err := c.DeletePattern(ctx, PrefixCompany+"*"); err != nil {
		return err
	}
	return c.DeletePattern(ctx, PrefixCompanyList+"*")
}

// ==================== Search Results Caching ====================

// CacheSearchResult stores a search result
func (c *CacheService) CacheSearchResult(ctx context.Context, searchType string, query string, filters string, result interface{}) error {
	key := fmt.Sprintf("%s%s:%s:%s", PrefixSearch, searchType, query, filters)
	return c.Set(ctx, key, result, DefaultSearchTTL)
}

// GetCachedSearchResult retrieves a cached search result
func (c *CacheService) GetCachedSearchResult(ctx context.Context, searchType string, query string, filters string, dest interface{}) error {
	key := fmt.Sprintf("%s%s:%s:%s", PrefixSearch, searchType, query, filters)
	return c.Get(ctx, key, dest)
}

// ==================== View Counters ====================

// IncrementViewCount increments the view count for an item
func (c *CacheService) IncrementViewCount(ctx context.Context, itemType string, itemID string) (int64, error) {
	key := fmt.Sprintf("%s%s:%s", PrefixViewCount, itemType, itemID)
	return c.client.Incr(ctx, key).Result()
}

// GetViewCount gets the current view count from cache
func (c *CacheService) GetViewCount(ctx context.Context, itemType string, itemID string) (int64, error) {
	key := fmt.Sprintf("%s%s:%s", PrefixViewCount, itemType, itemID)
	result, err := c.client.Get(ctx, key).Int64()
	if err == redis.Nil {
		return 0, nil
	}
	return result, err
}

// GetAllViewCounts retrieves all view counts for a type (for batch sync to DB)
func (c *CacheService) GetAllViewCounts(ctx context.Context, itemType string) (map[string]int64, error) {
	pattern := fmt.Sprintf("%s%s:*", PrefixViewCount, itemType)
	keys, err := c.client.Keys(ctx, pattern).Result()
	if err != nil {
		return nil, err
	}

	counts := make(map[string]int64)
	for _, key := range keys {
		val, err := c.client.Get(ctx, key).Int64()
		if err == nil {
			// Extract item ID from key
			itemID := key[len(fmt.Sprintf("%s%s:", PrefixViewCount, itemType)):]
			counts[itemID] = val
		}
	}
	return counts, nil
}

// ResetViewCount resets the view count (after syncing to DB)
func (c *CacheService) ResetViewCount(ctx context.Context, itemType string, itemID string) error {
	key := fmt.Sprintf("%s%s:%s", PrefixViewCount, itemType, itemID)
	return c.client.Del(ctx, key).Err()
}

// ==================== Session Management ====================

// StoreSession stores a user session
func (c *CacheService) StoreSession(ctx context.Context, userID string, sessionID string, sessionData interface{}) error {
	// Store the session data
	sessionKey := PrefixSession + sessionID
	if err := c.Set(ctx, sessionKey, sessionData, DefaultSessionTTL); err != nil {
		return err
	}

	// Add session ID to user's session set
	userSessionsKey := PrefixUserSessions + userID
	return c.client.SAdd(ctx, userSessionsKey, sessionID).Err()
}

// GetSession retrieves a session
func (c *CacheService) GetSession(ctx context.Context, sessionID string, dest interface{}) error {
	key := PrefixSession + sessionID
	return c.Get(ctx, key, dest)
}

// IsSessionValid checks if a session is valid
func (c *CacheService) IsSessionValid(ctx context.Context, sessionID string) (bool, error) {
	key := PrefixSession + sessionID
	return c.Exists(ctx, key)
}

// InvalidateSession removes a single session
func (c *CacheService) InvalidateSession(ctx context.Context, userID string, sessionID string) error {
	// Remove session data
	sessionKey := PrefixSession + sessionID
	if err := c.Delete(ctx, sessionKey); err != nil {
		return err
	}

	// Remove from user's session set
	userSessionsKey := PrefixUserSessions + userID
	return c.client.SRem(ctx, userSessionsKey, sessionID).Err()
}

// InvalidateAllUserSessions removes all sessions for a user (logout from all devices)
func (c *CacheService) InvalidateAllUserSessions(ctx context.Context, userID string) error {
	userSessionsKey := PrefixUserSessions + userID

	// Get all session IDs for the user
	sessionIDs, err := c.client.SMembers(ctx, userSessionsKey).Result()
	if err != nil {
		return err
	}

	// Delete all sessions
	for _, sessionID := range sessionIDs {
		sessionKey := PrefixSession + sessionID
		c.client.Del(ctx, sessionKey)
	}

	// Delete the user's session set
	return c.client.Del(ctx, userSessionsKey).Err()
}

// GetUserSessionCount returns the number of active sessions for a user
func (c *CacheService) GetUserSessionCount(ctx context.Context, userID string) (int64, error) {
	userSessionsKey := PrefixUserSessions + userID
	return c.client.SCard(ctx, userSessionsKey).Result()
}

// GetUserSessions returns all session IDs for a user
func (c *CacheService) GetUserSessions(ctx context.Context, userID string) ([]string, error) {
	userSessionsKey := PrefixUserSessions + userID
	return c.client.SMembers(ctx, userSessionsKey).Result()
}

// RefreshSession extends the TTL of a session
func (c *CacheService) RefreshSession(ctx context.Context, sessionID string) error {
	key := PrefixSession + sessionID
	return c.client.Expire(ctx, key, DefaultSessionTTL).Err()
}

// ==================== Cache Statistics ====================

// GetCacheStats returns cache statistics
func (c *CacheService) GetCacheStats(ctx context.Context) (map[string]interface{}, error) {
	info, err := c.client.Info(ctx, "memory", "stats", "keyspace").Result()
	if err != nil {
		return nil, err
	}

	// Count keys by prefix
	jobCount, _ := c.countKeys(ctx, PrefixJob+"*")
	jobListCount, _ := c.countKeys(ctx, PrefixJobList+"*")
	blogCount, _ := c.countKeys(ctx, PrefixBlog+"*")
	blogListCount, _ := c.countKeys(ctx, PrefixBlogList+"*")
	searchCount, _ := c.countKeys(ctx, PrefixSearch+"*")
	viewCount, _ := c.countKeys(ctx, PrefixViewCount+"*")
	sessionCount, _ := c.countKeys(ctx, PrefixSession+"*")
	userSessionCount, _ := c.countKeys(ctx, PrefixUserSessions+"*")
	categoryCount, _ := c.countKeys(ctx, PrefixCategory+"*")
	companyCount, _ := c.countKeys(ctx, PrefixCompany+"*")
	companyListCount, _ := c.countKeys(ctx, PrefixCompanyList+"*")
	locationCount, _ := c.countKeys(ctx, PrefixLocation+"*")
	rateLimitCount, _ := c.countKeys(ctx, "rate_limit:*")
	ipRateLimitCount, _ := c.countKeys(ctx, "ip_rate_limit:*")

	dbSize, _ := c.client.DBSize(ctx).Result()

	return map[string]interface{}{
		"total_keys":       dbSize,
		"job_cache":        jobCount,
		"job_list_cache":   jobListCount,
		"blog_cache":       blogCount,
		"blog_list_cache":  blogListCount,
		"search_cache":     searchCount,
		"view_counters":    viewCount,
		"sessions":         sessionCount,
		"user_sessions":    userSessionCount,
		"category_cache":   categoryCount,
		"company_cache":    companyCount,
		"company_list_cache": companyListCount,
		"location_cache":   locationCount,
		"rate_limits":      rateLimitCount + ipRateLimitCount,
		"redis_info":       info,
	}, nil
}

func (c *CacheService) countKeys(ctx context.Context, pattern string) (int64, error) {
	keys, err := c.client.Keys(ctx, pattern).Result()
	if err != nil {
		return 0, err
	}
	return int64(len(keys)), nil
}

// ==================== Key Management (Admin) ====================

// KeyInfo represents information about a cache key
type KeyInfo struct {
	Key   string `json:"key"`
	Type  string `json:"type"`
	TTL   int64  `json:"ttl"` // TTL in seconds, -1 means no expiry, -2 means key doesn't exist
	Size  int64  `json:"size"` // Approximate size in bytes
}

// SearchKeys searches for keys matching a pattern
func (c *CacheService) SearchKeys(ctx context.Context, pattern string, limit int) ([]KeyInfo, error) {
	if pattern == "" {
		pattern = "*"
	}

	keys, err := c.client.Keys(ctx, pattern).Result()
	if err != nil {
		return nil, err
	}

	// Limit results
	if limit > 0 && len(keys) > limit {
		keys = keys[:limit]
	}

	keyInfos := make([]KeyInfo, 0, len(keys))
	for _, key := range keys {
		info := KeyInfo{Key: key}

		// Get key type
		keyType, err := c.client.Type(ctx, key).Result()
		if err == nil {
			info.Type = keyType
		}

		// Get TTL
		ttl, err := c.client.TTL(ctx, key).Result()
		if err == nil {
			info.TTL = int64(ttl.Seconds())
		}

		// Get approximate size based on type
		switch keyType {
		case "string":
			strlen, _ := c.client.StrLen(ctx, key).Result()
			info.Size = strlen
		case "list":
			llen, _ := c.client.LLen(ctx, key).Result()
			info.Size = llen // Count of elements
		case "set":
			scard, _ := c.client.SCard(ctx, key).Result()
			info.Size = scard
		case "hash":
			hlen, _ := c.client.HLen(ctx, key).Result()
			info.Size = hlen
		case "zset":
			zcard, _ := c.client.ZCard(ctx, key).Result()
			info.Size = zcard
		}

		keyInfos = append(keyInfos, info)
	}

	return keyInfos, nil
}

// GetKeyValue retrieves the value of a key
func (c *CacheService) GetKeyValue(ctx context.Context, key string) (interface{}, string, int64, error) {
	keyType, err := c.client.Type(ctx, key).Result()
	if err != nil {
		return nil, "", 0, err
	}

	ttl, _ := c.client.TTL(ctx, key).Result()
	ttlSeconds := int64(ttl.Seconds())

	var value interface{}
	switch keyType {
	case "string":
		value, err = c.client.Get(ctx, key).Result()
	case "list":
		value, err = c.client.LRange(ctx, key, 0, -1).Result()
	case "set":
		value, err = c.client.SMembers(ctx, key).Result()
	case "hash":
		value, err = c.client.HGetAll(ctx, key).Result()
	case "zset":
		value, err = c.client.ZRangeWithScores(ctx, key, 0, -1).Result()
	default:
		return nil, keyType, ttlSeconds, fmt.Errorf("unsupported key type: %s", keyType)
	}

	if err != nil {
		return nil, keyType, ttlSeconds, err
	}

	return value, keyType, ttlSeconds, nil
}

// SetKeyValue sets a string value for a key
func (c *CacheService) SetKeyValue(ctx context.Context, key string, value string, ttlSeconds int) error {
	var ttl time.Duration
	if ttlSeconds > 0 {
		ttl = time.Duration(ttlSeconds) * time.Second
	}
	return c.client.Set(ctx, key, value, ttl).Err()
}

// DeleteKey deletes a specific key
func (c *CacheService) DeleteKey(ctx context.Context, key string) error {
	return c.client.Del(ctx, key).Err()
}

// UpdateKeyTTL updates the TTL of a key
func (c *CacheService) UpdateKeyTTL(ctx context.Context, key string, ttlSeconds int) error {
	if ttlSeconds <= 0 {
		return c.client.Persist(ctx, key).Err()
	}
	return c.client.Expire(ctx, key, time.Duration(ttlSeconds)*time.Second).Err()
}

// InvalidateCompanyCaches clears all company-related caches (for admin use)
func (c *CacheService) InvalidateCompanyCaches(ctx context.Context) error {
	if err := c.DeletePattern(ctx, PrefixCompany+"*"); err != nil {
		return err
	}
	return c.DeletePattern(ctx, PrefixCompanyList+"*")
}

// InvalidateCategoryCaches clears all category caches
func (c *CacheService) InvalidateCategoryCaches(ctx context.Context) error {
	return c.DeletePattern(ctx, PrefixCategory+"*")
}

// InvalidateLocationCaches clears all location caches
func (c *CacheService) InvalidateLocationCaches(ctx context.Context) error {
	return c.DeletePattern(ctx, PrefixLocation+"*")
}

// InvalidateSessionCaches clears all session caches
func (c *CacheService) InvalidateSessionCaches(ctx context.Context) error {
	if err := c.DeletePattern(ctx, PrefixSession+"*"); err != nil {
		return err
	}
	return c.DeletePattern(ctx, PrefixUserSessions+"*")
}

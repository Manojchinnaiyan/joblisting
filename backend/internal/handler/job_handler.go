package handler

import (
	"context"
	"errors"
	"job-platform/internal/cache"
	"job-platform/internal/domain"
	"job-platform/internal/dto"
	"job-platform/internal/middleware"
	"job-platform/internal/repository"
	"job-platform/internal/search"
	"job-platform/internal/service"
	"job-platform/internal/util/response"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// JobHandler handles public job endpoints
type JobHandler struct {
	jobService      *service.JobService
	categoryService *service.JobCategoryService
	savedJobService *service.SavedJobService
	meiliClient     *search.MeiliClient
	cacheService    *cache.CacheService
}

// NewJobHandler creates a new job handler
func NewJobHandler(
	jobService *service.JobService,
	categoryService *service.JobCategoryService,
	savedJobService *service.SavedJobService,
	meiliClient *search.MeiliClient,
	cacheService *cache.CacheService,
) *JobHandler {
	return &JobHandler{
		jobService:      jobService,
		categoryService: categoryService,
		savedJobService: savedJobService,
		meiliClient:     meiliClient,
		cacheService:    cacheService,
	}
}

// ListJobs retrieves all active jobs with pagination and filters
// GET /api/v1/jobs
func (h *JobHandler) ListJobs(c *gin.Context) {
	// Parse pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	offset := (page - 1) * limit

	// Parse filters
	filters := repository.JobFilters{
		Query:    c.Query("q"),
		Location: c.Query("location"),
	}

	// Parse job_type filter (can be multiple)
	jobTypes := c.QueryArray("job_type")
	for _, jt := range jobTypes {
		filters.JobTypes = append(filters.JobTypes, domain.JobType(jt))
	}

	// Parse experience_level filter (can be multiple)
	experienceLevels := c.QueryArray("experience_level")
	for _, el := range experienceLevels {
		filters.ExperienceLevels = append(filters.ExperienceLevels, domain.ExperienceLevel(el))
	}

	// Parse workplace_type filter (can be multiple)
	workplaceTypes := c.QueryArray("workplace_type")
	for _, wt := range workplaceTypes {
		filters.WorkplaceTypes = append(filters.WorkplaceTypes, domain.WorkplaceType(wt))
	}

	// Parse salary filters
	if salaryMin := c.Query("salary_min"); salaryMin != "" {
		if val, err := strconv.Atoi(salaryMin); err == nil {
			filters.SalaryMin = &val
		}
	}
	if salaryMax := c.Query("salary_max"); salaryMax != "" {
		if val, err := strconv.Atoi(salaryMax); err == nil {
			filters.SalaryMax = &val
		}
	}

	// Parse category filter
	if category := c.Query("category"); category != "" {
		filters.CategorySlug = category
	}

	// Build cache key from filters
	cacheKey := h.buildJobListCacheKey(filters, page, limit)
	ctx := context.Background()

	// Try to get from cache first (only for unauthenticated requests without saved job status)
	var userID *uuid.UUID
	if user, err := middleware.GetUserFromContext(c); err == nil {
		userID = &user.ID
	}

	// Only use cache for anonymous users (no saved job status needed)
	if userID == nil && h.cacheService != nil && h.cacheService.IsAvailable() {
		var cachedResponse dto.JobListResponse
		if err := h.cacheService.GetCachedJobList(ctx, cacheKey, &cachedResponse); err == nil {
			response.OK(c, "Jobs retrieved successfully", cachedResponse)
			return
		}
	}

	// Get jobs with filters from database
	jobs, total, err := h.jobService.GetFilteredJobs(filters, limit, offset)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	// Convert to response
	jobsResponse := dto.ToJobListResponse(jobs, total, page, limit, userID)

	// Cache the response for anonymous users
	if userID == nil && h.cacheService != nil && h.cacheService.IsAvailable() {
		_ = h.cacheService.CacheJobList(ctx, cacheKey, jobsResponse)
	}

	response.OK(c, "Jobs retrieved successfully", jobsResponse)
}

// buildJobListCacheKey creates a unique cache key based on filters
func (h *JobHandler) buildJobListCacheKey(filters repository.JobFilters, page, limit int) string {
	// Build a deterministic cache key from filters
	parts := []string{
		"p:" + strconv.Itoa(page),
		"l:" + strconv.Itoa(limit),
	}

	if filters.Query != "" {
		parts = append(parts, "q:"+filters.Query)
	}
	if filters.Location != "" {
		parts = append(parts, "loc:"+filters.Location)
	}
	if filters.CategorySlug != "" {
		parts = append(parts, "cat:"+filters.CategorySlug)
	}
	if len(filters.JobTypes) > 0 {
		typeStrs := make([]string, len(filters.JobTypes))
		for i, jt := range filters.JobTypes {
			typeStrs[i] = string(jt)
		}
		parts = append(parts, "jt:"+strings.Join(typeStrs, ","))
	}
	if len(filters.ExperienceLevels) > 0 {
		expStrs := make([]string, len(filters.ExperienceLevels))
		for i, el := range filters.ExperienceLevels {
			expStrs[i] = string(el)
		}
		parts = append(parts, "exp:"+strings.Join(expStrs, ","))
	}
	if len(filters.WorkplaceTypes) > 0 {
		wpStrs := make([]string, len(filters.WorkplaceTypes))
		for i, wt := range filters.WorkplaceTypes {
			wpStrs[i] = string(wt)
		}
		parts = append(parts, "wp:"+strings.Join(wpStrs, ","))
	}
	if filters.SalaryMin != nil {
		parts = append(parts, "smin:"+strconv.Itoa(*filters.SalaryMin))
	}
	if filters.SalaryMax != nil {
		parts = append(parts, "smax:"+strconv.Itoa(*filters.SalaryMax))
	}

	return strings.Join(parts, "|")
}

// GetJobBySlug retrieves a job by slug
// GET /api/v1/jobs/:slug
func (h *JobHandler) GetJobBySlug(c *gin.Context) {
	slug := c.Param("slug")
	ctx := context.Background()

	// Get current user ID if authenticated
	var userID *uuid.UUID
	if user, err := middleware.GetUserFromContext(c); err == nil {
		userID = &user.ID
	}

	// Try to get from cache first (for anonymous users)
	if userID == nil && h.cacheService != nil && h.cacheService.IsAvailable() {
		var cachedResponse dto.JobResponse
		if err := h.cacheService.Get(ctx, "job:slug:"+slug, &cachedResponse); err == nil {
			// Increment view count
			_, _ = h.cacheService.IncrementViewCount(ctx, "job", cachedResponse.ID)
			response.OK(c, "Job retrieved successfully", cachedResponse)
			return
		}
	}

	// Get job from database
	job, err := h.jobService.GetJobBySlug(slug)
	if err != nil {
		response.NotFound(c, domain.ErrJobNotFound)
		return
	}

	// Increment view count via Redis cache (faster, batched sync to DB later)
	if h.cacheService != nil && h.cacheService.IsAvailable() {
		_, _ = h.cacheService.IncrementViewCount(ctx, "job", job.ID.String())
	} else {
		// Fallback to direct DB recording
		ip := c.ClientIP()
		userAgent := c.GetHeader("User-Agent")
		referrer := c.GetHeader("Referer")
		_ = h.jobService.RecordJobView(job.ID, userID, ip, userAgent, referrer)
	}

	// Convert to response
	jobResponse := dto.ToJobResponse(job, userID)

	// Check if saved by user
	if userID != nil {
		isSaved, _ := h.savedJobService.IsJobSaved(*userID, job.ID)
		jobResponse.IsSaved = &isSaved
	}

	// Cache the job for anonymous users
	if userID == nil && h.cacheService != nil && h.cacheService.IsAvailable() {
		_ = h.cacheService.CacheJob(ctx, "slug:"+slug, jobResponse)
	}

	response.OK(c, "Job retrieved successfully", jobResponse)
}

// GetFeaturedJobs retrieves featured jobs
// GET /api/v1/jobs/featured
func (h *JobHandler) GetFeaturedJobs(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if limit < 1 || limit > 50 {
		limit = 10
	}

	ctx := context.Background()
	cacheKey := "featured:" + strconv.Itoa(limit)

	// Get current user ID if authenticated
	var userID *uuid.UUID
	if user, err := middleware.GetUserFromContext(c); err == nil {
		userID = &user.ID
	}

	// Try cache for anonymous users
	if userID == nil && h.cacheService != nil && h.cacheService.IsAvailable() {
		var cachedJobs []dto.JobResponse
		if err := h.cacheService.GetCachedJobList(ctx, cacheKey, &cachedJobs); err == nil {
			response.OK(c, "Featured jobs retrieved successfully", gin.H{
				"jobs": cachedJobs,
			})
			return
		}
	}

	// Get featured jobs from database
	jobs, err := h.jobService.GetFeaturedJobs(limit)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	// Convert to response
	jobResponses := make([]dto.JobResponse, len(jobs))
	for i, job := range jobs {
		jobResponses[i] = dto.ToJobResponse(&job, userID)
	}

	// Cache for anonymous users (30 min TTL for featured jobs)
	if userID == nil && h.cacheService != nil && h.cacheService.IsAvailable() {
		_ = h.cacheService.CacheFeaturedJobs(ctx, cacheKey, jobResponses)
	}

	response.OK(c, "Featured jobs retrieved successfully", gin.H{
		"jobs": jobResponses,
	})
}

// GetCategories retrieves all job categories
// GET /api/v1/jobs/categories
func (h *JobHandler) GetCategories(c *gin.Context) {
	// Check if tree structure is requested
	tree := c.DefaultQuery("tree", "false")
	ctx := context.Background()

	if tree == "true" {
		cacheKey := "tree"
		// Try cache first
		if h.cacheService != nil && h.cacheService.IsAvailable() {
			var cached dto.CategoryTreeListResponse
			if err := h.cacheService.GetCachedCategories(ctx, cacheKey, &cached); err == nil {
				response.OK(c, "Categories retrieved successfully", cached)
				return
			}
		}

		// Get category tree from database
		categories, err := h.categoryService.GetCategoryTree()
		if err != nil {
			response.InternalError(c, err)
			return
		}

		categoryResponse := dto.ToCategoryTreeListResponse(categories)

		// Cache the response
		if h.cacheService != nil && h.cacheService.IsAvailable() {
			_ = h.cacheService.CacheCategories(ctx, cacheKey, categoryResponse)
		}

		response.OK(c, "Categories retrieved successfully", categoryResponse)
	} else {
		cacheKey := "flat"
		// Try cache first
		if h.cacheService != nil && h.cacheService.IsAvailable() {
			var cached dto.CategoryListResponse
			if err := h.cacheService.GetCachedCategories(ctx, cacheKey, &cached); err == nil {
				response.OK(c, "Categories retrieved successfully", cached)
				return
			}
		}

		// Get flat list from database
		categories, err := h.categoryService.GetAllCategories()
		if err != nil {
			response.InternalError(c, err)
			return
		}

		categoryResponse := dto.ToCategoryListResponse(categories)

		// Cache the response
		if h.cacheService != nil && h.cacheService.IsAvailable() {
			_ = h.cacheService.CacheCategories(ctx, cacheKey, categoryResponse)
		}

		response.OK(c, "Categories retrieved successfully", categoryResponse)
	}
}

// GetLocations retrieves available job locations
// GET /api/v1/jobs/locations
func (h *JobHandler) GetLocations(c *gin.Context) {
	// Get unique locations from active jobs
	limit := 100 // Max number of locations to return
	if l, ok := c.GetQuery("limit"); ok {
		if parsedLimit, err := strconv.Atoi(l); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	ctx := context.Background()

	// Try cache first
	if h.cacheService != nil && h.cacheService.IsAvailable() {
		var cached []string
		if err := h.cacheService.GetCachedLocations(ctx, &cached); err == nil {
			// Apply limit to cached result
			if len(cached) > limit {
				cached = cached[:limit]
			}
			response.OK(c, "Locations retrieved successfully", gin.H{
				"locations": cached,
				"count":     len(cached),
			})
			return
		}
	}

	locations, err := h.jobService.GetLocations(limit)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, errors.New("failed to fetch locations"), nil)
		return
	}

	// Cache the locations
	if h.cacheService != nil && h.cacheService.IsAvailable() {
		_ = h.cacheService.CacheLocations(ctx, locations)
	}

	response.OK(c, "Locations retrieved successfully", gin.H{
		"locations": locations,
		"count":     len(locations),
	})
}

// GetJobsForSitemap retrieves all active jobs for sitemap generation
// GET /api/v1/jobs/sitemap
func (h *JobHandler) GetJobsForSitemap(c *gin.Context) {
	// Get all active jobs with minimal data for sitemap
	jobs, err := h.jobService.GetJobsForSitemap()
	if err != nil {
		response.InternalError(c, err)
		return
	}

	// Return simple response with slug and updated_at
	type SitemapJob struct {
		Slug      string `json:"slug"`
		UpdatedAt string `json:"updated_at"`
	}

	sitemapJobs := make([]SitemapJob, len(jobs))
	for i, job := range jobs {
		sitemapJobs[i] = SitemapJob{
			Slug:      job.Slug,
			UpdatedAt: job.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		}
	}

	response.OK(c, "Jobs for sitemap retrieved successfully", gin.H{
		"jobs":  sitemapJobs,
		"total": len(sitemapJobs),
	})
}

// SearchJobs searches jobs using MeiliSearch
// GET /api/v1/jobs/search
func (h *JobHandler) SearchJobs(c *gin.Context) {
	// Parse query parameters
	query := c.Query("query")
	location := c.Query("location")
	jobType := c.Query("job_type")
	experienceLevel := c.Query("experience_level")
	workplaceType := c.Query("workplace_type")
	skillsStr := c.Query("skills")
	salaryMinStr := c.Query("salary_min")
	salaryMaxStr := c.Query("salary_max")
	sortBy := c.DefaultQuery("sort_by", "published_at")
	sortOrder := c.DefaultQuery("sort_order", "desc")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	offset := (page - 1) * limit

	// If MeiliSearch is not available, fall back to database search
	if h.meiliClient == nil {
		jobs, total, err := h.jobService.GetActiveJobs(limit, offset)
		if err != nil {
			response.InternalError(c, err)
			return
		}

		var userID *uuid.UUID
		if user, err := middleware.GetUserFromContext(c); err == nil {
			userID = &user.ID
		}

		jobsResponse := dto.ToJobListResponse(jobs, total, page, limit, userID)
		response.OK(c, "Search results retrieved successfully", jobsResponse)
		return
	}

	// Parse skills
	var skills []string
	if skillsStr != "" {
		skills = strings.Split(skillsStr, ",")
		for i := range skills {
			skills[i] = strings.TrimSpace(skills[i])
		}
	}

	// Parse salary
	salaryMin, _ := strconv.Atoi(salaryMinStr)
	salaryMax, _ := strconv.Atoi(salaryMaxStr)

	// Build search filters
	filters := &search.JobSearchFilters{
		JobType:         jobType,
		ExperienceLevel: experienceLevel,
		WorkplaceType:   workplaceType,
		Location:        location,
		SalaryMin:       salaryMin,
		SalaryMax:       salaryMax,
		Skills:          skills,
		SortBy:          sortBy,
		SortOrder:       sortOrder,
		Offset:          offset,
		Limit:           limit,
	}

	// Search using MeiliSearch
	result, err := h.meiliClient.SearchJobs(query, filters)
	if err != nil {
		// Fall back to database search on error
		jobs, total, dbErr := h.jobService.GetActiveJobs(limit, offset)
		if dbErr != nil {
			response.InternalError(c, dbErr)
			return
		}

		var userID *uuid.UUID
		if user, err := middleware.GetUserFromContext(c); err == nil {
			userID = &user.ID
		}

		jobsResponse := dto.ToJobListResponse(jobs, total, page, limit, userID)
		response.OK(c, "Search results retrieved successfully", jobsResponse)
		return
	}

	// Calculate total pages
	totalPages := int(result.TotalHits) / limit
	if int(result.TotalHits)%limit > 0 {
		totalPages++
	}

	response.OK(c, "Search results retrieved successfully", gin.H{
		"jobs":              result.Hits,
		"total":             result.TotalHits,
		"page":              page,
		"limit":             limit,
		"total_pages":       totalPages,
		"query":             result.Query,
		"processing_time_ms": result.ProcessingTimeMs,
	})
}

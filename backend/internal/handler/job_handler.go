package handler

import (
	"errors"
	"job-platform/internal/domain"
	"job-platform/internal/dto"
	"job-platform/internal/middleware"
	"job-platform/internal/repository"
	"job-platform/internal/service"
	"job-platform/internal/util/response"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// JobHandler handles public job endpoints
type JobHandler struct {
	jobService      *service.JobService
	categoryService *service.JobCategoryService
	savedJobService *service.SavedJobService
}

// NewJobHandler creates a new job handler
func NewJobHandler(
	jobService *service.JobService,
	categoryService *service.JobCategoryService,
	savedJobService *service.SavedJobService,
) *JobHandler {
	return &JobHandler{
		jobService:      jobService,
		categoryService: categoryService,
		savedJobService: savedJobService,
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

	// Get jobs with filters
	jobs, total, err := h.jobService.GetFilteredJobs(filters, limit, offset)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	// Get current user ID if authenticated
	var userID *uuid.UUID
	if user, err := middleware.GetUserFromContext(c); err == nil {
		userID = &user.ID
	}

	// Convert to response
	jobsResponse := dto.ToJobListResponse(jobs, total, page, limit, userID)

	response.OK(c, "Jobs retrieved successfully", jobsResponse)
}

// GetJobBySlug retrieves a job by slug
// GET /api/v1/jobs/:slug
func (h *JobHandler) GetJobBySlug(c *gin.Context) {
	slug := c.Param("slug")

	// Get job
	job, err := h.jobService.GetJobBySlug(slug)
	if err != nil {
		response.NotFound(c, domain.ErrJobNotFound)
		return
	}

	// Get current user ID if authenticated
	var userID *uuid.UUID
	if user, err := middleware.GetUserFromContext(c); err == nil {
		userID = &user.ID
	}

	// Record view
	ip := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")
	referrer := c.GetHeader("Referer")
	_ = h.jobService.RecordJobView(job.ID, userID, ip, userAgent, referrer)

	// Convert to response
	jobResponse := dto.ToJobResponse(job, userID)

	// Check if saved by user
	if userID != nil {
		isSaved, _ := h.savedJobService.IsJobSaved(*userID, job.ID)
		jobResponse.IsSaved = &isSaved
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

	// Get featured jobs
	jobs, err := h.jobService.GetFeaturedJobs(limit)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	// Get current user ID if authenticated
	var userID *uuid.UUID
	if user, err := middleware.GetUserFromContext(c); err == nil {
		userID = &user.ID
	}

	// Convert to response
	jobResponses := make([]dto.JobResponse, len(jobs))
	for i, job := range jobs {
		jobResponses[i] = dto.ToJobResponse(&job, userID)
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

	if tree == "true" {
		// Get category tree
		categories, err := h.categoryService.GetCategoryTree()
		if err != nil {
			response.InternalError(c, err)
			return
		}

		categoryResponse := dto.ToCategoryTreeListResponse(categories)
		response.OK(c, "Categories retrieved successfully", categoryResponse)
	} else {
		// Get flat list
		categories, err := h.categoryService.GetAllCategories()
		if err != nil {
			response.InternalError(c, err)
			return
		}

		categoryResponse := dto.ToCategoryListResponse(categories)
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

	locations, err := h.jobService.GetLocations(limit)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, errors.New("failed to fetch locations"), nil)
		return
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

// SearchJobs searches jobs (placeholder - will be implemented with Meilisearch)
// GET /api/v1/jobs/search
func (h *JobHandler) SearchJobs(c *gin.Context) {
	// Parse query parameters
	_ = c.Query("query")     // TODO: Use with Meilisearch
	_ = c.Query("location")  // TODO: Use with Meilisearch
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	offset := (page - 1) * limit

	// For now, just return active jobs (TODO: Implement Meilisearch)
	jobs, total, err := h.jobService.GetActiveJobs(limit, offset)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	// Get current user ID if authenticated
	var userID *uuid.UUID
	if user, err := middleware.GetUserFromContext(c); err == nil {
		userID = &user.ID
	}

	// Convert to response
	jobsResponse := dto.ToJobListResponse(jobs, total, page, limit, userID)

	response.OK(c, "Search results retrieved successfully", jobsResponse)
}

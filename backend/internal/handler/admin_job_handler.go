package handler

import (
	"context"
	"job-platform/internal/domain"
	"job-platform/internal/dto"
	"job-platform/internal/middleware"
	"job-platform/internal/repository"
	"job-platform/internal/service"
	"job-platform/internal/util/response"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// AdminJobHandler handles admin job management endpoints
type AdminJobHandler struct {
	jobService         *service.JobService
	applicationService *service.ApplicationService
	categoryService    *service.JobCategoryService
	searchService      *service.SearchService
}

// NewAdminJobHandler creates a new admin job handler
func NewAdminJobHandler(
	jobService *service.JobService,
	applicationService *service.ApplicationService,
	categoryService *service.JobCategoryService,
	searchService *service.SearchService,
) *AdminJobHandler {
	return &AdminJobHandler{
		jobService:         jobService,
		applicationService: applicationService,
		categoryService:    categoryService,
		searchService:      searchService,
	}
}

// GetAllJobs retrieves all jobs (admin view)
// GET /api/v1/admin/jobs
func (h *AdminJobHandler) GetAllJobs(c *gin.Context) {
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
	filters := make(map[string]interface{})

	if status := c.Query("status"); status != "" {
		filters["status"] = status
	}
	if search := c.Query("search"); search != "" {
		filters["search"] = search
	}
	if isFeatured := c.Query("is_featured"); isFeatured == "true" {
		filters["is_featured"] = true
	} else if isFeatured == "false" {
		filters["is_featured"] = false
	}
	if employerIDStr := c.Query("employer_id"); employerIDStr != "" {
		if id, err := uuid.Parse(employerIDStr); err == nil {
			filters["employer_id"] = id
		}
	}
	// Note: Job uses denormalized company_name, not a direct company relation

	// Get jobs with filters
	jobs, total, err := h.jobService.ListJobs(filters, limit, offset)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	// Convert to response
	jobsResponse := dto.ToJobListResponse(jobs, total, page, limit, nil)

	response.OK(c, "Jobs retrieved successfully", jobsResponse)
}

// GetJobByID retrieves a specific job (admin view)
// GET /api/v1/admin/jobs/:id
func (h *AdminJobHandler) GetJobByID(c *gin.Context) {
	// Parse job ID
	jobIDStr := c.Param("id")
	jobID, err := uuid.Parse(jobIDStr)
	if err != nil {
		response.BadRequest(c, domain.ErrInvalidJobID)
		return
	}

	// Get job
	job, err := h.jobService.GetJobByID(jobID)
	if err != nil {
		if err == domain.ErrJobNotFound {
			response.NotFound(c, err)
			return
		}
		response.InternalError(c, err)
		return
	}

	// Convert to response
	jobResponse := dto.ToJobResponse(job, nil)

	response.OK(c, "Job retrieved successfully", jobResponse)
}

// ApproveJob approves a pending job
// POST /api/v1/admin/jobs/:id/approve
func (h *AdminJobHandler) ApproveJob(c *gin.Context) {
	// Get current user (admin)
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	// Parse job ID
	jobIDStr := c.Param("id")
	jobID, err := uuid.Parse(jobIDStr)
	if err != nil {
		response.BadRequest(c, domain.ErrInvalidJobID)
		return
	}

	// Approve job
	err = h.jobService.ApproveJob(jobID, user.ID)
	if err != nil {
		if err == domain.ErrJobNotFound {
			response.NotFound(c, err)
			return
		}
		response.InternalError(c, err)
		return
	}

	// Get updated job
	job, err := h.jobService.GetJobByID(jobID)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	// Convert to response
	jobResponse := dto.ToJobResponse(job, nil)

	response.OK(c, "Job approved successfully", jobResponse)
}

// RejectJob rejects a pending job
// POST /api/v1/admin/jobs/:id/reject
func (h *AdminJobHandler) RejectJob(c *gin.Context) {
	// Get current user (admin)
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	// Parse job ID
	jobIDStr := c.Param("id")
	jobID, err := uuid.Parse(jobIDStr)
	if err != nil {
		response.BadRequest(c, domain.ErrInvalidJobID)
		return
	}

	// Parse request
	var req dto.RejectJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err)
		return
	}

	// Reject job
	err = h.jobService.RejectJob(jobID, user.ID, req.Reason)
	if err != nil {
		if err == domain.ErrJobNotFound {
			response.NotFound(c, err)
			return
		}
		response.InternalError(c, err)
		return
	}

	// Get updated job
	job, err := h.jobService.GetJobByID(jobID)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	// Convert to response
	jobResponse := dto.ToJobResponse(job, nil)

	response.OK(c, "Job rejected successfully", jobResponse)
}

// FeatureJob features a job
// POST /api/v1/admin/jobs/:id/feature
func (h *AdminJobHandler) FeatureJob(c *gin.Context) {
	// Parse job ID
	jobIDStr := c.Param("id")
	jobID, err := uuid.Parse(jobIDStr)
	if err != nil {
		response.BadRequest(c, domain.ErrInvalidJobID)
		return
	}

	// Parse request
	var req dto.FeatureJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err)
		return
	}

	// Parse until date
	untilDate, err := time.Parse("2006-01-02", req.UntilDate)
	if err != nil {
		response.BadRequest(c, domain.ErrInvalidDate)
		return
	}

	// Feature job
	err = h.jobService.FeatureJob(jobID, untilDate)
	if err != nil {
		if err == domain.ErrJobNotFound {
			response.NotFound(c, err)
			return
		}
		response.InternalError(c, err)
		return
	}

	// Get updated job
	job, err := h.jobService.GetJobByID(jobID)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	// Convert to response
	jobResponse := dto.ToJobResponse(job, nil)

	response.OK(c, "Job featured successfully", jobResponse)
}

// UnfeatureJob removes featured status from a job
// POST /api/v1/admin/jobs/:id/unfeature
func (h *AdminJobHandler) UnfeatureJob(c *gin.Context) {
	// Parse job ID
	jobIDStr := c.Param("id")
	jobID, err := uuid.Parse(jobIDStr)
	if err != nil {
		response.BadRequest(c, domain.ErrInvalidJobID)
		return
	}

	// Unfeature job
	err = h.jobService.UnfeatureJob(jobID)
	if err != nil {
		if err == domain.ErrJobNotFound {
			response.NotFound(c, err)
			return
		}
		response.InternalError(c, err)
		return
	}

	// Get updated job
	job, err := h.jobService.GetJobByID(jobID)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	// Convert to response
	jobResponse := dto.ToJobResponse(job, nil)

	response.OK(c, "Job unfeatured successfully", jobResponse)
}

// DeleteJob permanently deletes a job (admin)
// DELETE /api/v1/admin/jobs/:id
func (h *AdminJobHandler) DeleteJob(c *gin.Context) {
	// Parse job ID
	jobIDStr := c.Param("id")
	jobID, err := uuid.Parse(jobIDStr)
	if err != nil {
		response.BadRequest(c, domain.ErrInvalidJobID)
		return
	}

	// Get job to verify ownership (admin can delete any job)
	job, err := h.jobService.GetJobByID(jobID)
	if err != nil {
		if err == domain.ErrJobNotFound {
			response.NotFound(c, err)
			return
		}
		response.InternalError(c, err)
		return
	}

	// Admin can delete any job, so we pass the job's employer ID
	err = h.jobService.DeleteJob(jobID, job.EmployerID)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	response.OK(c, "Job deleted successfully", nil)
}

// CreateJob creates a new job (admin only)
// POST /api/v1/admin/jobs
func (h *AdminJobHandler) CreateJob(c *gin.Context) {
	// Get current user (admin)
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	// Parse request
	var req dto.AdminCreateJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err)
		return
	}

	// Parse category IDs
	var categoryIDs []uuid.UUID
	for _, idStr := range req.CategoryIDs {
		id, err := uuid.Parse(idStr)
		if err != nil {
			response.BadRequest(c, domain.ErrInvalidCategoryID)
			return
		}
		categoryIDs = append(categoryIDs, id)
	}

	// Create job input
	input := service.AdminCreateJobInput{
		CreateJobInput: service.CreateJobInput{
			Title:              req.Title,
			Description:        req.Description,
			ShortDescription:   req.ShortDescription,
			JobType:            domain.JobType(req.JobType),
			ExperienceLevel:    domain.ExperienceLevel(req.ExperienceLevel),
			WorkplaceType:      domain.WorkplaceType(req.WorkplaceType),
			Location:           req.Location,
			City:               req.City,
			State:              req.State,
			Country:            req.Country,
			Latitude:           req.Latitude,
			Longitude:          req.Longitude,
			SalaryMin:          req.SalaryMin,
			SalaryMax:          req.SalaryMax,
			SalaryCurrency:     req.SalaryCurrency,
			SalaryPeriod:       req.SalaryPeriod,
			HideSalary:         req.HideSalary,
			Skills:             req.Skills,
			Education:          req.Education,
			YearsExperienceMin: req.YearsExperienceMin,
			YearsExperienceMax: req.YearsExperienceMax,
			Benefits:           req.Benefits,
			CategoryIDs:        categoryIDs,
			ApplicationURL:     req.ApplicationURL,
			ApplicationEmail:   req.ApplicationEmail,
		},
		CompanyName:    req.CompanyName,
		CompanyLogoURL: req.CompanyLogoURL,
		Status:         req.Status,
	}

	// Create job
	job, err := h.jobService.AdminCreateJob(user.ID, input)
	if err != nil {
		if err == domain.ErrInvalidRole {
			response.Forbidden(c, err)
			return
		}
		response.InternalError(c, err)
		return
	}

	// Convert to response
	jobResponse := dto.ToJobResponse(job, nil)

	response.Created(c, "Job created successfully", jobResponse)
}

// UpdateJob updates an existing job (admin only)
// PUT /api/v1/admin/jobs/:id
func (h *AdminJobHandler) UpdateJob(c *gin.Context) {
	// Parse job ID
	jobIDStr := c.Param("id")
	jobID, err := uuid.Parse(jobIDStr)
	if err != nil {
		response.BadRequest(c, domain.ErrInvalidJobID)
		return
	}

	// Parse request
	var req dto.AdminUpdateJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err)
		return
	}

	// Parse category IDs if provided
	var categoryIDs []uuid.UUID
	if req.CategoryIDs != nil {
		for _, idStr := range *req.CategoryIDs {
			id, err := uuid.Parse(idStr)
			if err != nil {
				response.BadRequest(c, domain.ErrInvalidCategoryID)
				return
			}
			categoryIDs = append(categoryIDs, id)
		}
	}

	// Build update input
	input := service.AdminUpdateJobInput{
		UpdateJobInput: service.UpdateJobInput{
			Title:            req.Title,
			Description:      req.Description,
			ShortDescription: req.ShortDescription,
			Location:         req.Location,
			City:             req.City,
			State:            req.State,
			Country:          req.Country,
			Latitude:         req.Latitude,
			Longitude:        req.Longitude,
			SalaryMin:        req.SalaryMin,
			SalaryMax:        req.SalaryMax,
			SalaryCurrency:   req.SalaryCurrency,
			SalaryPeriod:     req.SalaryPeriod,
			HideSalary:       req.HideSalary,
			Education:        req.Education,
			YearsExperienceMin: req.YearsExperienceMin,
			YearsExperienceMax: req.YearsExperienceMax,
			ApplicationURL:   req.ApplicationURL,
			ApplicationEmail: req.ApplicationEmail,
		},
		CompanyName:    req.CompanyName,
		CompanyLogoURL: req.CompanyLogoURL,
		Status:         req.Status,
	}

	// Handle job type
	if req.JobType != nil {
		jobType := domain.JobType(*req.JobType)
		input.JobType = &jobType
	}

	// Handle experience level
	if req.ExperienceLevel != nil {
		expLevel := domain.ExperienceLevel(*req.ExperienceLevel)
		input.ExperienceLevel = &expLevel
	}

	// Handle workplace type
	if req.WorkplaceType != nil {
		wpType := domain.WorkplaceType(*req.WorkplaceType)
		input.WorkplaceType = &wpType
	}

	// Handle skills
	if req.Skills != nil {
		input.Skills = *req.Skills
	}

	// Handle benefits
	if req.Benefits != nil {
		input.Benefits = *req.Benefits
	}

	// Handle categories
	if req.CategoryIDs != nil {
		input.CategoryIDs = categoryIDs
	}

	// Update job
	job, err := h.jobService.AdminUpdateJob(jobID, input)
	if err != nil {
		if err == domain.ErrJobNotFound {
			response.NotFound(c, err)
			return
		}
		response.InternalError(c, err)
		return
	}

	// Convert to response
	jobResponse := dto.ToJobResponse(job, nil)

	response.OK(c, "Job updated successfully", jobResponse)
}

// GetPendingJobs retrieves all pending jobs awaiting approval
// GET /api/v1/admin/jobs/pending
func (h *AdminJobHandler) GetPendingJobs(c *gin.Context) {
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

	// Get pending jobs
	jobs, total, err := h.jobService.GetPendingJobs(limit, offset)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	// Convert to response
	jobsResponse := dto.ToJobListResponse(jobs, total, page, limit, nil)

	response.OK(c, "Pending jobs retrieved successfully", jobsResponse)
}

// GetJobStats retrieves job statistics
// GET /api/v1/admin/jobs/stats
func (h *AdminJobHandler) GetJobStats(c *gin.Context) {
	// Get stats
	stats, err := h.jobService.GetJobStats()
	if err != nil {
		response.InternalError(c, err)
		return
	}

	response.OK(c, "Job statistics retrieved successfully", stats)
}

// GetApplicationStats retrieves application statistics
// GET /api/v1/admin/applications/stats
func (h *AdminJobHandler) GetApplicationStats(c *gin.Context) {
	// Get stats
	stats, err := h.applicationService.GetApplicationStats()
	if err != nil {
		response.InternalError(c, err)
		return
	}

	response.OK(c, "Application statistics retrieved successfully", stats)
}

// ========================
// CATEGORY MANAGEMENT
// ========================

// GetCategories retrieves all job categories for admin
// GET /api/v1/admin/categories
func (h *AdminJobHandler) GetCategories(c *gin.Context) {
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

		response.OK(c, "Categories retrieved successfully", gin.H{
			"categories": categoryResponse.Categories,
			"total":      len(categoryResponse.Categories),
		})
		return
	}

	// Get flat list
	categories, err := h.categoryService.GetAllCategories()
	if err != nil {
		response.InternalError(c, err)
		return
	}

	categoryResponse := dto.ToCategoryListResponse(categories)

	response.OK(c, "Categories retrieved successfully", gin.H{
		"categories": categoryResponse.Categories,
		"total":      len(categoryResponse.Categories),
	})
}

// CreateCategory creates a new job category
// POST /api/v1/admin/categories
func (h *AdminJobHandler) CreateCategory(c *gin.Context) {
	// Parse request
	var req dto.CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err)
		return
	}

	// Parse parent ID if provided
	var parentID *uuid.UUID
	if req.ParentID != nil {
		id, err := uuid.Parse(*req.ParentID)
		if err != nil {
			response.BadRequest(c, domain.ErrInvalidCategoryID)
			return
		}
		parentID = &id
	}

	// Create category input
	input := service.CreateCategoryInput{
		Name:        req.Name,
		Description: req.Description,
		Icon:        req.Icon,
		ParentID:    parentID,
		SortOrder:   req.SortOrder,
	}

	// Create category
	category, err := h.categoryService.CreateCategory(input)
	if err != nil {
		if err == domain.ErrCategoryAlreadyExists {
			response.BadRequest(c, err)
			return
		}
		response.InternalError(c, err)
		return
	}

	// Convert to response
	categoryResponse := dto.ToCategoryResponse(category)

	response.Created(c, "Category created successfully", categoryResponse)
}

// UpdateCategory updates an existing category
// PUT /api/v1/admin/categories/:id
func (h *AdminJobHandler) UpdateCategory(c *gin.Context) {
	// Parse category ID
	catIDStr := c.Param("id")
	catID, err := uuid.Parse(catIDStr)
	if err != nil {
		response.BadRequest(c, domain.ErrInvalidCategoryID)
		return
	}

	// Parse request
	var req dto.UpdateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err)
		return
	}

	// Parse parent ID if provided
	var parentID *uuid.UUID
	if req.ParentID != nil {
		id, err := uuid.Parse(*req.ParentID)
		if err != nil {
			response.BadRequest(c, domain.ErrInvalidCategoryID)
			return
		}
		parentID = &id
	}

	// Create update input
	input := service.UpdateCategoryInput{
		Name:        req.Name,
		Description: req.Description,
		Icon:        req.Icon,
		ParentID:    parentID,
		SortOrder:   req.SortOrder,
		IsActive:    req.IsActive,
	}

	// Update category
	category, err := h.categoryService.UpdateCategory(catID, input)
	if err != nil {
		if err == domain.ErrCategoryNotFound {
			response.NotFound(c, err)
			return
		}
		response.InternalError(c, err)
		return
	}

	// Convert to response
	categoryResponse := dto.ToCategoryResponse(category)

	response.OK(c, "Category updated successfully", categoryResponse)
}

// DeleteCategory deletes a category
// DELETE /api/v1/admin/categories/:id
func (h *AdminJobHandler) DeleteCategory(c *gin.Context) {
	// Parse category ID
	catIDStr := c.Param("id")
	catID, err := uuid.Parse(catIDStr)
	if err != nil {
		response.BadRequest(c, domain.ErrInvalidCategoryID)
		return
	}

	// Delete category
	err = h.categoryService.DeleteCategory(catID)
	if err != nil {
		if err == domain.ErrCategoryNotFound {
			response.NotFound(c, err)
			return
		}
		if err == domain.ErrCategoryHasJobs {
			response.BadRequest(c, err)
			return
		}
		response.InternalError(c, err)
		return
	}

	response.OK(c, "Category deleted successfully", nil)
}

// GetCategoryByID retrieves a specific category
// GET /api/v1/admin/categories/:id
func (h *AdminJobHandler) GetCategoryByID(c *gin.Context) {
	// Parse category ID
	catIDStr := c.Param("id")
	catID, err := uuid.Parse(catIDStr)
	if err != nil {
		response.BadRequest(c, domain.ErrInvalidCategoryID)
		return
	}

	// Get category
	category, err := h.categoryService.GetCategoryByID(catID)
	if err != nil {
		if err == domain.ErrCategoryNotFound {
			response.NotFound(c, err)
			return
		}
		response.InternalError(c, err)
		return
	}

	// Convert to response
	categoryResponse := dto.ToCategoryResponse(category)

	response.OK(c, "Category retrieved successfully", categoryResponse)
}

// ReorderCategories updates the sort order of categories
// POST /api/v1/admin/categories/reorder
func (h *AdminJobHandler) ReorderCategories(c *gin.Context) {
	// Parse request
	var req struct {
		CategoryOrders []struct {
			ID        string `json:"id" binding:"required"`
			SortOrder int    `json:"sort_order" binding:"required"`
		} `json:"category_orders" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err)
		return
	}

	// Parse and update each category
	for _, order := range req.CategoryOrders {
		catID, err := uuid.Parse(order.ID)
		if err != nil {
			response.BadRequest(c, domain.ErrInvalidCategoryID)
			return
		}

		input := service.UpdateCategoryInput{
			SortOrder: &order.SortOrder,
		}

		_, err = h.categoryService.UpdateCategory(catID, input)
		if err != nil {
			response.InternalError(c, err)
			return
		}
	}

	response.OK(c, "Categories reordered successfully", nil)
}

// ReindexJobs reindexes all jobs to MeiliSearch
// POST /api/v1/admin/jobs/reindex
func (h *AdminJobHandler) ReindexJobs(c *gin.Context) {
	if h.searchService == nil || !h.searchService.IsAvailable() {
		response.BadRequest(c, domain.ErrSearchFailed)
		return
	}

	// Get all active jobs using GetFilteredJobs with no filters
	jobs, _, err := h.jobService.GetFilteredJobs(repository.JobFilters{}, 10000, 0)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	// Reindex all jobs
	ctx := context.Background()
	if err := h.searchService.ReindexAllJobs(ctx, jobs); err != nil {
		response.InternalError(c, err)
		return
	}

	response.OK(c, "Jobs reindexed successfully", gin.H{
		"indexed_count": len(jobs),
	})
}

// GetSearchStats returns search index statistics
// GET /api/v1/admin/jobs/search-stats
func (h *AdminJobHandler) GetSearchStats(c *gin.Context) {
	if h.searchService == nil || !h.searchService.IsAvailable() {
		response.OK(c, "Search stats retrieved", gin.H{
			"available": false,
			"message":   "MeiliSearch is not configured",
		})
		return
	}

	stats, err := h.searchService.GetStats()
	if err != nil {
		response.InternalError(c, err)
		return
	}

	response.OK(c, "Search stats retrieved", gin.H{
		"available": true,
		"stats":     stats,
	})
}

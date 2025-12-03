package handler

import (
	"job-platform/internal/domain"
	"job-platform/internal/dto"
	"job-platform/internal/middleware"
	"job-platform/internal/service"
	"job-platform/internal/util/response"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// EmployerJobHandler handles employer job management endpoints
type EmployerJobHandler struct {
	jobService         *service.JobService
	applicationService *service.ApplicationService
}

// NewEmployerJobHandler creates a new employer job handler
func NewEmployerJobHandler(
	jobService *service.JobService,
	applicationService *service.ApplicationService,
) *EmployerJobHandler {
	return &EmployerJobHandler{
		jobService:         jobService,
		applicationService: applicationService,
	}
}

// CreateJob creates a new job posting
// POST /api/v1/employer/jobs
func (h *EmployerJobHandler) CreateJob(c *gin.Context) {
	// Get current user
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	// Check if user is employer
	if user.Role != domain.RoleEmployer {
		response.Forbidden(c, domain.ErrEmployerOnly)
		return
	}

	// Parse request
	var req dto.CreateJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err)
		return
	}

	// Check if employer can post jobs
	canPost, err := h.jobService.CanEmployerPostJob(user.ID)
	if err != nil {
		response.InternalError(c, err)
		return
	}
	if !canPost {
		response.BadRequest(c, domain.ErrMaxJobsReached)
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
	input := service.CreateJobInput{
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
	}

	// Create job
	job, err := h.jobService.CreateJob(user.ID, input)
	if err != nil {
		if err == domain.ErrMaxJobsReached {
			response.BadRequest(c, err)
			return
		}
		response.InternalError(c, err)
		return
	}

	// Convert to response
	jobResponse := dto.ToJobResponse(job, nil)

	response.Created(c, "Job created successfully", jobResponse)
}

// UpdateJob updates an existing job
// PUT /api/v1/employer/jobs/:id
func (h *EmployerJobHandler) UpdateJob(c *gin.Context) {
	// Get current user
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
	var req dto.UpdateJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err)
		return
	}

	// Create update input
	input := service.UpdateJobInput{
		Title:              req.Title,
		Description:        req.Description,
		ShortDescription:   req.ShortDescription,
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
		Education:          req.Education,
		YearsExperienceMin: req.YearsExperienceMin,
		YearsExperienceMax: req.YearsExperienceMax,
		ApplicationURL:     req.ApplicationURL,
		ApplicationEmail:   req.ApplicationEmail,
	}

	// Handle Skills (pointer to slice)
	if req.Skills != nil {
		input.Skills = *req.Skills
	}

	// Handle Benefits (pointer to slice)
	if req.Benefits != nil {
		input.Benefits = *req.Benefits
	}

	// Parse job type if provided
	if req.JobType != nil {
		jobType := domain.JobType(*req.JobType)
		input.JobType = &jobType
	}

	// Parse experience level if provided
	if req.ExperienceLevel != nil {
		expLevel := domain.ExperienceLevel(*req.ExperienceLevel)
		input.ExperienceLevel = &expLevel
	}

	// Parse workplace type if provided
	if req.WorkplaceType != nil {
		workplaceType := domain.WorkplaceType(*req.WorkplaceType)
		input.WorkplaceType = &workplaceType
	}

	// Parse category IDs if provided
	if req.CategoryIDs != nil {
		var categoryIDs []uuid.UUID
		for _, idStr := range *req.CategoryIDs {
			id, err := uuid.Parse(idStr)
			if err != nil {
				response.BadRequest(c, domain.ErrInvalidCategoryID)
				return
			}
			categoryIDs = append(categoryIDs, id)
		}
		input.CategoryIDs = categoryIDs
	}

	// Update job
	job, err := h.jobService.UpdateJob(jobID, user.ID, input)
	if err != nil {
		if err == domain.ErrJobNotFound {
			response.NotFound(c, err)
			return
		}
		if err == domain.ErrJobNotOwnedByEmployer {
			response.Forbidden(c, err)
			return
		}
		response.InternalError(c, err)
		return
	}

	// Convert to response
	jobResponse := dto.ToJobResponse(job, nil)

	response.OK(c, "Job updated successfully", jobResponse)
}

// DeleteJob deletes a job
// DELETE /api/v1/employer/jobs/:id
func (h *EmployerJobHandler) DeleteJob(c *gin.Context) {
	// Get current user
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

	// Delete job
	err = h.jobService.DeleteJob(jobID, user.ID)
	if err != nil {
		if err == domain.ErrJobNotFound {
			response.NotFound(c, err)
			return
		}
		if err == domain.ErrJobNotOwnedByEmployer {
			response.Forbidden(c, err)
			return
		}
		response.InternalError(c, err)
		return
	}

	response.OK(c, "Job deleted successfully", nil)
}

// GetMyJobs retrieves all jobs posted by the current employer
// GET /api/v1/employer/jobs
func (h *EmployerJobHandler) GetMyJobs(c *gin.Context) {
	// Get current user
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

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

	// Get jobs (no status filter for now - can be enhanced later)
	jobs, total, err := h.jobService.GetEmployerJobs(user.ID, limit, offset)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	// Convert to response
	jobsResponse := dto.ToJobListResponse(jobs, total, page, limit, nil)

	response.OK(c, "Jobs retrieved successfully", jobsResponse)
}

// GetMyJobByID retrieves a specific job by the employer
// GET /api/v1/employer/jobs/:id
func (h *EmployerJobHandler) GetMyJobByID(c *gin.Context) {
	// Get current user
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

	// Verify ownership
	if job.EmployerID != user.ID {
		response.Forbidden(c, domain.ErrJobNotOwnedByEmployer)
		return
	}

	// Convert to response
	jobResponse := dto.ToJobResponse(job, nil)

	response.OK(c, "Job retrieved successfully", jobResponse)
}

// CloseJob closes a job to new applications
// POST /api/v1/employer/jobs/:id/close
func (h *EmployerJobHandler) CloseJob(c *gin.Context) {
	// Get current user
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

	// Close job
	err = h.jobService.CloseJob(jobID, user.ID)
	if err != nil {
		if err == domain.ErrJobNotFound {
			response.NotFound(c, err)
			return
		}
		if err == domain.ErrJobNotOwnedByEmployer {
			response.Forbidden(c, err)
			return
		}
		response.InternalError(c, err)
		return
	}

	response.OK(c, "Job closed successfully", nil)
}

// RenewJob renews a job posting
// POST /api/v1/employer/jobs/:id/renew
func (h *EmployerJobHandler) RenewJob(c *gin.Context) {
	// Get current user
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
	var req dto.RenewJobRequest
	_ = c.ShouldBindJSON(&req) // Days is optional

	days := 30 // Default
	if req.Days > 0 {
		days = req.Days
	}

	// Renew job
	err = h.jobService.RenewJob(jobID, user.ID, days)
	if err != nil {
		if err == domain.ErrJobNotFound {
			response.NotFound(c, err)
			return
		}
		if err == domain.ErrJobNotOwnedByEmployer {
			response.Forbidden(c, err)
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

	response.OK(c, "Job renewed successfully", jobResponse)
}

// GetJobApplications retrieves all applications for a specific job
// GET /api/v1/employer/jobs/:id/applications
func (h *EmployerJobHandler) GetJobApplications(c *gin.Context) {
	// Get current user
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

	// Verify job ownership
	job, err := h.jobService.GetJobByID(jobID)
	if err != nil {
		if err == domain.ErrJobNotFound {
			response.NotFound(c, err)
			return
		}
		response.InternalError(c, err)
		return
	}

	if job.EmployerID != user.ID {
		response.Forbidden(c, domain.ErrJobNotOwnedByEmployer)
		return
	}

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

	// Get applications
	applications, total, err := h.applicationService.GetJobApplications(jobID, user.ID, limit, offset)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	// Convert to response (include applicant info, not job info)
	appsResponse := dto.ToApplicationListResponse(applications, total, page, limit, false, true)

	response.OK(c, "Applications retrieved successfully", appsResponse)
}

// GetApplicationDetail retrieves a specific application detail
// GET /api/v1/employer/applications/:id
func (h *EmployerJobHandler) GetApplicationDetail(c *gin.Context) {
	// Get current user
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	// Parse application ID
	appIDStr := c.Param("id")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		response.BadRequest(c, domain.ErrInvalidID)
		return
	}

	// Get application
	application, err := h.applicationService.GetApplicationByID(appID, user.ID)
	if err != nil {
		if err == domain.ErrApplicationNotFound {
			response.NotFound(c, err)
			return
		}
		response.InternalError(c, err)
		return
	}

	// Verify job ownership
	if application.Job.EmployerID != user.ID {
		response.Forbidden(c, domain.ErrApplicationNotFound)
		return
	}

	// Convert to response (include both job and applicant info)
	appResponse := dto.ToApplicationResponse(application, true, true)

	response.OK(c, "Application retrieved successfully", appResponse)
}

// UpdateApplicationStatus updates the status of an application
// PATCH /api/v1/employer/applications/:id/status
func (h *EmployerJobHandler) UpdateApplicationStatus(c *gin.Context) {
	// Get current user
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	// Parse application ID
	appIDStr := c.Param("id")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		response.BadRequest(c, domain.ErrInvalidID)
		return
	}

	// Parse request
	var req dto.UpdateApplicationStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err)
		return
	}

	// Update status
	err = h.applicationService.UpdateApplicationStatus(
		appID,
		user.ID,
		domain.ApplicationStatus(req.Status),
		req.Reason,
	)
	if err != nil {
		if err == domain.ErrApplicationNotFound {
			response.NotFound(c, err)
			return
		}
		if err == domain.ErrInvalidStatusTransition {
			response.BadRequest(c, err)
			return
		}
		response.InternalError(c, err)
		return
	}

	// Get updated application
	application, err := h.applicationService.GetApplicationByID(appID, user.ID)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	// Convert to response
	appResponse := dto.ToApplicationResponse(application, true, true)

	response.OK(c, "Application status updated successfully", appResponse)
}

// AddApplicationNotes adds or updates employer notes for an application
// PATCH /api/v1/employer/applications/:id/notes
func (h *EmployerJobHandler) AddApplicationNotes(c *gin.Context) {
	// Get current user
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	// Parse application ID
	appIDStr := c.Param("id")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		response.BadRequest(c, domain.ErrInvalidID)
		return
	}

	// Parse request
	var req dto.AddApplicationNotesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err)
		return
	}

	// Add notes
	err = h.applicationService.AddEmployerNotes(appID, user.ID, req.Notes)
	if err != nil {
		if err == domain.ErrApplicationNotFound {
			response.NotFound(c, err)
			return
		}
		response.InternalError(c, err)
		return
	}

	response.OK(c, "Notes added successfully", nil)
}

// RateApplicant rates an applicant
// PATCH /api/v1/employer/applications/:id/rating
func (h *EmployerJobHandler) RateApplicant(c *gin.Context) {
	// Get current user
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	// Parse application ID
	appIDStr := c.Param("id")
	appID, err := uuid.Parse(appIDStr)
	if err != nil {
		response.BadRequest(c, domain.ErrInvalidID)
		return
	}

	// Parse request
	var req dto.RateApplicantRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err)
		return
	}

	// Rate applicant
	err = h.applicationService.RateApplicant(appID, user.ID, req.Rating)
	if err != nil {
		if err == domain.ErrApplicationNotFound {
			response.NotFound(c, err)
			return
		}
		response.InternalError(c, err)
		return
	}

	response.OK(c, "Applicant rated successfully", nil)
}

// GetAllApplications retrieves all applications across all employer's jobs
// GET /api/v1/employer/applications
func (h *EmployerJobHandler) GetAllApplications(c *gin.Context) {
	// Get current user
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

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

	// Parse optional filters
	status := c.Query("status")
	sort := c.DefaultQuery("sort", "newest")

	// Get all applications for this employer
	applications, total, err := h.applicationService.GetEmployerApplications(user.ID, status, sort, limit, offset)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	// Convert to response (include job info, include applicant info)
	appsResponse := dto.ToApplicationListResponse(applications, total, page, limit, true, true)

	response.OK(c, "Applications retrieved successfully", appsResponse)
}

// GetOverviewAnalytics retrieves overview analytics for the employer
// GET /api/v1/employer/analytics/overview
func (h *EmployerJobHandler) GetOverviewAnalytics(c *gin.Context) {
	// Get current user
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	// Parse period (default 30d)
	period := c.DefaultQuery("period", "30d")

	// Get overview analytics
	analytics, err := h.jobService.GetEmployerOverviewAnalytics(user.ID, period)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	response.OK(c, "Analytics retrieved successfully", analytics)
}

// GetJobAnalytics retrieves analytics for a specific job
// GET /api/v1/employer/jobs/:id/analytics
func (h *EmployerJobHandler) GetJobAnalytics(c *gin.Context) {
	// Get current user
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

	// Verify job ownership
	job, err := h.jobService.GetJobByID(jobID)
	if err != nil {
		if err == domain.ErrJobNotFound {
			response.NotFound(c, err)
			return
		}
		response.InternalError(c, err)
		return
	}

	if job.EmployerID != user.ID {
		response.Forbidden(c, domain.ErrJobNotOwnedByEmployer)
		return
	}

	// Parse date range
	startDateStr := c.Query("start_date")
	endDateStr := c.Query("end_date")

	var startDate, endDate *time.Time
	if startDateStr != "" {
		parsed, err := time.Parse("2006-01-02", startDateStr)
		if err == nil {
			startDate = &parsed
		}
	}
	if endDateStr != "" {
		parsed, err := time.Parse("2006-01-02", endDateStr)
		if err == nil {
			endDate = &parsed
		}
	}

	// Get analytics
	analytics, err := h.jobService.GetJobAnalytics(jobID, startDate, endDate)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	response.OK(c, "Analytics retrieved successfully", analytics)
}

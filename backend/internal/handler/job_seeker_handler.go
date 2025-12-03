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

// JobSeekerHandler handles job seeker specific endpoints
type JobSeekerHandler struct {
	applicationService *service.ApplicationService
	savedJobService    *service.SavedJobService
	jobService         *service.JobService
}

// NewJobSeekerHandler creates a new job seeker handler
func NewJobSeekerHandler(
	applicationService *service.ApplicationService,
	savedJobService *service.SavedJobService,
	jobService *service.JobService,
) *JobSeekerHandler {
	return &JobSeekerHandler{
		applicationService: applicationService,
		savedJobService:    savedJobService,
		jobService:         jobService,
	}
}

// ApplyToJob applies to a job
// POST /api/v1/jobs/:id/apply
func (h *JobSeekerHandler) ApplyToJob(c *gin.Context) {
	// Get current user
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	// Check if user is job seeker
	if user.Role != domain.RoleJobSeeker {
		response.Forbidden(c, domain.ErrJobSeekerOnly)
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
	var req dto.ApplyJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err)
		return
	}

	// Check if user can apply
	canApply, _, err := h.applicationService.CanApply(user.ID, jobID)
	if err != nil {
		response.InternalError(c, err)
		return
	}
	if !canApply {
		response.BadRequest(c, domain.ErrCannotApply)
		return
	}

	// Create application input
	input := service.ApplyJobInput{
		ResumeURL:      req.ResumeURL,
		CoverLetter:    req.CoverLetter,
		ExpectedSalary: req.ExpectedSalary,
		Answers:        req.Answers,
	}

	// Parse available from date if provided
	if req.AvailableFrom != "" {
		parsedDate, err := time.Parse("2006-01-02", req.AvailableFrom)
		if err != nil {
			response.BadRequest(c, domain.ErrInvalidDate)
			return
		}
		input.AvailableFrom = &parsedDate
	}

	// Apply to job
	application, err := h.applicationService.ApplyToJob(user.ID, jobID, input)
	if err != nil {
		if err == domain.ErrJobNotFound {
			response.NotFound(c, err)
			return
		}
		if err == domain.ErrAlreadyApplied || err == domain.ErrCannotApplyToOwnJob {
			response.BadRequest(c, err)
			return
		}
		response.InternalError(c, err)
		return
	}

	// Convert to response
	appResponse := dto.ToApplicationResponse(application, true, false)

	response.Created(c, "Application submitted successfully", appResponse)
}

// GetMyApplication retrieves user's application for a specific job
// GET /api/v1/jobs/:id/application
func (h *JobSeekerHandler) GetMyApplication(c *gin.Context) {
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

	// Get application
	application, err := h.applicationService.GetApplicationByJobAndApplicant(jobID, user.ID)
	if err != nil {
		if err == domain.ErrApplicationNotFound {
			response.NotFound(c, err)
			return
		}
		response.InternalError(c, err)
		return
	}

	// Convert to response
	appResponse := dto.ToApplicationResponse(application, true, false)

	response.OK(c, "Application retrieved successfully", appResponse)
}

// WithdrawApplication withdraws an application
// DELETE /api/v1/jobs/:id/application
func (h *JobSeekerHandler) WithdrawApplication(c *gin.Context) {
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

	// Get application to get its ID
	application, err := h.applicationService.GetApplicationByJobAndApplicant(jobID, user.ID)
	if err != nil {
		if err == domain.ErrApplicationNotFound {
			response.NotFound(c, err)
			return
		}
		response.InternalError(c, err)
		return
	}

	// Withdraw application
	err = h.applicationService.WithdrawApplication(application.ID, user.ID)
	if err != nil {
		if err == domain.ErrApplicationNotFound {
			response.NotFound(c, err)
			return
		}
		if err == domain.ErrCannotWithdrawApplication {
			response.BadRequest(c, err)
			return
		}
		response.InternalError(c, err)
		return
	}

	response.OK(c, "Application withdrawn successfully", nil)
}

// GetMyApplications retrieves all applications by the current user
// GET /api/v1/me/applications
func (h *JobSeekerHandler) GetMyApplications(c *gin.Context) {
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

	// Get applications (status filtering can be added later if needed)
	applications, total, err := h.applicationService.GetApplicantApplications(user.ID, limit, offset)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	// Convert to response
	appsResponse := dto.ToApplicationListResponse(applications, total, page, limit, true, false)

	response.OK(c, "Applications retrieved successfully", appsResponse)
}

// GetApplicationDetail retrieves a specific application detail
// GET /api/v1/me/applications/:id
func (h *JobSeekerHandler) GetApplicationDetail(c *gin.Context) {
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

	// Verify ownership
	if application.ApplicantID != user.ID {
		response.Forbidden(c, domain.ErrApplicationNotFound)
		return
	}

	// Convert to response
	appResponse := dto.ToApplicationResponse(application, true, false)

	response.OK(c, "Application retrieved successfully", appResponse)
}

// SaveJob saves a job for later
// POST /api/v1/jobs/:id/save
func (h *JobSeekerHandler) SaveJob(c *gin.Context) {
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
	var req dto.SaveJobRequest
	_ = c.ShouldBindJSON(&req) // Notes are optional

	// Check if job exists
	job, err := h.jobService.GetJobByID(jobID)
	if err != nil {
		if err == domain.ErrJobNotFound {
			response.NotFound(c, err)
			return
		}
		response.InternalError(c, err)
		return
	}

	// Save job
	err = h.savedJobService.SaveJob(user.ID, job.ID, req.Notes)
	if err != nil {
		if err == domain.ErrJobAlreadySaved {
			response.BadRequest(c, err)
			return
		}
		response.InternalError(c, err)
		return
	}

	response.Created(c, "Job saved successfully", gin.H{
		"job_id": job.ID,
		"saved":  true,
	})
}

// UnsaveJob removes a saved job
// DELETE /api/v1/jobs/:id/save
func (h *JobSeekerHandler) UnsaveJob(c *gin.Context) {
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

	// Unsave job
	err = h.savedJobService.UnsaveJob(user.ID, jobID)
	if err != nil {
		if err == domain.ErrSavedJobNotFound {
			response.NotFound(c, err)
			return
		}
		response.InternalError(c, err)
		return
	}

	response.OK(c, "Job removed from saved jobs", nil)
}

// GetSavedJobs retrieves all saved jobs for the current user
// GET /api/v1/me/saved-jobs
func (h *JobSeekerHandler) GetSavedJobs(c *gin.Context) {
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

	// Get saved jobs
	savedJobs, total, err := h.savedJobService.GetSavedJobs(user.ID, limit, offset)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	// Convert to response
	savedJobsResponse := dto.ToSavedJobListResponse(savedJobs, total, page, limit)

	response.OK(c, "Saved jobs retrieved successfully", savedJobsResponse)
}

// UpdateSavedJobNotes updates notes for a saved job
// PATCH /api/v1/me/saved-jobs/:id/notes
func (h *JobSeekerHandler) UpdateSavedJobNotes(c *gin.Context) {
	// Get current user
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	// Parse saved job ID
	savedJobIDStr := c.Param("id")
	savedJobID, err := uuid.Parse(savedJobIDStr)
	if err != nil {
		response.BadRequest(c, domain.ErrInvalidID)
		return
	}

	// Parse request
	var req dto.UpdateSavedJobNotesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err)
		return
	}

	// Update notes
	err = h.savedJobService.UpdateNotes(savedJobID, user.ID, req.Notes)
	if err != nil {
		if err == domain.ErrSavedJobNotFound {
			response.NotFound(c, err)
			return
		}
		response.InternalError(c, err)
		return
	}

	response.OK(c, "Notes updated successfully", nil)
}

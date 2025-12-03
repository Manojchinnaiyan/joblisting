package handler

import (
	"job-platform/internal/domain"
	"job-platform/internal/handler/dto"
	"job-platform/internal/middleware"
	"job-platform/internal/service"
	"job-platform/internal/util/response"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ExperienceHandler handles work experience endpoints
type ExperienceHandler struct {
	experienceService *service.WorkExperienceService
}

// NewExperienceHandler creates a new experience handler
func NewExperienceHandler(experienceService *service.WorkExperienceService) *ExperienceHandler {
	return &ExperienceHandler{
		experienceService: experienceService,
	}
}

// GetUserExperiences godoc
// @Summary Get user work experiences
// @Description Get all work experiences for the authenticated user
// @Tags Experience
// @Security BearerAuth
// @Produce json
// @Success 200 {object} dto.ExperienceListResponse
// @Failure 401 {object} response.ErrorResponse
// @Router /api/v1/jobseeker/me/experiences [get]
func (h *ExperienceHandler) GetUserExperiences(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, domain.ErrUnauthorized, nil)
		return
	}

	experiences, err := h.experienceService.GetUserExperiences(userID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err, nil)
		return
	}

	// Convert to response DTOs
	expResponses := make([]dto.ExperienceResponse, len(experiences))
	var totalYears float32
	currentCount := 0
	for i := range experiences {
		expResponses[i] = *dto.ToExperienceResponse(&experiences[i])
		totalYears += experiences[i].GetDurationYears()
		if experiences[i].IsCurrent {
			currentCount++
		}
	}

	result := dto.ExperienceListResponse{
		Experiences:          expResponses,
		Total:                len(experiences),
		TotalExperienceYears: totalYears,
		CurrentPositions:     currentCount,
	}

	response.Success(c, http.StatusOK, "Experiences retrieved successfully", result)
}

// GetExperience godoc
// @Summary Get work experience by ID
// @Description Get a specific work experience for the authenticated user
// @Tags Experience
// @Security BearerAuth
// @Produce json
// @Param id path string true "Experience ID"
// @Success 200 {object} dto.ExperienceResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Router /api/v1/jobseeker/me/experiences/{id} [get]
func (h *ExperienceHandler) GetExperience(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, domain.ErrUnauthorized, nil)
		return
	}

	expIDStr := c.Param("id")
	expID, err := uuid.Parse(expIDStr)
	if err != nil {
		response.Error(c, http.StatusBadRequest, domain.ErrInvalidInput, nil)
		return
	}

	experience, err := h.experienceService.GetExperienceByID(expID, userID)
	if err != nil {
		response.Error(c, http.StatusNotFound, err, nil)
		return
	}

	response.Success(c, http.StatusOK, "Experience retrieved successfully", dto.ToExperienceResponse(experience))
}

// CreateExperience godoc
// @Summary Create work experience
// @Description Create a new work experience for the authenticated user
// @Tags Experience
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param experience body dto.CreateExperienceRequest true "Experience data"
// @Success 201 {object} dto.ExperienceResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Router /api/v1/jobseeker/me/experiences [post]
func (h *ExperienceHandler) CreateExperience(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, domain.ErrUnauthorized, nil)
		return
	}

	var req dto.CreateExperienceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err, nil)
		return
	}

	// Parse start date
	startDate, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		response.Error(c, http.StatusBadRequest, domain.ErrInvalidInput, nil)
		return
	}

	// Parse end date if provided
	var endDate *time.Time
	if req.EndDate != nil && *req.EndDate != "" {
		parsed, err := time.Parse("2006-01-02", *req.EndDate)
		if err != nil {
			response.Error(c, http.StatusBadRequest, domain.ErrInvalidInput, nil)
			return
		}
		endDate = &parsed
	}

	input := service.CreateExperienceInput{
		CompanyName:    req.CompanyName,
		CompanyLogoURL: req.CompanyWebsite,
		Title:          req.Title,
		EmploymentType: domain.EmploymentType(req.EmploymentType),
		Location:       req.Location,
		IsRemote:       req.IsRemote,
		StartDate:      startDate,
		EndDate:        endDate,
		IsCurrent:      req.IsCurrent,
		Description:    req.Description,
		Achievements:   req.Achievements,
		SkillsUsed:     req.SkillsUsed,
	}

	experience, err := h.experienceService.CreateExperience(userID, input)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err, nil)
		return
	}

	response.Success(c, http.StatusCreated, "Experience created successfully", dto.ToExperienceResponse(experience))
}

// UpdateExperience godoc
// @Summary Update work experience
// @Description Update a work experience for the authenticated user
// @Tags Experience
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path string true "Experience ID"
// @Param experience body dto.UpdateExperienceRequest true "Experience data"
// @Success 200 {object} dto.ExperienceResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Router /api/v1/jobseeker/me/experiences/{id} [put]
func (h *ExperienceHandler) UpdateExperience(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, domain.ErrUnauthorized, nil)
		return
	}

	expIDStr := c.Param("id")
	expID, err := uuid.Parse(expIDStr)
	if err != nil {
		response.Error(c, http.StatusBadRequest, domain.ErrInvalidInput, nil)
		return
	}

	var req dto.UpdateExperienceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err, nil)
		return
	}

	input := service.UpdateExperienceInput{
		CompanyName:    req.CompanyName,
		CompanyLogoURL: req.CompanyWebsite,
		Title:          req.Title,
		Location:       req.Location,
		IsRemote:       req.IsRemote,
		IsCurrent:      req.IsCurrent,
		Description:    req.Description,
		Achievements:   req.Achievements,
		SkillsUsed:     req.SkillsUsed,
	}

	// Parse employment type if provided
	if req.EmploymentType != nil {
		empType := domain.EmploymentType(*req.EmploymentType)
		input.EmploymentType = &empType
	}

	// Parse start date if provided
	if req.StartDate != nil && *req.StartDate != "" {
		startDate, err := time.Parse("2006-01-02", *req.StartDate)
		if err != nil {
			response.Error(c, http.StatusBadRequest, domain.ErrInvalidInput, nil)
			return
		}
		input.StartDate = &startDate
	}

	// Parse end date if provided
	if req.EndDate != nil && *req.EndDate != "" {
		endDate, err := time.Parse("2006-01-02", *req.EndDate)
		if err != nil {
			response.Error(c, http.StatusBadRequest, domain.ErrInvalidInput, nil)
			return
		}
		input.EndDate = &endDate
	}

	experience, err := h.experienceService.UpdateExperience(expID, userID, input)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err, nil)
		return
	}

	response.Success(c, http.StatusOK, "Experience updated successfully", dto.ToExperienceResponse(experience))
}

// DeleteExperience godoc
// @Summary Delete work experience
// @Description Delete a work experience for the authenticated user
// @Tags Experience
// @Security BearerAuth
// @Produce json
// @Param id path string true "Experience ID"
// @Success 200 {object} response.MessageResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Router /api/v1/jobseeker/me/experiences/{id} [delete]
func (h *ExperienceHandler) DeleteExperience(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, domain.ErrUnauthorized, nil)
		return
	}

	expIDStr := c.Param("id")
	expID, err := uuid.Parse(expIDStr)
	if err != nil {
		response.Error(c, http.StatusBadRequest, domain.ErrInvalidInput, nil)
		return
	}

	if err := h.experienceService.DeleteExperience(expID, userID); err != nil {
		response.Error(c, http.StatusNotFound, err, nil)
		return
	}

	response.Success(c, http.StatusOK, "Experience deleted successfully", nil)
}

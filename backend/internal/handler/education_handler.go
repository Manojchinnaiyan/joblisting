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

// EducationHandler handles education endpoints
type EducationHandler struct {
	educationService *service.EducationService
}

// NewEducationHandler creates a new education handler
func NewEducationHandler(educationService *service.EducationService) *EducationHandler {
	return &EducationHandler{
		educationService: educationService,
	}
}

// GetUserEducation godoc
// @Summary Get user education
// @Description Get all education entries for the authenticated user
// @Tags Education
// @Security BearerAuth
// @Produce json
// @Success 200 {object} dto.EducationListResponse
// @Failure 401 {object} response.ErrorResponse
// @Router /api/v1/jobseeker/me/education [get]
func (h *EducationHandler) GetUserEducation(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, domain.ErrUnauthorized, nil)
		return
	}

	education, err := h.educationService.GetUserEducation(userID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err, nil)
		return
	}

	// Convert to response DTOs
	eduResponses := make([]dto.EducationResponse, len(education))
	for i := range education {
		eduResponses[i] = *dto.ToEducationResponse(&education[i])
	}

	result := dto.EducationListResponse{
		Education: eduResponses,
		Total:     len(education),
	}

	response.Success(c, http.StatusOK, "Education retrieved successfully", result)
}

// GetEducation godoc
// @Summary Get education by ID
// @Description Get a specific education entry for the authenticated user
// @Tags Education
// @Security BearerAuth
// @Produce json
// @Param id path string true "Education ID"
// @Success 200 {object} dto.EducationResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Router /api/v1/jobseeker/me/education/{id} [get]
func (h *EducationHandler) GetEducation(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, domain.ErrUnauthorized, nil)
		return
	}

	eduIDStr := c.Param("id")
	eduID, err := uuid.Parse(eduIDStr)
	if err != nil {
		response.Error(c, http.StatusBadRequest, domain.ErrInvalidInput, nil)
		return
	}

	education, err := h.educationService.GetEducationByID(eduID, userID)
	if err != nil {
		response.Error(c, http.StatusNotFound, err, nil)
		return
	}

	response.Success(c, http.StatusOK, "Education retrieved successfully", dto.ToEducationResponse(education))
}

// CreateEducation godoc
// @Summary Create education
// @Description Create a new education entry for the authenticated user
// @Tags Education
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param education body dto.CreateEducationRequest true "Education data"
// @Success 201 {object} dto.EducationResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Router /api/v1/jobseeker/me/education [post]
func (h *EducationHandler) CreateEducation(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, domain.ErrUnauthorized, nil)
		return
	}

	var req dto.CreateEducationRequest
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

	// Convert FieldOfStudy from pointer to string
	fieldOfStudy := ""
	if req.FieldOfStudy != nil {
		fieldOfStudy = *req.FieldOfStudy
	}

	input := service.CreateEducationInput{
		Institution:        req.InstitutionName,
		InstitutionLogoURL: nil,
		Degree:             domain.DegreeType(req.DegreeType),
		FieldOfStudy:       fieldOfStudy,
		StartDate:          startDate,
		EndDate:            endDate,
		IsCurrent:          req.IsCurrent,
		Grade:              req.Grade,
		Description:        req.Description,
		Activities:         req.Achievements,
	}

	education, err := h.educationService.CreateEducation(userID, input)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err, nil)
		return
	}

	response.Success(c, http.StatusCreated, "Education created successfully", dto.ToEducationResponse(education))
}

// UpdateEducation godoc
// @Summary Update education
// @Description Update an education entry for the authenticated user
// @Tags Education
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path string true "Education ID"
// @Param education body dto.UpdateEducationRequest true "Education data"
// @Success 200 {object} dto.EducationResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Router /api/v1/jobseeker/me/education/{id} [put]
func (h *EducationHandler) UpdateEducation(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, domain.ErrUnauthorized, nil)
		return
	}

	eduIDStr := c.Param("id")
	eduID, err := uuid.Parse(eduIDStr)
	if err != nil {
		response.Error(c, http.StatusBadRequest, domain.ErrInvalidInput, nil)
		return
	}

	var req dto.UpdateEducationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err, nil)
		return
	}

	input := service.UpdateEducationInput{
		Institution:        req.InstitutionName,
		InstitutionLogoURL: nil,
		FieldOfStudy:       req.FieldOfStudy,
		IsCurrent:          req.IsCurrent,
		Grade:              req.Grade,
		Description:        req.Description,
		Activities:         req.Achievements,
	}

	// Parse degree if provided
	if req.DegreeType != nil {
		degree := domain.DegreeType(*req.DegreeType)
		input.Degree = &degree
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

	education, err := h.educationService.UpdateEducation(eduID, userID, input)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err, nil)
		return
	}

	response.Success(c, http.StatusOK, "Education updated successfully", dto.ToEducationResponse(education))
}

// DeleteEducation godoc
// @Summary Delete education
// @Description Delete an education entry for the authenticated user
// @Tags Education
// @Security BearerAuth
// @Produce json
// @Param id path string true "Education ID"
// @Success 200 {object} response.MessageResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Router /api/v1/jobseeker/me/education/{id} [delete]
func (h *EducationHandler) DeleteEducation(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, domain.ErrUnauthorized, nil)
		return
	}

	eduIDStr := c.Param("id")
	eduID, err := uuid.Parse(eduIDStr)
	if err != nil {
		response.Error(c, http.StatusBadRequest, domain.ErrInvalidInput, nil)
		return
	}

	if err := h.educationService.DeleteEducation(eduID, userID); err != nil {
		response.Error(c, http.StatusNotFound, err, nil)
		return
	}

	response.Success(c, http.StatusOK, "Education deleted successfully", nil)
}

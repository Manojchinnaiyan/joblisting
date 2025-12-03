package handler

import (
	"job-platform/internal/domain"
	"job-platform/internal/handler/dto"
	"job-platform/internal/middleware"
	"job-platform/internal/service"
	"job-platform/internal/util/response"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// SkillHandler handles skill endpoints
type SkillHandler struct {
	skillService *service.SkillService
}

// NewSkillHandler creates a new skill handler
func NewSkillHandler(skillService *service.SkillService) *SkillHandler {
	return &SkillHandler{
		skillService: skillService,
	}
}

// GetUserSkills godoc
// @Summary Get user skills
// @Description Get all skills for the authenticated user
// @Tags Skills
// @Security BearerAuth
// @Produce json
// @Success 200 {object} dto.SkillListResponse
// @Failure 401 {object} response.ErrorResponse
// @Router /api/v1/jobseeker/me/skills [get]
func (h *SkillHandler) GetUserSkills(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, domain.ErrUnauthorized, nil)
		return
	}

	skills, err := h.skillService.GetUserSkills(userID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err, nil)
		return
	}

	// Convert to response DTOs
	skillResponses := make([]dto.SkillResponse, len(skills))
	for i := range skills {
		skillResponses[i] = *dto.ToSkillResponse(&skills[i])
	}

	// Count by level
	byLevel := make(map[string]int)
	for _, skill := range skills {
		byLevel[string(skill.Level)]++
	}

	result := dto.SkillListResponse{
		Skills:  skillResponses,
		Total:   len(skills),
		ByLevel: byLevel,
	}

	response.Success(c, http.StatusOK, "Skills retrieved successfully", result)
}

// AddSkill godoc
// @Summary Add skill
// @Description Add a new skill for the authenticated user
// @Tags Skills
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param skill body dto.AddSkillRequest true "Skill data"
// @Success 201 {object} dto.SkillResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Router /api/v1/jobseeker/me/skills [post]
func (h *SkillHandler) AddSkill(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, domain.ErrUnauthorized, nil)
		return
	}

	var req dto.AddSkillRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err, nil)
		return
	}

	// Convert years from int to float32
	var yearsExp *float32
	if req.YearsOfExperience != nil {
		years := float32(*req.YearsOfExperience)
		yearsExp = &years
	}

	input := service.AddSkillInput{
		Name:            req.Name,
		Level:           domain.SkillLevel(req.Level),
		YearsExperience: yearsExp,
	}

	skill, err := h.skillService.AddSkill(userID, input)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err, nil)
		return
	}

	response.Success(c, http.StatusCreated, "Skill added successfully", dto.ToSkillResponse(skill))
}

// UpdateSkill godoc
// @Summary Update skill
// @Description Update a skill for the authenticated user
// @Tags Skills
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path string true "Skill ID"
// @Param skill body dto.UpdateSkillRequest true "Skill data"
// @Success 200 {object} dto.SkillResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Router /api/v1/jobseeker/me/skills/{id} [put]
func (h *SkillHandler) UpdateSkill(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, domain.ErrUnauthorized, nil)
		return
	}

	skillIDStr := c.Param("id")
	skillID, err := uuid.Parse(skillIDStr)
	if err != nil {
		response.Error(c, http.StatusBadRequest, domain.ErrInvalidInput, nil)
		return
	}

	var req dto.UpdateSkillRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err, nil)
		return
	}

	// Convert level if provided
	var level *domain.SkillLevel
	if req.Level != nil {
		l := domain.SkillLevel(*req.Level)
		level = &l
	}

	// Convert years from int to float32 if provided
	var yearsExp *float32
	if req.YearsOfExperience != nil {
		years := float32(*req.YearsOfExperience)
		yearsExp = &years
	}

	input := service.UpdateSkillInput{
		Name:            req.Name,
		Level:           level,
		YearsExperience: yearsExp,
	}

	skill, err := h.skillService.UpdateSkill(skillID, userID, input)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err, nil)
		return
	}

	response.Success(c, http.StatusOK, "Skill updated successfully", dto.ToSkillResponse(skill))
}

// DeleteSkill godoc
// @Summary Delete skill
// @Description Delete a skill for the authenticated user
// @Tags Skills
// @Security BearerAuth
// @Produce json
// @Param id path string true "Skill ID"
// @Success 200 {object} response.MessageResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Router /api/v1/jobseeker/me/skills/{id} [delete]
func (h *SkillHandler) DeleteSkill(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, domain.ErrUnauthorized, nil)
		return
	}

	skillIDStr := c.Param("id")
	skillID, err := uuid.Parse(skillIDStr)
	if err != nil {
		response.Error(c, http.StatusBadRequest, domain.ErrInvalidInput, nil)
		return
	}

	if err := h.skillService.DeleteSkill(skillID, userID); err != nil {
		response.Error(c, http.StatusNotFound, err, nil)
		return
	}

	response.Success(c, http.StatusOK, "Skill deleted successfully", nil)
}

// BulkAddSkills godoc
// @Summary Bulk add skills
// @Description Add multiple skills at once for the authenticated user
// @Tags Skills
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param skills body dto.BulkAddSkillsRequest true "Skills data"
// @Success 201 {object} dto.SkillListResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Router /api/v1/jobseeker/me/skills/bulk [post]
func (h *SkillHandler) BulkAddSkills(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, domain.ErrUnauthorized, nil)
		return
	}

	var req dto.BulkAddSkillsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err, nil)
		return
	}

	// Convert to service inputs
	inputs := make([]service.AddSkillInput, len(req.Skills))
	for i, skillReq := range req.Skills {
		var yearsExp *float32
		if skillReq.YearsOfExperience != nil {
			years := float32(*skillReq.YearsOfExperience)
			yearsExp = &years
		}

		inputs[i] = service.AddSkillInput{
			Name:            skillReq.Name,
			Level:           domain.SkillLevel(skillReq.Level),
			YearsExperience: yearsExp,
		}
	}

	skills, err := h.skillService.BulkUpdateSkills(userID, inputs)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err, nil)
		return
	}

	// Convert to response DTOs
	skillResponses := make([]dto.SkillResponse, len(skills))
	for i := range skills {
		skillResponses[i] = *dto.ToSkillResponse(&skills[i])
	}

	result := dto.SkillListResponse{
		Skills: skillResponses,
		Total:  len(skills),
	}

	response.Success(c, http.StatusCreated, "Skills added successfully", result)
}

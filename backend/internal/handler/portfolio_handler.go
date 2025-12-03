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

// PortfolioHandler handles portfolio endpoints
type PortfolioHandler struct {
	portfolioService *service.PortfolioService
}

// NewPortfolioHandler creates a new portfolio handler
func NewPortfolioHandler(portfolioService *service.PortfolioService) *PortfolioHandler {
	return &PortfolioHandler{
		portfolioService: portfolioService,
	}
}

// GetUserPortfolio godoc
// @Summary Get user portfolio
// @Description Get all portfolio projects for the authenticated user
// @Tags Portfolio
// @Security BearerAuth
// @Produce json
// @Success 200 {object} dto.PortfolioListResponse
// @Failure 401 {object} response.ErrorResponse
// @Router /api/v1/jobseeker/me/portfolio [get]
func (h *PortfolioHandler) GetUserPortfolio(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, domain.ErrUnauthorized, nil)
		return
	}

	projects, err := h.portfolioService.GetUserPortfolio(userID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err, nil)
		return
	}

	// Convert to response DTOs
	projectResponses := make([]dto.PortfolioResponse, len(projects))
	featuredCount := 0
	for i := range projects {
		projectResponses[i] = *dto.ToPortfolioResponse(&projects[i])
		if projects[i].IsFeatured {
			featuredCount++
		}
	}

	maxFeatured := 3
	result := dto.PortfolioListResponse{
		Projects:       projectResponses,
		Total:          len(projects),
		Featured:       featuredCount,
		MaxFeatured:    maxFeatured,
		CanAddFeatured: featuredCount < maxFeatured,
	}

	response.Success(c, http.StatusOK, "Portfolio retrieved successfully", result)
}

// GetPortfolio godoc
// @Summary Get portfolio project by ID
// @Description Get a specific portfolio project for the authenticated user
// @Tags Portfolio
// @Security BearerAuth
// @Produce json
// @Param id path string true "Project ID"
// @Success 200 {object} dto.PortfolioResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Router /api/v1/jobseeker/me/portfolio/{id} [get]
func (h *PortfolioHandler) GetPortfolio(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, domain.ErrUnauthorized, nil)
		return
	}

	projectIDStr := c.Param("id")
	projectID, err := uuid.Parse(projectIDStr)
	if err != nil {
		response.Error(c, http.StatusBadRequest, domain.ErrInvalidInput, nil)
		return
	}

	project, err := h.portfolioService.GetPortfolioByID(projectID, userID)
	if err != nil {
		response.Error(c, http.StatusNotFound, err, nil)
		return
	}

	response.Success(c, http.StatusOK, "Portfolio project retrieved successfully", dto.ToPortfolioResponse(project))
}

// CreatePortfolio godoc
// @Summary Create portfolio project
// @Description Create a new portfolio project for the authenticated user
// @Tags Portfolio
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param project body dto.CreatePortfolioRequest true "Portfolio data"
// @Success 201 {object} dto.PortfolioResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Router /api/v1/jobseeker/me/portfolio [post]
func (h *PortfolioHandler) CreatePortfolio(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, domain.ErrUnauthorized, nil)
		return
	}

	var req dto.CreatePortfolioRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err, nil)
		return
	}

	input := service.CreatePortfolioInput{
		Title:          req.Title,
		Description:    req.Description,
		ProjectURL:     req.ProjectURL,
		SourceCodeURL:  req.SourceCodeURL,
		Technologies:   req.Technologies,
		StartDate:      req.StartDate,
		EndDate:        req.EndDate,
		Role:           req.Role,
		TeamSize:       req.TeamSize,
		Highlights:     req.Highlights,
		IsFeatured:     req.IsFeatured,
	}

	project, err := h.portfolioService.CreatePortfolio(userID, input)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err, nil)
		return
	}

	response.Success(c, http.StatusCreated, "Portfolio project created successfully", dto.ToPortfolioResponse(project))
}

// UpdatePortfolio godoc
// @Summary Update portfolio project
// @Description Update a portfolio project for the authenticated user
// @Tags Portfolio
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path string true "Project ID"
// @Param project body dto.UpdatePortfolioRequest true "Portfolio data"
// @Success 200 {object} dto.PortfolioResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Router /api/v1/jobseeker/me/portfolio/{id} [put]
func (h *PortfolioHandler) UpdatePortfolio(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, domain.ErrUnauthorized, nil)
		return
	}

	projectIDStr := c.Param("id")
	projectID, err := uuid.Parse(projectIDStr)
	if err != nil {
		response.Error(c, http.StatusBadRequest, domain.ErrInvalidInput, nil)
		return
	}

	var req dto.UpdatePortfolioRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err, nil)
		return
	}

	input := service.UpdatePortfolioInput{
		Title:          req.Title,
		Description:    req.Description,
		ProjectURL:     req.ProjectURL,
		SourceCodeURL:  req.SourceCodeURL,
		Technologies:   req.Technologies,
		StartDate:      req.StartDate,
		EndDate:        req.EndDate,
		Role:           req.Role,
		TeamSize:       req.TeamSize,
		Highlights:     req.Highlights,
		IsFeatured:     req.IsFeatured,
	}

	project, err := h.portfolioService.UpdatePortfolio(projectID, userID, input)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err, nil)
		return
	}

	response.Success(c, http.StatusOK, "Portfolio project updated successfully", dto.ToPortfolioResponse(project))
}

// DeletePortfolio godoc
// @Summary Delete portfolio project
// @Description Delete a portfolio project for the authenticated user
// @Tags Portfolio
// @Security BearerAuth
// @Produce json
// @Param id path string true "Project ID"
// @Success 200 {object} response.MessageResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Router /api/v1/jobseeker/me/portfolio/{id} [delete]
func (h *PortfolioHandler) DeletePortfolio(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, domain.ErrUnauthorized, nil)
		return
	}

	projectIDStr := c.Param("id")
	projectID, err := uuid.Parse(projectIDStr)
	if err != nil {
		response.Error(c, http.StatusBadRequest, domain.ErrInvalidInput, nil)
		return
	}

	if err := h.portfolioService.DeletePortfolio(projectID, userID); err != nil {
		response.Error(c, http.StatusNotFound, err, nil)
		return
	}

	response.Success(c, http.StatusOK, "Portfolio project deleted successfully", nil)
}

// SetFeatured godoc
// @Summary Set portfolio featured status
// @Description Set whether a portfolio project is featured
// @Tags Portfolio
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path string true "Project ID"
// @Param data body dto.SetFeaturedRequest true "Featured status"
// @Success 200 {object} dto.PortfolioResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Router /api/v1/jobseeker/me/portfolio/{id}/featured [put]
func (h *PortfolioHandler) SetFeatured(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, domain.ErrUnauthorized, nil)
		return
	}

	projectIDStr := c.Param("id")
	projectID, err := uuid.Parse(projectIDStr)
	if err != nil {
		response.Error(c, http.StatusBadRequest, domain.ErrInvalidInput, nil)
		return
	}

	var req dto.SetFeaturedRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err, nil)
		return
	}

	if err := h.portfolioService.SetFeatured(projectID, userID, req.IsFeatured); err != nil {
		response.Error(c, http.StatusBadRequest, err, nil)
		return
	}

	response.Success(c, http.StatusOK, "Portfolio featured status updated successfully", nil)
}

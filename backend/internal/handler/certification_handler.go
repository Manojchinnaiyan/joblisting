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

// CertificationHandler handles certification endpoints
type CertificationHandler struct {
	certificationService *service.CertificationService
}

// NewCertificationHandler creates a new certification handler
func NewCertificationHandler(certificationService *service.CertificationService) *CertificationHandler {
	return &CertificationHandler{
		certificationService: certificationService,
	}
}

// GetUserCertifications godoc
// @Summary Get user certifications
// @Description Get all certifications for the authenticated user
// @Tags Certifications
// @Security BearerAuth
// @Produce json
// @Success 200 {object} dto.CertificationListResponse
// @Failure 401 {object} response.ErrorResponse
// @Router /api/v1/jobseeker/me/certifications [get]
func (h *CertificationHandler) GetUserCertifications(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, domain.ErrUnauthorized, nil)
		return
	}

	certifications, err := h.certificationService.GetUserCertifications(userID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err, nil)
		return
	}

	// Convert to response DTOs
	certResponses := make([]dto.CertificationResponse, len(certifications))
	var active, expired, expiringSoon int
	for i := range certifications {
		certResponses[i] = *dto.ToCertificationResponse(&certifications[i])
		if certifications[i].IsExpired() {
			expired++
		} else {
			active++
			if certResponses[i].DaysUntilExpiry != nil && *certResponses[i].DaysUntilExpiry <= 30 {
				expiringSoon++
			}
		}
	}

	result := dto.CertificationListResponse{
		Certifications: certResponses,
		Total:          len(certifications),
		Active:         active,
		Expired:        expired,
		ExpiringSoon:   expiringSoon,
	}

	response.Success(c, http.StatusOK, "Certifications retrieved successfully", result)
}

// GetCertification godoc
// @Summary Get certification by ID
// @Description Get a specific certification for the authenticated user
// @Tags Certifications
// @Security BearerAuth
// @Produce json
// @Param id path string true "Certification ID"
// @Success 200 {object} dto.CertificationResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Router /api/v1/jobseeker/me/certifications/{id} [get]
func (h *CertificationHandler) GetCertification(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, domain.ErrUnauthorized, nil)
		return
	}

	certIDStr := c.Param("id")
	certID, err := uuid.Parse(certIDStr)
	if err != nil {
		response.Error(c, http.StatusBadRequest, domain.ErrInvalidInput, nil)
		return
	}

	certification, err := h.certificationService.GetCertificationByID(certID, userID)
	if err != nil {
		response.Error(c, http.StatusNotFound, err, nil)
		return
	}

	response.Success(c, http.StatusOK, "Certification retrieved successfully", dto.ToCertificationResponse(certification))
}

// CreateCertification godoc
// @Summary Create certification
// @Description Create a new certification for the authenticated user
// @Tags Certifications
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param certification body dto.CreateCertificationRequest true "Certification data"
// @Success 201 {object} dto.CertificationResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Router /api/v1/jobseeker/me/certifications [post]
func (h *CertificationHandler) CreateCertification(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, domain.ErrUnauthorized, nil)
		return
	}

	var req dto.CreateCertificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err, nil)
		return
	}

	// Parse issue date
	issueDate, err := time.Parse("2006-01-02", req.IssueDate)
	if err != nil {
		response.Error(c, http.StatusBadRequest, domain.ErrInvalidInput, nil)
		return
	}

	// Parse expiry date if provided
	var expiryDate *time.Time
	if req.ExpiryDate != nil && *req.ExpiryDate != "" {
		parsed, err := time.Parse("2006-01-02", *req.ExpiryDate)
		if err != nil {
			response.Error(c, http.StatusBadRequest, domain.ErrInvalidInput, nil)
			return
		}
		expiryDate = &parsed
	}

	input := service.CreateCertificationInput{
		Name:                req.Name,
		IssuingOrganization: req.IssuingOrganization,
		IssueDate:           issueDate,
		ExpiryDate:          expiryDate,
		NoExpiry:            req.NoExpiry,
		CredentialID:        req.CredentialID,
		CredentialURL:       req.CredentialURL,
	}

	certification, err := h.certificationService.CreateCertification(userID, input)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err, nil)
		return
	}

	response.Success(c, http.StatusCreated, "Certification created successfully", dto.ToCertificationResponse(certification))
}

// UpdateCertification godoc
// @Summary Update certification
// @Description Update a certification for the authenticated user
// @Tags Certifications
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path string true "Certification ID"
// @Param certification body dto.UpdateCertificationRequest true "Certification data"
// @Success 200 {object} dto.CertificationResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Router /api/v1/jobseeker/me/certifications/{id} [put]
func (h *CertificationHandler) UpdateCertification(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, domain.ErrUnauthorized, nil)
		return
	}

	certIDStr := c.Param("id")
	certID, err := uuid.Parse(certIDStr)
	if err != nil {
		response.Error(c, http.StatusBadRequest, domain.ErrInvalidInput, nil)
		return
	}

	var req dto.UpdateCertificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err, nil)
		return
	}

	input := service.UpdateCertificationInput{
		Name:                req.Name,
		IssuingOrganization: req.IssuingOrganization,
		NoExpiry:            req.NoExpiry,
		CredentialID:        req.CredentialID,
		CredentialURL:       req.CredentialURL,
	}

	// Parse issue date if provided
	if req.IssueDate != nil && *req.IssueDate != "" {
		issueDate, err := time.Parse("2006-01-02", *req.IssueDate)
		if err != nil {
			response.Error(c, http.StatusBadRequest, domain.ErrInvalidInput, nil)
			return
		}
		input.IssueDate = &issueDate
	}

	// Parse expiry date if provided
	if req.ExpiryDate != nil && *req.ExpiryDate != "" {
		expiryDate, err := time.Parse("2006-01-02", *req.ExpiryDate)
		if err != nil {
			response.Error(c, http.StatusBadRequest, domain.ErrInvalidInput, nil)
			return
		}
		input.ExpiryDate = &expiryDate
	}

	certification, err := h.certificationService.UpdateCertification(certID, userID, input)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err, nil)
		return
	}

	response.Success(c, http.StatusOK, "Certification updated successfully", dto.ToCertificationResponse(certification))
}

// DeleteCertification godoc
// @Summary Delete certification
// @Description Delete a certification for the authenticated user
// @Tags Certifications
// @Security BearerAuth
// @Produce json
// @Param id path string true "Certification ID"
// @Success 200 {object} response.MessageResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Router /api/v1/jobseeker/me/certifications/{id} [delete]
func (h *CertificationHandler) DeleteCertification(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, domain.ErrUnauthorized, nil)
		return
	}

	certIDStr := c.Param("id")
	certID, err := uuid.Parse(certIDStr)
	if err != nil {
		response.Error(c, http.StatusBadRequest, domain.ErrInvalidInput, nil)
		return
	}

	if err := h.certificationService.DeleteCertification(certID, userID); err != nil {
		response.Error(c, http.StatusNotFound, err, nil)
		return
	}

	response.Success(c, http.StatusOK, "Certification deleted successfully", nil)
}

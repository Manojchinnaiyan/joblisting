package handler

import (
	"job-platform/internal/domain"
	"job-platform/internal/dto"
	"job-platform/internal/middleware"
	"job-platform/internal/service"
	"job-platform/internal/util/response"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// AdminCompanyHandler handles admin company endpoints
type AdminCompanyHandler struct {
	companyService   *service.CompanyService
	reviewService    *service.ReviewService
	analyticsService *service.AnalyticsService
}

// NewAdminCompanyHandler creates a new admin company handler
func NewAdminCompanyHandler(
	companyService *service.CompanyService,
	reviewService *service.ReviewService,
	analyticsService *service.AnalyticsService,
) *AdminCompanyHandler {
	return &AdminCompanyHandler{
		companyService:   companyService,
		reviewService:    reviewService,
		analyticsService: analyticsService,
	}
}

// ============================================
// COMPANY LISTING
// ============================================

// GetAllCompanies godoc
// @Summary Get all companies
// @Description Get all companies with pagination and filters
// @Tags Admin Company
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20)
// @Param status query string false "Filter by status"
// @Param search query string false "Search by name"
// @Success 200 {object} dto.CompanyListResponse
// @Security BearerAuth
// @Router /admin/companies [get]
func (h *AdminCompanyHandler) GetAllCompanies(c *gin.Context) {
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "20")
	status := c.Query("status")
	search := c.Query("search")
	isFeatured := c.Query("is_featured")
	isVerified := c.Query("is_verified")

	page, _ := strconv.Atoi(pageStr)
	if page < 1 {
		page = 1
	}

	limit, _ := strconv.Atoi(limitStr)
	if limit < 1 || limit > 100 {
		limit = 20
	}

	offset := (page - 1) * limit

	filters := make(map[string]interface{})
	if status != "" {
		filters["status"] = status
	}
	if search != "" {
		filters["search"] = search
	}
	if isFeatured == "true" {
		filters["is_featured"] = true
	} else if isFeatured == "false" {
		filters["is_featured"] = false
	}
	if isVerified == "true" {
		filters["is_verified"] = true
	} else if isVerified == "false" {
		filters["is_verified"] = false
	}

	companies, total, err := h.companyService.ListCompanies(filters, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := dto.ToCompanyListResponse(companies, total, page, limit)
	c.JSON(http.StatusOK, response)
}

// GetCompanyByID godoc
// @Summary Get company by ID
// @Description Get detailed company information by ID
// @Tags Admin Company
// @Accept json
// @Produce json
// @Param id path string true "Company ID"
// @Success 200 {object} domain.Company
// @Security BearerAuth
// @Router /admin/companies/{id} [get]
func (h *AdminCompanyHandler) GetCompanyByID(c *gin.Context) {
	companyIDStr := c.Param("id")
	companyID, err := uuid.Parse(companyIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid company_id"})
		return
	}

	company, err := h.companyService.GetCompanyByID(companyID)
	if err != nil {
		if err == domain.ErrCompanyNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{"company": company}})
}

// UpdateCompanyAdmin godoc
// @Summary Update company
// @Description Update company details (admin)
// @Tags Admin Company
// @Accept json
// @Produce json
// @Param id path string true "Company ID"
// @Param request body domain.Company true "Company data"
// @Success 200 {object} domain.Company
// @Security BearerAuth
// @Router /admin/companies/{id} [put]
func (h *AdminCompanyHandler) UpdateCompanyAdmin(c *gin.Context) {
	companyIDStr := c.Param("id")
	companyID, err := uuid.Parse(companyIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid company_id"})
		return
	}

	var req domain.Company
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	company, err := h.companyService.UpdateCompany(companyID, &req)
	if err != nil {
		if err == domain.ErrCompanyNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{"company": company}})
}

// DeleteCompany godoc
// @Summary Delete company
// @Description Delete a company (admin)
// @Tags Admin Company
// @Accept json
// @Produce json
// @Param id path string true "Company ID"
// @Success 200 {object} map[string]string
// @Security BearerAuth
// @Router /admin/companies/{id} [delete]
func (h *AdminCompanyHandler) DeleteCompany(c *gin.Context) {
	companyIDStr := c.Param("id")
	companyID, err := uuid.Parse(companyIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid company_id"})
		return
	}

	err = h.companyService.DeleteCompany(companyID)
	if err != nil {
		if err == domain.ErrCompanyNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Company deleted successfully"})
}

// ============================================
// COMPANY MODERATION
// ============================================

// GetPendingVerification godoc
// @Summary Get companies pending verification
// @Description Get companies waiting for admin verification
// @Tags Admin Company
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20)
// @Success 200 {object} dto.CompanyListResponse
// @Security BearerAuth
// @Router /admin/companies/pending [get]
func (h *AdminCompanyHandler) GetPendingVerification(c *gin.Context) {
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "20")

	page, _ := strconv.Atoi(pageStr)
	if page < 1 {
		page = 1
	}

	limit, _ := strconv.Atoi(limitStr)
	if limit < 1 || limit > 100 {
		limit = 20
	}

	offset := (page - 1) * limit
	companies, total, err := h.companyService.GetPendingVerification(limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := dto.ToCompanyListResponse(companies, total, page, limit)
	c.JSON(http.StatusOK, response)
}

// VerifyCompany godoc
// @Summary Verify a company
// @Description Verify a company profile
// @Tags Admin Company
// @Accept json
// @Produce json
// @Param company_id path string true "Company ID"
// @Success 200 {object} map[string]string
// @Security BearerAuth
// @Router /admin/companies/{company_id}/verify [post]
func (h *AdminCompanyHandler) VerifyCompany(c *gin.Context) {
	admin, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	companyIDStr := c.Param("id")
	companyID, err := uuid.Parse(companyIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid company_id"})
		return
	}

	err = h.companyService.VerifyCompany(companyID, admin.ID)
	if err != nil {
		if err == domain.ErrCompanyNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err == domain.ErrCompanyNotPending {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Company verified successfully"})
}

// UnverifyCompany godoc
// @Summary Unverify a company
// @Description Remove verification from a company
// @Tags Admin Company
// @Accept json
// @Produce json
// @Param company_id path string true "Company ID"
// @Success 200 {object} map[string]string
// @Security BearerAuth
// @Router /admin/companies/{company_id}/unverify [post]
func (h *AdminCompanyHandler) UnverifyCompany(c *gin.Context) {
	companyIDStr := c.Param("id")
	companyID, err := uuid.Parse(companyIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid company_id"})
		return
	}

	err = h.companyService.UnverifyCompany(companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Company unverified successfully"})
}

// RejectCompany godoc
// @Summary Reject a company
// @Description Reject a company verification
// @Tags Admin Company
// @Accept json
// @Produce json
// @Param company_id path string true "Company ID"
// @Param request body dto.RejectCompanyRequest true "Rejection request"
// @Success 200 {object} map[string]string
// @Security BearerAuth
// @Router /admin/companies/{company_id}/reject [post]
func (h *AdminCompanyHandler) RejectCompany(c *gin.Context) {
	companyIDStr := c.Param("id")
	companyID, err := uuid.Parse(companyIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid company_id"})
		return
	}

	var req dto.RejectCompanyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.companyService.RejectCompany(companyID, req.Reason)
	if err != nil {
		if err == domain.ErrCompanyNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err == domain.ErrCompanyNotPending {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Company rejected"})
}

// FeatureCompany godoc
// @Summary Feature a company
// @Description Feature a company on the platform
// @Tags Admin Company
// @Accept json
// @Produce json
// @Param company_id path string true "Company ID"
// @Param request body dto.FeatureCompanyRequest true "Feature request"
// @Success 200 {object} map[string]string
// @Security BearerAuth
// @Router /admin/companies/{company_id}/feature [post]
func (h *AdminCompanyHandler) FeatureCompany(c *gin.Context) {
	companyIDStr := c.Param("id")
	companyID, err := uuid.Parse(companyIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid company_id"})
		return
	}

	var req dto.FeatureCompanyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.companyService.FeatureCompany(companyID, req.FeaturedUntil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Company featured successfully"})
}

// UnfeatureCompany godoc
// @Summary Unfeature a company
// @Description Remove featuring from a company
// @Tags Admin Company
// @Accept json
// @Produce json
// @Param company_id path string true "Company ID"
// @Success 200 {object} map[string]string
// @Security BearerAuth
// @Router /admin/companies/{company_id}/unfeature [post]
func (h *AdminCompanyHandler) UnfeatureCompany(c *gin.Context) {
	companyIDStr := c.Param("id")
	companyID, err := uuid.Parse(companyIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid company_id"})
		return
	}

	err = h.companyService.UnfeatureCompany(companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Company unfeatured successfully"})
}

// SuspendCompany godoc
// @Summary Suspend a company
// @Description Suspend a company
// @Tags Admin Company
// @Accept json
// @Produce json
// @Param company_id path string true "Company ID"
// @Success 200 {object} map[string]string
// @Security BearerAuth
// @Router /admin/companies/{company_id}/suspend [post]
func (h *AdminCompanyHandler) SuspendCompany(c *gin.Context) {
	companyIDStr := c.Param("id")
	companyID, err := uuid.Parse(companyIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid company_id"})
		return
	}

	err = h.companyService.SuspendCompany(companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Company suspended successfully"})
}

// ActivateCompany godoc
// @Summary Activate a company
// @Description Activate a suspended company
// @Tags Admin Company
// @Accept json
// @Produce json
// @Param company_id path string true "Company ID"
// @Success 200 {object} map[string]string
// @Security BearerAuth
// @Router /admin/companies/{company_id}/activate [post]
func (h *AdminCompanyHandler) ActivateCompany(c *gin.Context) {
	companyIDStr := c.Param("id")
	companyID, err := uuid.Parse(companyIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid company_id"})
		return
	}

	err = h.companyService.ActivateCompany(companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Company activated successfully"})
}

// ============================================
// REVIEW MODERATION
// ============================================

// GetAllReviews godoc
// @Summary Get all reviews
// @Description Get all reviews with filters
// @Tags Admin Review
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20)
// @Param status query string false "Filter by status"
// @Param search query string false "Search by title/content"
// @Param rating query int false "Filter by rating"
// @Param company_id query string false "Filter by company ID"
// @Success 200 {object} dto.ReviewListResponse
// @Security BearerAuth
// @Router /admin/reviews [get]
func (h *AdminCompanyHandler) GetAllReviews(c *gin.Context) {
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "20")
	status := c.Query("status")
	search := c.Query("search")
	ratingStr := c.Query("rating")
	companyIDStr := c.Query("company_id")

	page, _ := strconv.Atoi(pageStr)
	if page < 1 {
		page = 1
	}

	limit, _ := strconv.Atoi(limitStr)
	if limit < 1 || limit > 100 {
		limit = 20
	}

	offset := (page - 1) * limit

	filters := make(map[string]interface{})
	if status != "" {
		filters["status"] = status
	}
	if search != "" {
		filters["search"] = search
	}
	if ratingStr != "" {
		rating, err := strconv.Atoi(ratingStr)
		if err == nil && rating > 0 {
			filters["rating"] = rating
		}
	}
	if companyIDStr != "" {
		companyID, err := uuid.Parse(companyIDStr)
		if err == nil {
			filters["company_id"] = companyID
		}
	}

	reviews, total, err := h.reviewService.GetAllReviews(filters, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := dto.ToReviewListResponse(reviews, total, page, limit)
	c.JSON(http.StatusOK, response)
}

// GetReviewByID godoc
// @Summary Get review by ID
// @Description Get detailed review information by ID
// @Tags Admin Review
// @Accept json
// @Produce json
// @Param id path string true "Review ID"
// @Success 200 {object} domain.CompanyReview
// @Security BearerAuth
// @Router /admin/reviews/{id} [get]
func (h *AdminCompanyHandler) GetReviewByID(c *gin.Context) {
	reviewIDStr := c.Param("id")
	reviewID, err := uuid.Parse(reviewIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid review_id"})
		return
	}

	review, err := h.reviewService.GetReviewByID(reviewID)
	if err != nil {
		if err == domain.ErrReviewNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{"review": review}})
}

// DeleteReviewAdmin godoc
// @Summary Delete review
// @Description Delete a review (admin)
// @Tags Admin Review
// @Accept json
// @Produce json
// @Param id path string true "Review ID"
// @Success 200 {object} map[string]string
// @Security BearerAuth
// @Router /admin/reviews/{id} [delete]
func (h *AdminCompanyHandler) DeleteReviewAdmin(c *gin.Context) {
	reviewIDStr := c.Param("id")
	reviewID, err := uuid.Parse(reviewIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid review_id"})
		return
	}

	err = h.reviewService.DeleteReview(reviewID)
	if err != nil {
		if err == domain.ErrReviewNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Review deleted successfully"})
}

// GetPendingReviews godoc
// @Summary Get pending reviews
// @Description Get reviews pending moderation
// @Tags Admin Review
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20)
// @Success 200 {object} dto.ReviewListResponse
// @Security BearerAuth
// @Router /admin/reviews/pending [get]
func (h *AdminCompanyHandler) GetPendingReviews(c *gin.Context) {
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "20")

	page, _ := strconv.Atoi(pageStr)
	if page < 1 {
		page = 1
	}

	limit, _ := strconv.Atoi(limitStr)
	if limit < 1 || limit > 100 {
		limit = 20
	}

	offset := (page - 1) * limit
	reviews, total, err := h.reviewService.GetPendingReviews(limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := dto.ToReviewListResponse(reviews, total, page, limit)
	c.JSON(http.StatusOK, response)
}

// ApproveReview godoc
// @Summary Approve a review
// @Description Approve a company review
// @Tags Admin Review
// @Accept json
// @Produce json
// @Param review_id path string true "Review ID"
// @Success 200 {object} map[string]string
// @Security BearerAuth
// @Router /admin/reviews/{review_id}/approve [post]
func (h *AdminCompanyHandler) ApproveReview(c *gin.Context) {
	admin, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	reviewIDStr := c.Param("id")
	reviewID, err := uuid.Parse(reviewIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid review_id"})
		return
	}

	err = h.reviewService.ApproveReview(reviewID, admin.ID)
	if err != nil {
		if err == domain.ErrReviewNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err == domain.ErrReviewNotPending {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Review approved successfully"})
}

// RejectReview godoc
// @Summary Reject a review
// @Description Reject a company review
// @Tags Admin Review
// @Accept json
// @Produce json
// @Param review_id path string true "Review ID"
// @Param request body dto.RejectReviewRequest true "Rejection request"
// @Success 200 {object} map[string]string
// @Security BearerAuth
// @Router /admin/reviews/{review_id}/reject [post]
func (h *AdminCompanyHandler) RejectReview(c *gin.Context) {
	admin, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	reviewIDStr := c.Param("id")
	reviewID, err := uuid.Parse(reviewIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid review_id"})
		return
	}

	var req dto.RejectReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.reviewService.RejectReview(reviewID, admin.ID, req.Reason)
	if err != nil {
		if err == domain.ErrReviewNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err == domain.ErrReviewNotPending {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Review rejected"})
}

// ============================================
// ANALYTICS
// ============================================

// GetPlatformStats godoc
// @Summary Get platform statistics
// @Description Get overall platform company statistics
// @Tags Admin Analytics
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/analytics/platform [get]
func (h *AdminCompanyHandler) GetPlatformStats(c *gin.Context) {
	stats, err := h.analyticsService.GetPlatformStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// GetIndustryStats godoc
// @Summary Get industry statistics
// @Description Get statistics by industry
// @Tags Admin Analytics
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/analytics/industries [get]
func (h *AdminCompanyHandler) GetIndustryStats(c *gin.Context) {
	stats, err := h.analyticsService.GetIndustryStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// GetLocationStats godoc
// @Summary Get location statistics
// @Description Get statistics by location
// @Tags Admin Analytics
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Security BearerAuth
// @Router /admin/analytics/locations [get]
func (h *AdminCompanyHandler) GetLocationStats(c *gin.Context) {
	stats, err := h.analyticsService.GetLocationStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

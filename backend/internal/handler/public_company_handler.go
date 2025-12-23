package handler

import (
	"job-platform/internal/domain"
	"job-platform/internal/dto"
	"job-platform/internal/middleware"
	"job-platform/internal/service"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// PublicCompanyHandler handles public company endpoints
type PublicCompanyHandler struct {
	companyService  *service.CompanyService
	locationService *service.LocationService
	benefitService  *service.BenefitService
	mediaService    *service.MediaService
	reviewService   *service.ReviewService
	followerService *service.FollowerService
}

// NewPublicCompanyHandler creates a new public company handler
func NewPublicCompanyHandler(
	companyService *service.CompanyService,
	locationService *service.LocationService,
	benefitService *service.BenefitService,
	mediaService *service.MediaService,
	reviewService *service.ReviewService,
	followerService *service.FollowerService,
) *PublicCompanyHandler {
	return &PublicCompanyHandler{
		companyService:  companyService,
		locationService: locationService,
		benefitService:  benefitService,
		mediaService:    mediaService,
		reviewService:   reviewService,
		followerService: followerService,
	}
}

// ListCompanies godoc
// @Summary List companies
// @Description Get a list of companies with filters and pagination
// @Tags Public Company
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20)
// @Param status query string false "Company status"
// @Param industry query string false "Industry"
// @Param company_size query string false "Company size"
// @Param is_verified query bool false "Is verified"
// @Param is_featured query bool false "Is featured"
// @Param city query string false "City"
// @Param country query string false "Country"
// @Param search query string false "Search query"
// @Success 200 {object} dto.CompanyListResponse
// @Router /companies [get]
func (h *PublicCompanyHandler) ListCompanies(c *gin.Context) {
	var req dto.ListCompaniesRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set defaults
	if req.Page == 0 {
		req.Page = 1
	}
	if req.Limit == 0 {
		req.Limit = 20
	}

	// Build filters
	filters := make(map[string]interface{})
	if req.Status != nil {
		filters["status"] = *req.Status
	}
	if req.Industry != nil {
		filters["industry"] = *req.Industry
	}
	if req.CompanySize != nil {
		filters["company_size"] = *req.CompanySize
	}
	if req.IsVerified != nil {
		filters["is_verified"] = *req.IsVerified
	}
	if req.IsFeatured != nil {
		filters["is_featured"] = *req.IsFeatured
	}
	if req.City != nil {
		filters["city"] = *req.City
	}
	if req.Country != nil {
		filters["country"] = *req.Country
	}
	if req.Search != nil {
		filters["search"] = *req.Search
	}

	offset := (req.Page - 1) * req.Limit
	companies, total, err := h.companyService.ListCompanies(filters, req.Limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := dto.ToCompanyListResponse(companies, total, req.Page, req.Limit)
	c.JSON(http.StatusOK, response)
}

// GetCompanyBySlug godoc
// @Summary Get company by slug
// @Description Get detailed company information by slug
// @Tags Public Company
// @Accept json
// @Produce json
// @Param slug path string true "Company slug"
// @Success 200 {object} dto.CompanyDetailResponse
// @Router /companies/{slug} [get]
func (h *PublicCompanyHandler) GetCompanyBySlug(c *gin.Context) {
	slug := c.Param("slug")

	company, err := h.companyService.GetCompanyBySlug(slug)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": domain.ErrCompanyNotFound.Error()})
		return
	}

	// Get locations
	locations, err := h.locationService.GetCompanyLocations(company.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get benefits
	benefits, err := h.benefitService.GetCompanyBenefits(company.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get media
	media, err := h.mediaService.GetCompanyMedia(company.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Check if user is following (if authenticated)
	isFollowing := false
	user, err := middleware.GetUserFromContext(c)
	if err == nil && user != nil {
		isFollowing, _ = h.followerService.IsFollowing(company.ID, user.ID)
	}

	// Build response
	response := dto.CompanyDetailResponse{
		CompanyResponse: dto.ToCompanyResponse(company),
		Locations:       make([]dto.LocationResponse, len(locations)),
		Benefits:        make([]dto.BenefitResponse, len(benefits)),
		Media:           make([]dto.MediaResponse, len(media)),
		IsFollowing:     isFollowing,
	}

	for i, loc := range locations {
		response.Locations[i] = dto.ToLocationResponse(loc)
	}
	for i, ben := range benefits {
		response.Benefits[i] = dto.ToBenefitResponse(ben)
	}
	for i, med := range media {
		response.Media[i] = dto.ToMediaResponse(med)
	}

	c.JSON(http.StatusOK, response)
}

// GetFeaturedCompanies godoc
// @Summary Get featured companies
// @Description Get a list of featured companies
// @Tags Public Company
// @Accept json
// @Produce json
// @Param limit query int false "Limit" default(10)
// @Success 200 {object} []dto.CompanyResponse
// @Router /companies/featured [get]
func (h *PublicCompanyHandler) GetFeaturedCompanies(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "10")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 || limit > 100 {
		limit = 10
	}

	companies, err := h.companyService.GetFeaturedCompanies(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	responses := make([]dto.CompanyResponse, len(companies))
	for i, company := range companies {
		responses[i] = dto.ToCompanyResponse(company)
	}

	c.JSON(http.StatusOK, responses)
}

// GetCompanyReviews godoc
// @Summary Get company reviews
// @Description Get reviews for a company
// @Tags Public Company
// @Accept json
// @Produce json
// @Param slug path string true "Company slug"
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20)
// @Param rating query int false "Filter by rating (1-5)"
// @Success 200 {object} dto.ReviewListResponse
// @Router /companies/{slug}/reviews [get]
func (h *PublicCompanyHandler) GetCompanyReviews(c *gin.Context) {
	slug := c.Param("slug")

	company, err := h.companyService.GetCompanyBySlug(slug)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": domain.ErrCompanyNotFound.Error()})
		return
	}

	var req dto.GetReviewsRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Page == 0 {
		req.Page = 1
	}
	if req.Limit == 0 {
		req.Limit = 20
	}

	offset := (req.Page - 1) * req.Limit

	var reviews []*domain.CompanyReview
	var total int64

	if req.Rating != nil {
		reviews, total, err = h.reviewService.GetReviewsByRating(company.ID, *req.Rating, req.Limit, offset)
	} else {
		reviews, total, err = h.reviewService.GetApprovedCompanyReviews(company.ID, req.Limit, offset)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := dto.ToReviewListResponse(reviews, total, req.Page, req.Limit)
	c.JSON(http.StatusOK, response)
}

// GetCompanyReviewAnalytics godoc
// @Summary Get company review analytics
// @Description Get review analytics for a company
// @Tags Public Company
// @Accept json
// @Produce json
// @Param slug path string true "Company slug"
// @Success 200 {object} dto.ReviewAnalyticsResponse
// @Router /companies/{slug}/reviews/analytics [get]
func (h *PublicCompanyHandler) GetCompanyReviewAnalytics(c *gin.Context) {
	slug := c.Param("slug")

	company, err := h.companyService.GetCompanyBySlug(slug)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": domain.ErrCompanyNotFound.Error()})
		return
	}

	avgRating, err := h.reviewService.GetAverageRating(company.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	breakdown, err := h.reviewService.GetRatingBreakdown(company.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	approvedStatus := domain.ReviewStatusApproved
	totalReviews, err := h.reviewService.CountByCompany(company.ID, &approvedStatus)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := dto.ReviewAnalyticsResponse{
		TotalReviews:    totalReviews,
		AverageRating:   avgRating,
		RatingBreakdown: dto.ToRatingBreakdownResponse(breakdown),
	}

	c.JSON(http.StatusOK, response)
}

// GetIndustries godoc
// @Summary Get all industries
// @Description Get a list of all distinct industries
// @Tags Public Company
// @Accept json
// @Produce json
// @Success 200 {object} []dto.IndustryResponse
// @Router /companies/industries [get]
func (h *PublicCompanyHandler) GetIndustries(c *gin.Context) {
	industries, err := h.companyService.GetIndustries()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	responses := make([]dto.IndustryResponse, len(industries))
	for i, industry := range industries {
		responses[i] = dto.IndustryResponse{Name: industry}
	}

	c.JSON(http.StatusOK, responses)
}

// SearchCompanies godoc
// @Summary Search companies
// @Description Search companies by query
// @Tags Public Company
// @Accept json
// @Produce json
// @Param q query string true "Search query"
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20)
// @Success 200 {object} dto.CompanyListResponse
// @Router /companies/search [get]
func (h *PublicCompanyHandler) SearchCompanies(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "search query is required"})
		return
	}

	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "20")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 || limit > 100 {
		limit = 20
	}

	offset := (page - 1) * limit
	companies, total, err := h.companyService.SearchCompanies(query, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := dto.ToCompanyListResponse(companies, total, page, limit)
	c.JSON(http.StatusOK, response)
}

// GetCompaniesForSitemap godoc
// @Summary Get companies for sitemap
// @Description Get all active companies for sitemap generation
// @Tags Public Company
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /companies/sitemap [get]
func (h *PublicCompanyHandler) GetCompaniesForSitemap(c *gin.Context) {
	companies, err := h.companyService.GetCompaniesForSitemap()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Return simple response with slug and updated_at
	type SitemapCompany struct {
		Slug      string `json:"slug"`
		UpdatedAt string `json:"updated_at"`
	}

	sitemapCompanies := make([]SitemapCompany, len(companies))
	for i, company := range companies {
		sitemapCompanies[i] = SitemapCompany{
			Slug:      company.Slug,
			UpdatedAt: company.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Companies for sitemap retrieved successfully",
		"data": gin.H{
			"companies": sitemapCompanies,
			"total":     len(sitemapCompanies),
		},
	})
}

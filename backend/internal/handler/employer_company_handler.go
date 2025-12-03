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

// EmployerCompanyHandler handles employer company endpoints
type EmployerCompanyHandler struct {
	companyService  *service.CompanyService
	teamService     *service.TeamService
	locationService *service.LocationService
	benefitService  *service.BenefitService
	mediaService    *service.MediaService
	reviewService   *service.ReviewService
	followerService *service.FollowerService
}

// NewEmployerCompanyHandler creates a new employer company handler
func NewEmployerCompanyHandler(
	companyService *service.CompanyService,
	teamService *service.TeamService,
	locationService *service.LocationService,
	benefitService *service.BenefitService,
	mediaService *service.MediaService,
	reviewService *service.ReviewService,
	followerService *service.FollowerService,
) *EmployerCompanyHandler {
	return &EmployerCompanyHandler{
		companyService:  companyService,
		teamService:     teamService,
		locationService: locationService,
		benefitService:  benefitService,
		mediaService:    mediaService,
		reviewService:   reviewService,
		followerService: followerService,
	}
}

// ============================================
// COMPANY MANAGEMENT
// ============================================

// CreateCompany godoc
// @Summary Create a company
// @Description Create a new company profile
// @Tags Employer Company
// @Accept json
// @Produce json
// @Param request body dto.CreateCompanyRequest true "Company request"
// @Success 201 {object} dto.CompanyResponse
// @Security BearerAuth
// @Router /employer/company [post]
func (h *EmployerCompanyHandler) CreateCompany(c *gin.Context) {
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	var req dto.CreateCompanyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Map DTO to domain
	companyDomain := &domain.Company{
		Name:               req.Name,
		Tagline:            req.Tagline,
		Description:        req.Description,
		Industry:           req.Industry,
		SubIndustry:        req.SubIndustry,
		CompanySize:        req.CompanySize,
		FoundedYear:        req.FoundedYear,
		CompanyType:        req.CompanyType,
		Website:            req.Website,
		Email:              req.Email,
		Phone:              req.Phone,
		LinkedInURL:        req.LinkedInURL,
		TwitterURL:         req.TwitterURL,
		FacebookURL:        req.FacebookURL,
		InstagramURL:       req.InstagramURL,
		Mission:            req.Mission,
		Vision:             req.Vision,
		CultureDescription: req.CultureDescription,
	}

	company, err := h.companyService.CreateCompany(user.ID, companyDomain)
	if err != nil {
		if err == domain.ErrCompanyAlreadyExists {
			response.Error(c, http.StatusConflict, err, nil)
			return
		}
		response.InternalError(c, err)
		return
	}

	companyResponse := dto.ToCompanyResponse(company)
	response.Created(c, "Company created successfully", companyResponse)
}

// GetMyCompany godoc
// @Summary Get my company
// @Description Get the authenticated user's company
// @Tags Employer Company
// @Accept json
// @Produce json
// @Success 200 {object} dto.CompanyResponse
// @Security BearerAuth
// @Router /employer/company [get]
func (h *EmployerCompanyHandler) GetMyCompany(c *gin.Context) {
	company, exists := c.Get("company")
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": domain.ErrCompanyNotFound.Error()})
		return
	}

	companyDomain := company.(*domain.Company)
	companyResponse := dto.ToCompanyResponse(companyDomain)
	response.OK(c, "Company retrieved successfully", companyResponse)
}

// UpdateCompany godoc
// @Summary Update company
// @Description Update company profile
// @Tags Employer Company
// @Accept json
// @Produce json
// @Param request body dto.UpdateCompanyRequest true "Update company request"
// @Success 200 {object} dto.CompanyResponse
// @Security BearerAuth
// @Router /employer/company [put]
func (h *EmployerCompanyHandler) UpdateCompany(c *gin.Context) {
	companyID, _ := c.Get("company_id")
	cid := companyID.(uuid.UUID)

	var req dto.UpdateCompanyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get existing company first
	existingCompany, err := h.companyService.GetCompanyByID(cid)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": domain.ErrCompanyNotFound.Error()})
		return
	}

	// Map DTO to domain - start with existing values and override with provided ones
	companyDomain := &domain.Company{
		Name:               existingCompany.Name,
		Industry:           existingCompany.Industry,
		CompanySize:        existingCompany.CompanySize,
		Tagline:            existingCompany.Tagline,
		Description:        existingCompany.Description,
		SubIndustry:        existingCompany.SubIndustry,
		FoundedYear:        existingCompany.FoundedYear,
		CompanyType:        existingCompany.CompanyType,
		Website:            existingCompany.Website,
		Email:              existingCompany.Email,
		Phone:              existingCompany.Phone,
		LinkedInURL:        existingCompany.LinkedInURL,
		TwitterURL:         existingCompany.TwitterURL,
		FacebookURL:        existingCompany.FacebookURL,
		InstagramURL:       existingCompany.InstagramURL,
		Mission:            existingCompany.Mission,
		Vision:             existingCompany.Vision,
		CultureDescription: existingCompany.CultureDescription,
		BrandColor:         existingCompany.BrandColor,
	}

	// Override with provided values
	if req.Name != nil {
		companyDomain.Name = *req.Name
	}
	if req.Industry != nil {
		companyDomain.Industry = *req.Industry
	}
	if req.CompanySize != nil {
		companyDomain.CompanySize = *req.CompanySize
	}
	if req.Tagline != nil {
		companyDomain.Tagline = req.Tagline
	}
	if req.Description != nil {
		companyDomain.Description = req.Description
	}
	if req.SubIndustry != nil {
		companyDomain.SubIndustry = req.SubIndustry
	}
	if req.FoundedYear != nil {
		companyDomain.FoundedYear = req.FoundedYear
	}
	if req.CompanyType != nil {
		companyDomain.CompanyType = req.CompanyType
	}
	if req.Website != nil {
		companyDomain.Website = req.Website
	}
	if req.Email != nil {
		companyDomain.Email = req.Email
	}
	if req.Phone != nil {
		companyDomain.Phone = req.Phone
	}
	if req.LinkedInURL != nil {
		companyDomain.LinkedInURL = req.LinkedInURL
	}
	if req.TwitterURL != nil {
		companyDomain.TwitterURL = req.TwitterURL
	}
	if req.FacebookURL != nil {
		companyDomain.FacebookURL = req.FacebookURL
	}
	if req.InstagramURL != nil {
		companyDomain.InstagramURL = req.InstagramURL
	}
	if req.Mission != nil {
		companyDomain.Mission = req.Mission
	}
	if req.Vision != nil {
		companyDomain.Vision = req.Vision
	}
	if req.CultureDescription != nil {
		companyDomain.CultureDescription = req.CultureDescription
	}
	if req.BrandColor != nil {
		companyDomain.BrandColor = req.BrandColor
	}

	company, err := h.companyService.UpdateCompany(cid, companyDomain)
	if err != nil {
		if err == domain.ErrCompanyNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err == domain.ErrCompanyCannotBeEdited {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	companyResponse := dto.ToCompanyResponse(company)
	response.OK(c, "Company updated successfully", companyResponse)
}

// DeleteCompany godoc
// @Summary Delete company
// @Description Delete company profile (soft delete)
// @Tags Employer Company
// @Accept json
// @Produce json
// @Success 200 {object} map[string]string
// @Security BearerAuth
// @Router /employer/company [delete]
func (h *EmployerCompanyHandler) DeleteCompany(c *gin.Context) {
	companyID, _ := c.Get("company_id")
	cid := companyID.(uuid.UUID)

	err := h.companyService.DeleteCompany(cid)
	if err != nil {
		if err == domain.ErrCompanyCannotBeEdited {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Company deleted successfully"})
}

// UploadLogo godoc
// @Summary Upload company logo
// @Description Upload a logo for the company
// @Tags Employer Company
// @Accept multipart/form-data
// @Produce json
// @Param logo formData file true "Logo file"
// @Success 200 {object} map[string]string
// @Security BearerAuth
// @Router /employer/company/logo [post]
func (h *EmployerCompanyHandler) UploadLogo(c *gin.Context) {
	companyID, _ := c.Get("company_id")
	cid := companyID.(uuid.UUID)

	file, err := c.FormFile("logo")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "logo file is required"})
		return
	}

	url, err := h.companyService.UploadLogo(cid, file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"url": url})
}

// UploadCoverImage godoc
// @Summary Upload company cover image
// @Description Upload a cover image for the company
// @Tags Employer Company
// @Accept multipart/form-data
// @Produce json
// @Param cover formData file true "Cover image file"
// @Success 200 {object} map[string]string
// @Security BearerAuth
// @Router /employer/company/cover [post]
func (h *EmployerCompanyHandler) UploadCoverImage(c *gin.Context) {
	companyID, _ := c.Get("company_id")
	cid := companyID.(uuid.UUID)

	file, err := c.FormFile("cover")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cover file is required"})
		return
	}

	url, err := h.companyService.UploadCoverImage(cid, file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"url": url})
}

// GetCompanyStats godoc
// @Summary Get company statistics
// @Description Get statistics for the company
// @Tags Employer Company
// @Accept json
// @Produce json
// @Success 200 {object} dto.CompanyStatsResponse
// @Security BearerAuth
// @Router /employer/company/stats [get]
func (h *EmployerCompanyHandler) GetCompanyStats(c *gin.Context) {
	companyID, _ := c.Get("company_id")
	cid := companyID.(uuid.UUID)

	stats, err := h.companyService.GetCompanyStats(cid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// ============================================
// TEAM MANAGEMENT
// ============================================

// GetTeamMembers godoc
// @Summary Get team members
// @Description Get all team members for the company
// @Tags Employer Team
// @Accept json
// @Produce json
// @Success 200 {object} dto.TeamMemberListResponse
// @Security BearerAuth
// @Router /employer/company/team [get]
func (h *EmployerCompanyHandler) GetTeamMembers(c *gin.Context) {
	companyID, _ := c.Get("company_id")
	cid := companyID.(uuid.UUID)

	members, err := h.teamService.GetCompanyMembers(cid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	membersResponse := dto.ToTeamMemberListResponse(members)
	response.OK(c, "Team members retrieved successfully", gin.H{"members": membersResponse.Members})
}

// UpdateTeamMemberRole godoc
// @Summary Update team member role
// @Description Update a team member's role
// @Tags Employer Team
// @Accept json
// @Produce json
// @Param id path string true "Team member ID"
// @Param request body dto.UpdateTeamMemberRoleRequest true "Update role request"
// @Success 200 {object} map[string]string
// @Security BearerAuth
// @Router /employer/company/team/{id}/role [put]
func (h *EmployerCompanyHandler) UpdateTeamMemberRole(c *gin.Context) {
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	memberIDStr := c.Param("id")
	memberID, err := uuid.Parse(memberIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req dto.UpdateTeamMemberRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.teamService.UpdateRole(memberID, req.Role, user.ID)
	if err != nil {
		if err == domain.ErrTeamMemberNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err == domain.ErrCannotChangeOwnerRole {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Team member role updated"})
}

// RemoveTeamMember godoc
// @Summary Remove team member
// @Description Remove a team member from the company
// @Tags Employer Team
// @Accept json
// @Produce json
// @Param id path string true "Team member ID"
// @Success 200 {object} map[string]string
// @Security BearerAuth
// @Router /employer/company/team/{id} [delete]
func (h *EmployerCompanyHandler) RemoveTeamMember(c *gin.Context) {
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	memberIDStr := c.Param("id")
	memberID, err := uuid.Parse(memberIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	err = h.teamService.RemoveTeamMember(memberID, user.ID)
	if err != nil {
		if err == domain.ErrTeamMemberNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err == domain.ErrCannotRemoveOwner {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Team member removed"})
}

// TransferOwnership godoc
// @Summary Transfer ownership
// @Description Transfer company ownership to another team member
// @Tags Employer Team
// @Accept json
// @Produce json
// @Param request body dto.TransferOwnershipRequest true "Transfer ownership request"
// @Success 200 {object} map[string]string
// @Security BearerAuth
// @Router /employer/company/team/transfer-ownership [post]
func (h *EmployerCompanyHandler) TransferOwnership(c *gin.Context) {
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	companyID, _ := c.Get("company_id")
	cid := companyID.(uuid.UUID)

	var req dto.TransferOwnershipRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.teamService.TransferOwnership(cid, user.ID, req.NewOwnerUserID)
	if err != nil {
		if err == domain.ErrNotCompanyOwner {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		if err == domain.ErrTeamMemberNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Ownership transferred successfully"})
}

// ============================================
// LOCATION MANAGEMENT
// ============================================

// CreateLocation godoc
// @Summary Create a location
// @Description Create a new company location
// @Tags Employer Location
// @Accept json
// @Produce json
// @Param request body dto.CreateLocationRequest true "Location request"
// @Success 201 {object} dto.LocationResponse
// @Security BearerAuth
// @Router /employer/company/locations [post]
func (h *EmployerCompanyHandler) CreateLocation(c *gin.Context) {
	companyID, _ := c.Get("company_id")
	cid := companyID.(uuid.UUID)

	var req dto.CreateLocationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Map DTO to domain
	locationDomain := &domain.CompanyLocation{
		Name:           req.Name,
		Address:        req.Address,
		City:           req.City,
		State:          req.State,
		Country:        req.Country,
		PostalCode:     req.PostalCode,
		Latitude:       req.Latitude,
		Longitude:      req.Longitude,
		Phone:          req.Phone,
		Email:          req.Email,
		IsHeadquarters: req.IsHeadquarters,
		IsHiring:       req.IsHiring,
	}

	location, err := h.locationService.CreateLocation(cid, locationDomain)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	locationResponse := dto.ToLocationResponse(location)
	response.Created(c, "Location created successfully", gin.H{"location": locationResponse})
}

// GetLocations godoc
// @Summary Get company locations
// @Description Get all locations for the company
// @Tags Employer Location
// @Accept json
// @Produce json
// @Success 200 {object} dto.LocationListResponse
// @Security BearerAuth
// @Router /employer/company/locations [get]
func (h *EmployerCompanyHandler) GetLocations(c *gin.Context) {
	companyID, _ := c.Get("company_id")
	cid := companyID.(uuid.UUID)

	locations, err := h.locationService.GetCompanyLocations(cid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	locationsResponse := dto.ToLocationListResponse(locations)
	response.OK(c, "Locations retrieved successfully", gin.H{"locations": locationsResponse.Locations})
}

// UpdateLocation godoc
// @Summary Update a location
// @Description Update a company location
// @Tags Employer Location
// @Accept json
// @Produce json
// @Param location_id path string true "Location ID"
// @Param request body dto.UpdateLocationRequest true "Update location request"
// @Success 200 {object} dto.LocationResponse
// @Security BearerAuth
// @Router /employer/company/locations/{location_id} [put]
func (h *EmployerCompanyHandler) UpdateLocation(c *gin.Context) {
	locationIDStr := c.Param("id")
	locationID, err := uuid.Parse(locationIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid location_id"})
		return
	}

	var req dto.UpdateLocationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Map DTO to domain
	locationDomain := &domain.CompanyLocation{
		Name:           req.Name,
		Address:        req.Address,
		City:           req.City,
		State:          req.State,
		Country:        req.Country,
		PostalCode:     req.PostalCode,
		Latitude:       req.Latitude,
		Longitude:      req.Longitude,
		Phone:          req.Phone,
		Email:          req.Email,
		IsHeadquarters: req.IsHeadquarters,
		IsHiring:       req.IsHiring,
	}

	location, err := h.locationService.UpdateLocation(locationID, locationDomain)
	if err != nil {
		if err == domain.ErrLocationNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	locationResponse := dto.ToLocationResponse(location)
	response.OK(c, "Location updated successfully", gin.H{"location": locationResponse})
}

// DeleteLocation godoc
// @Summary Delete a location
// @Description Delete a company location
// @Tags Employer Location
// @Accept json
// @Produce json
// @Param location_id path string true "Location ID"
// @Success 200 {object} map[string]string
// @Security BearerAuth
// @Router /employer/company/locations/{location_id} [delete]
func (h *EmployerCompanyHandler) DeleteLocation(c *gin.Context) {
	locationIDStr := c.Param("id")
	locationID, err := uuid.Parse(locationIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid location_id"})
		return
	}

	err = h.locationService.DeleteLocation(locationID)
	if err != nil {
		if err == domain.ErrLocationNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err == domain.ErrCannotDeleteLastLocation {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Location deleted successfully"})
}

// ============================================
// BENEFIT MANAGEMENT
// ============================================

// CreateBenefit godoc
// @Summary Create a benefit
// @Description Create a new company benefit
// @Tags Employer Benefit
// @Accept json
// @Produce json
// @Param request body dto.CreateBenefitRequest true "Benefit request"
// @Success 201 {object} dto.BenefitResponse
// @Security BearerAuth
// @Router /employer/company/benefits [post]
func (h *EmployerCompanyHandler) CreateBenefit(c *gin.Context) {
	companyID, _ := c.Get("company_id")
	cid := companyID.(uuid.UUID)

	var req dto.CreateBenefitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Map DTO to domain
	benefitDomain := &domain.CompanyBenefit{
		Title:       req.Title,
		Description: req.Description,
		Category:    req.Category,
		Icon:        req.Icon,
	}

	benefit, err := h.benefitService.CreateBenefit(cid, benefitDomain)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	benefitResponse := dto.ToBenefitResponse(benefit)
	response.Created(c, "Benefit created successfully", gin.H{"benefit": benefitResponse})
}

// GetBenefits godoc
// @Summary Get company benefits
// @Description Get all benefits for the company
// @Tags Employer Benefit
// @Accept json
// @Produce json
// @Success 200 {object} dto.BenefitListResponse
// @Security BearerAuth
// @Router /employer/company/benefits [get]
func (h *EmployerCompanyHandler) GetBenefits(c *gin.Context) {
	companyID, _ := c.Get("company_id")
	cid := companyID.(uuid.UUID)

	benefits, err := h.benefitService.GetCompanyBenefits(cid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	benefitsResponse := dto.ToBenefitListResponse(benefits)
	response.OK(c, "Benefits retrieved successfully", gin.H{"benefits": benefitsResponse.Benefits})
}

// UpdateBenefit godoc
// @Summary Update a benefit
// @Description Update a company benefit
// @Tags Employer Benefit
// @Accept json
// @Produce json
// @Param benefit_id path string true "Benefit ID"
// @Param request body dto.UpdateBenefitRequest true "Update benefit request"
// @Success 200 {object} dto.BenefitResponse
// @Security BearerAuth
// @Router /employer/company/benefits/{benefit_id} [put]
func (h *EmployerCompanyHandler) UpdateBenefit(c *gin.Context) {
	benefitIDStr := c.Param("id")
	benefitID, err := uuid.Parse(benefitIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid benefit_id"})
		return
	}

	var req dto.UpdateBenefitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Map DTO to domain
	benefitDomain := &domain.CompanyBenefit{
		Title:       req.Title,
		Description: req.Description,
		Category:    req.Category,
		Icon:        req.Icon,
	}

	benefit, err := h.benefitService.UpdateBenefit(benefitID, benefitDomain)
	if err != nil {
		if err == domain.ErrBenefitNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	benefitResponse := dto.ToBenefitResponse(benefit)
	response.OK(c, "Benefit updated successfully", gin.H{"benefit": benefitResponse})
}

// DeleteBenefit godoc
// @Summary Delete a benefit
// @Description Delete a company benefit
// @Tags Employer Benefit
// @Accept json
// @Produce json
// @Param benefit_id path string true "Benefit ID"
// @Success 200 {object} map[string]string
// @Security BearerAuth
// @Router /employer/company/benefits/{benefit_id} [delete]
func (h *EmployerCompanyHandler) DeleteBenefit(c *gin.Context) {
	benefitIDStr := c.Param("id")
	benefitID, err := uuid.Parse(benefitIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid benefit_id"})
		return
	}

	err = h.benefitService.DeleteBenefit(benefitID)
	if err != nil {
		if err == domain.ErrBenefitNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Benefit deleted successfully"})
}

// ============================================
// MEDIA MANAGEMENT
// ============================================

// UploadImage godoc
// @Summary Upload company image
// @Description Upload an image to company media gallery
// @Tags Employer Media
// @Accept multipart/form-data
// @Produce json
// @Param image formData file true "Image file"
// @Param title formData string false "Image title"
// @Param description formData string false "Image description"
// @Success 201 {object} dto.MediaResponse
// @Security BearerAuth
// @Router /employer/company/media/images [post]
func (h *EmployerCompanyHandler) UploadImage(c *gin.Context) {
	companyID, _ := c.Get("company_id")
	cid := companyID.(uuid.UUID)

	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "image file is required"})
		return
	}

	title := c.PostForm("title")
	description := c.PostForm("description")

	media, err := h.mediaService.UploadImage(cid, file, title, description)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := dto.ToMediaResponse(media)
	c.JSON(http.StatusCreated, response)
}

// AddVideo godoc
// @Summary Add company video
// @Description Add a video to company media gallery
// @Tags Employer Media
// @Accept json
// @Produce json
// @Param request body dto.AddVideoRequest true "Add video request"
// @Success 201 {object} dto.MediaResponse
// @Security BearerAuth
// @Router /employer/company/media/videos [post]
func (h *EmployerCompanyHandler) AddVideo(c *gin.Context) {
	companyID, _ := c.Get("company_id")
	cid := companyID.(uuid.UUID)

	var req dto.AddVideoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	thumbnailURL := ""
	if req.ThumbnailURL != nil {
		thumbnailURL = *req.ThumbnailURL
	}

	title := ""
	if req.Title != nil {
		title = *req.Title
	}

	description := ""
	if req.Description != nil {
		description = *req.Description
	}

	media, err := h.mediaService.AddVideo(cid, req.URL, thumbnailURL, title, description)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := dto.ToMediaResponse(media)
	c.JSON(http.StatusCreated, response)
}

// GetMedia godoc
// @Summary Get company media
// @Description Get all media for the company
// @Tags Employer Media
// @Accept json
// @Produce json
// @Success 200 {object} dto.MediaListResponse
// @Security BearerAuth
// @Router /employer/company/media [get]
func (h *EmployerCompanyHandler) GetMedia(c *gin.Context) {
	companyID, _ := c.Get("company_id")
	cid := companyID.(uuid.UUID)

	media, err := h.mediaService.GetCompanyMedia(cid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := dto.ToMediaListResponse(media)
	c.JSON(http.StatusOK, response)
}

// DeleteMedia godoc
// @Summary Delete media
// @Description Delete a media item
// @Tags Employer Media
// @Accept json
// @Produce json
// @Param id path string true "Media ID"
// @Param request body object true "Update data"
// @Success 200 {object} map[string]interface{}
// @Security BearerAuth
// @Router /employer/company/media/{id} [put]
func (h *EmployerCompanyHandler) UpdateMedia(c *gin.Context) {
	mediaIDStr := c.Param("id")
	mediaID, err := uuid.Parse(mediaIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid media id"})
		return
	}

	var req struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		IsFeatured  *bool  `json:"is_featured"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	media, err := h.mediaService.UpdateMedia(mediaID, req.Title, req.Description)
	if err != nil {
		if err == domain.ErrMediaNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Update featured status if provided
	if req.IsFeatured != nil {
		if err := h.mediaService.SetFeatured(mediaID, *req.IsFeatured); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		media.IsFeatured = *req.IsFeatured
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Media updated successfully",
		"data":    gin.H{"media": media},
	})
}

// DeleteMedia godoc
// @Summary Delete media
// @Description Delete a media item
// @Tags Employer Media
// @Accept json
// @Produce json
// @Param id path string true "Media ID"
// @Success 200 {object} map[string]string
// @Security BearerAuth
// @Router /employer/company/media/{id} [delete]
func (h *EmployerCompanyHandler) DeleteMedia(c *gin.Context) {
	mediaIDStr := c.Param("id")
	mediaID, err := uuid.Parse(mediaIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid media id"})
		return
	}

	err = h.mediaService.DeleteMedia(mediaID)
	if err != nil {
		if err == domain.ErrMediaNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Media deleted successfully"})
}

// ============================================
// REVIEW MANAGEMENT
// ============================================

// GetCompanyReviews godoc
// @Summary Get company reviews
// @Description Get all reviews for the company
// @Tags Employer Review
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20)
// @Success 200 {object} dto.ReviewListResponse
// @Security BearerAuth
// @Router /employer/company/reviews [get]
func (h *EmployerCompanyHandler) GetCompanyReviews(c *gin.Context) {
	companyID, _ := c.Get("company_id")
	cid := companyID.(uuid.UUID)

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
	approvedStatus := domain.ReviewStatusApproved
	reviews, total, err := h.reviewService.GetCompanyReviews(cid, &approvedStatus, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := dto.ToReviewListResponse(reviews, total, page, limit)
	c.JSON(http.StatusOK, response)
}

// AddCompanyResponse godoc
// @Summary Add company response to review
// @Description Add a response to a company review
// @Tags Employer Review
// @Accept json
// @Produce json
// @Param review_id path string true "Review ID"
// @Param request body dto.AddCompanyResponseRequest true "Add response request"
// @Success 200 {object} map[string]string
// @Security BearerAuth
// @Router /employer/company/reviews/{review_id}/response [post]
func (h *EmployerCompanyHandler) AddCompanyResponse(c *gin.Context) {
	user, err := middleware.GetUserFromContext(c)
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

	var req dto.AddCompanyResponseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.reviewService.AddCompanyResponse(reviewID, user.ID, req.Response)
	if err != nil {
		if err == domain.ErrReviewNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err == domain.ErrReviewNotApproved {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		if err == domain.ErrInsufficientPermissions {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Response added successfully"})
}

// GetFollowers godoc
// @Summary Get company followers
// @Description Get all followers for the company
// @Tags Employer Follower
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20)
// @Success 200 {object} dto.FollowerListResponse
// @Security BearerAuth
// @Router /employer/company/followers [get]
func (h *EmployerCompanyHandler) GetFollowers(c *gin.Context) {
	companyID, _ := c.Get("company_id")
	cid := companyID.(uuid.UUID)

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
	followers, total, err := h.followerService.GetCompanyFollowers(cid, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := dto.ToFollowerListResponse(followers, total, page, limit)
	c.JSON(http.StatusOK, response)
}

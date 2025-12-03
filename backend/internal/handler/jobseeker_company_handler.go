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

// JobSeekerCompanyHandler handles job seeker company endpoints
type JobSeekerCompanyHandler struct {
	followerService *service.FollowerService
	reviewService   *service.ReviewService
	companyService  *service.CompanyService
}

// NewJobSeekerCompanyHandler creates a new job seeker company handler
func NewJobSeekerCompanyHandler(
	followerService *service.FollowerService,
	reviewService *service.ReviewService,
	companyService *service.CompanyService,
) *JobSeekerCompanyHandler {
	return &JobSeekerCompanyHandler{
		followerService: followerService,
		reviewService:   reviewService,
		companyService:  companyService,
	}
}

// FollowCompany godoc
// @Summary Follow a company
// @Description Follow a company to receive updates
// @Tags Job Seeker Company
// @Accept json
// @Produce json
// @Param company_id path string true "Company ID"
// @Param request body dto.FollowCompanyRequest true "Follow request"
// @Success 200 {object} dto.FollowerResponse
// @Security BearerAuth
// @Router /jobseeker/companies/{company_id}/follow [post]
func (h *JobSeekerCompanyHandler) FollowCompany(c *gin.Context) {
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	companyIDStr := c.Param("company_id")
	companyID, err := uuid.Parse(companyIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid company_id"})
		return
	}

	var req dto.FollowCompanyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	follower, err := h.followerService.FollowCompany(companyID, user.ID, req.NotifyNewJobs)
	if err != nil {
		if err == domain.ErrCompanyNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err == domain.ErrAlreadyFollowing {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := dto.ToFollowerResponse(follower)
	c.JSON(http.StatusOK, response)
}

// UnfollowCompany godoc
// @Summary Unfollow a company
// @Description Unfollow a company
// @Tags Job Seeker Company
// @Accept json
// @Produce json
// @Param company_id path string true "Company ID"
// @Success 200 {object} map[string]string
// @Security BearerAuth
// @Router /jobseeker/companies/{company_id}/unfollow [delete]
func (h *JobSeekerCompanyHandler) UnfollowCompany(c *gin.Context) {
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	companyIDStr := c.Param("company_id")
	companyID, err := uuid.Parse(companyIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid company_id"})
		return
	}

	err = h.followerService.UnfollowCompany(companyID, user.ID)
	if err != nil {
		if err == domain.ErrNotFollowing {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Successfully unfollowed company"})
}

// GetFollowingCompanies godoc
// @Summary Get following companies
// @Description Get companies the user is following
// @Tags Job Seeker Company
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20)
// @Success 200 {object} dto.FollowingListResponse
// @Security BearerAuth
// @Router /jobseeker/companies/following [get]
func (h *JobSeekerCompanyHandler) GetFollowingCompanies(c *gin.Context) {
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
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
	following, total, err := h.followerService.GetUserFollowing(user.ID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	followingResponse := dto.ToFollowingListResponse(following, total, page, limit)
	c.JSON(http.StatusOK, followingResponse)
}

// UpdateNotifications godoc
// @Summary Update notification preferences
// @Description Update notification preferences for a followed company
// @Tags Job Seeker Company
// @Accept json
// @Produce json
// @Param company_id path string true "Company ID"
// @Param request body dto.UpdateFollowerNotificationsRequest true "Notification preferences"
// @Success 200 {object} map[string]string
// @Security BearerAuth
// @Router /jobseeker/companies/{company_id}/notifications [put]
func (h *JobSeekerCompanyHandler) UpdateNotifications(c *gin.Context) {
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	companyIDStr := c.Param("company_id")
	companyID, err := uuid.Parse(companyIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid company_id"})
		return
	}

	var req dto.UpdateFollowerNotificationsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.followerService.UpdateNotifications(companyID, user.ID, req.NotifyNewJobs)
	if err != nil {
		if err == domain.ErrNotFollowing {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notification preferences updated"})
}

// CreateReview godoc
// @Summary Create a company review
// @Description Create a review for a company
// @Tags Job Seeker Company
// @Accept json
// @Produce json
// @Param company_id path string true "Company ID"
// @Param request body dto.CreateReviewRequest true "Review request"
// @Success 201 {object} dto.ReviewResponse
// @Security BearerAuth
// @Router /jobseeker/companies/{company_id}/reviews [post]
func (h *JobSeekerCompanyHandler) CreateReview(c *gin.Context) {
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	companyIDStr := c.Param("company_id")
	companyID, err := uuid.Parse(companyIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid company_id"})
		return
	}

	var req dto.CreateReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Map DTO to domain
	reviewDomain := &domain.CompanyReview{
		OverallRating:      req.OverallRating,
		CultureRating:      req.CultureRating,
		WorkLifeRating:     req.WorkLifeRating,
		CompensationRating: req.CompensationRating,
		ManagementRating:   req.ManagementRating,
		Title:              req.Title,
		Pros:               req.Pros,
		Cons:               req.Cons,
		AdviceToManagement: req.AdviceToManagement,
		JobTitle:           req.JobTitle,
		EmploymentStatus:   req.EmploymentStatus,
		YearsAtCompany:     req.YearsAtCompany,
		IsAnonymous:        req.IsAnonymous,
		IsCurrentEmployee:  req.IsCurrentEmployee,
	}

	review, err := h.reviewService.CreateReview(companyID, user.ID, reviewDomain)
	if err != nil {
		if err == domain.ErrCompanyNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err == domain.ErrCannotReviewOwnCompany {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		if err == domain.ErrAlreadyReviewed {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := dto.ToReviewResponse(review)
	c.JSON(http.StatusCreated, response)
}

// GetMyReview godoc
// @Summary Get my review for a company
// @Description Get the authenticated user's review for a company
// @Tags Job Seeker Company
// @Accept json
// @Produce json
// @Param company_id path string true "Company ID"
// @Success 200 {object} dto.ReviewResponse
// @Security BearerAuth
// @Router /jobseeker/companies/{company_id}/reviews/me [get]
func (h *JobSeekerCompanyHandler) GetMyReview(c *gin.Context) {
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	companyIDStr := c.Param("company_id")
	companyID, err := uuid.Parse(companyIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid company_id"})
		return
	}

	review, err := h.reviewService.GetUserReview(companyID, user.ID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": domain.ErrReviewNotFound.Error()})
		return
	}

	reviewResponse := dto.ToReviewResponse(review)
	c.JSON(http.StatusOK, reviewResponse)
}

// UpdateReview godoc
// @Summary Update a review
// @Description Update the user's review for a company
// @Tags Job Seeker Company
// @Accept json
// @Produce json
// @Param review_id path string true "Review ID"
// @Param request body dto.UpdateReviewRequest true "Update review request"
// @Success 200 {object} dto.ReviewResponse
// @Security BearerAuth
// @Router /jobseeker/reviews/{review_id} [put]
func (h *JobSeekerCompanyHandler) UpdateReview(c *gin.Context) {
	reviewIDStr := c.Param("review_id")
	reviewID, err := uuid.Parse(reviewIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid review_id"})
		return
	}

	var req dto.UpdateReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Map DTO to domain
	reviewDomain := &domain.CompanyReview{
		OverallRating:      req.OverallRating,
		CultureRating:      req.CultureRating,
		WorkLifeRating:     req.WorkLifeRating,
		CompensationRating: req.CompensationRating,
		ManagementRating:   req.ManagementRating,
		Title:              req.Title,
		Pros:               req.Pros,
		Cons:               req.Cons,
		AdviceToManagement: req.AdviceToManagement,
		JobTitle:           req.JobTitle,
		EmploymentStatus:   req.EmploymentStatus,
		YearsAtCompany:     req.YearsAtCompany,
		IsAnonymous:        req.IsAnonymous,
		IsCurrentEmployee:  req.IsCurrentEmployee,
	}

	review, err := h.reviewService.UpdateReview(reviewID, reviewDomain)
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

	response := dto.ToReviewResponse(review)
	c.JSON(http.StatusOK, response)
}

// DeleteReview godoc
// @Summary Delete a review
// @Description Delete the user's review
// @Tags Job Seeker Company
// @Accept json
// @Produce json
// @Param review_id path string true "Review ID"
// @Success 200 {object} map[string]string
// @Security BearerAuth
// @Router /jobseeker/reviews/{review_id} [delete]
func (h *JobSeekerCompanyHandler) DeleteReview(c *gin.Context) {
	reviewIDStr := c.Param("review_id")
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

	c.JSON(http.StatusOK, gin.H{"message": "Review deleted successfully"})
}

// IsFollowing godoc
// @Summary Check if following a company
// @Description Check if the user is following a company
// @Tags Job Seeker Company
// @Accept json
// @Produce json
// @Param company_id path string true "Company ID"
// @Success 200 {object} map[string]bool
// @Security BearerAuth
// @Router /jobseeker/companies/{company_id}/following [get]
func (h *JobSeekerCompanyHandler) IsFollowing(c *gin.Context) {
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	companyIDStr := c.Param("company_id")
	companyID, err := uuid.Parse(companyIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid company_id"})
		return
	}

	isFollowing, err := h.followerService.IsFollowing(companyID, user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"is_following": isFollowing})
}

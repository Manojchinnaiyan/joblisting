package handler

import (
	"job-platform/internal/domain"
	"job-platform/internal/middleware"
	"job-platform/internal/service"
	"job-platform/internal/util/response"
	"job-platform/internal/util/token"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// AdminLinkedInHandler handles admin LinkedIn management endpoints
type AdminLinkedInHandler struct {
	linkedinService *service.LinkedInService
	jobService      *service.JobService
	blogService     *service.BlogService
}

// NewAdminLinkedInHandler creates a new admin LinkedIn handler
func NewAdminLinkedInHandler(
	linkedinService *service.LinkedInService,
	jobService *service.JobService,
	blogService *service.BlogService,
) *AdminLinkedInHandler {
	return &AdminLinkedInHandler{
		linkedinService: linkedinService,
		jobService:      jobService,
		blogService:     blogService,
	}
}

// GetAuthURL returns the LinkedIn OAuth URL
// GET /api/v1/admin/linkedin/auth/url
func (h *AdminLinkedInHandler) GetAuthURL(c *gin.Context) {
	state, err := token.GenerateSecureToken(32)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	authURL := h.linkedinService.GetAuthURL(state)

	// Store state in cookie for CSRF protection
	c.SetCookie("linkedin_oauth_state", state, 300, "/", "", false, true)

	response.OK(c, "LinkedIn OAuth URL generated", gin.H{
		"auth_url": authURL,
		"state":    state,
	})
}

// HandleCallback processes the OAuth callback
// POST /api/v1/admin/linkedin/auth/callback
func (h *AdminLinkedInHandler) HandleCallback(c *gin.Context) {
	var req domain.LinkedInCallbackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err)
		return
	}

	// Get admin user ID from context
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	// Exchange code and store tokens
	tokenData, err := h.linkedinService.HandleCallback(c.Request.Context(), req.Code, user.ID)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	response.OK(c, "LinkedIn connected successfully", gin.H{
		"organization_id":   tokenData.OrganizationID,
		"organization_name": tokenData.OrganizationName,
		"expires_at":        tokenData.ExpiresAt,
	})
}

// GetStatus returns LinkedIn connection status
// GET /api/v1/admin/linkedin/status
func (h *AdminLinkedInHandler) GetStatus(c *gin.Context) {
	status, err := h.linkedinService.GetConnectionStatus()
	if err != nil {
		response.InternalError(c, err)
		return
	}

	response.OK(c, "LinkedIn connection status", status)
}

// Disconnect removes the LinkedIn connection
// POST /api/v1/admin/linkedin/disconnect
func (h *AdminLinkedInHandler) Disconnect(c *gin.Context) {
	if err := h.linkedinService.Disconnect(); err != nil {
		response.InternalError(c, err)
		return
	}

	response.OK(c, "LinkedIn disconnected successfully", nil)
}

// PostJob manually posts a job to LinkedIn
// POST /api/v1/admin/linkedin/post/job/:id
func (h *AdminLinkedInHandler) PostJob(c *gin.Context) {
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	jobIDStr := c.Param("id")
	jobID, err := uuid.Parse(jobIDStr)
	if err != nil {
		response.BadRequest(c, domain.ErrInvalidJobID)
		return
	}

	// Get the job
	job, err := h.jobService.GetJobByID(jobID)
	if err != nil {
		if err == domain.ErrJobNotFound {
			response.NotFound(c, err)
			return
		}
		response.InternalError(c, err)
		return
	}

	// Post to LinkedIn
	post, err := h.linkedinService.PostJob(c.Request.Context(), job, domain.LinkedInTriggerManual, &user.ID)
	if err != nil {
		if post != nil {
			// Post record was created but API call failed
			response.InternalError(c, err)
			return
		}
		response.BadRequest(c, err)
		return
	}

	response.OK(c, "Job posted to LinkedIn successfully", post)
}

// PostBlog manually posts a blog to LinkedIn
// POST /api/v1/admin/linkedin/post/blog/:id
func (h *AdminLinkedInHandler) PostBlog(c *gin.Context) {
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	blogIDStr := c.Param("id")
	blogID, err := uuid.Parse(blogIDStr)
	if err != nil {
		response.BadRequest(c, domain.ErrInvalidInput)
		return
	}

	// Get the blog
	blog, err := h.blogService.GetBlog(blogID)
	if err != nil {
		response.NotFound(c, err)
		return
	}

	// Post to LinkedIn
	post, err := h.linkedinService.PostBlog(c.Request.Context(), blog, domain.LinkedInTriggerManual, &user.ID)
	if err != nil {
		if post != nil {
			response.InternalError(c, err)
			return
		}
		response.BadRequest(c, err)
		return
	}

	response.OK(c, "Blog posted to LinkedIn successfully", post)
}

// PostCustom posts custom content to LinkedIn
// POST /api/v1/admin/linkedin/post/custom
func (h *AdminLinkedInHandler) PostCustom(c *gin.Context) {
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	var req domain.LinkedInCustomPostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err)
		return
	}

	post, err := h.linkedinService.PostCustom(c.Request.Context(), req.Text, req.Link, &user.ID)
	if err != nil {
		if post != nil {
			response.InternalError(c, err)
			return
		}
		response.BadRequest(c, err)
		return
	}

	response.OK(c, "Custom post published to LinkedIn successfully", post)
}

// GetPostHistory returns paginated post history
// GET /api/v1/admin/linkedin/posts
func (h *AdminLinkedInHandler) GetPostHistory(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	offset := (page - 1) * limit

	filters := make(map[string]interface{})
	if contentType := c.Query("content_type"); contentType != "" {
		filters["content_type"] = contentType
	}
	if status := c.Query("status"); status != "" {
		filters["status"] = status
	}

	posts, total, err := h.linkedinService.GetPostHistory(filters, limit, offset)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	response.OK(c, "Post history retrieved", gin.H{
		"posts": posts,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// GetAutoPostSettings returns auto-post toggle settings
// GET /api/v1/admin/linkedin/settings
func (h *AdminLinkedInHandler) GetAutoPostSettings(c *gin.Context) {
	settings, err := h.linkedinService.GetAutoPostSettings()
	if err != nil {
		response.InternalError(c, err)
		return
	}

	response.OK(c, "Auto-post settings retrieved", settings)
}

// UpdateAutoPostSettings updates auto-post toggles
// PUT /api/v1/admin/linkedin/settings
func (h *AdminLinkedInHandler) UpdateAutoPostSettings(c *gin.Context) {
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	var req domain.LinkedInAutoPostSettings
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err)
		return
	}

	if err := h.linkedinService.UpdateAutoPostSettings(&req, user.ID); err != nil {
		response.InternalError(c, err)
		return
	}

	response.OK(c, "Auto-post settings updated", req)
}

package handler

import (
	"job-platform/internal/domain"
	"job-platform/internal/dto"
	"job-platform/internal/middleware"
	"job-platform/internal/service"
	"job-platform/internal/util/response"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// InvitationHandler handles company invitation endpoints
type InvitationHandler struct {
	invitationService *service.InvitationService
	teamService       *service.TeamService
}

// NewInvitationHandler creates a new invitation handler
func NewInvitationHandler(
	invitationService *service.InvitationService,
	teamService *service.TeamService,
) *InvitationHandler {
	return &InvitationHandler{
		invitationService: invitationService,
		teamService:       teamService,
	}
}

// CreateInvitation godoc
// @Summary Create an invitation
// @Description Create a new team invitation
// @Tags Employer Invitation
// @Accept json
// @Produce json
// @Param request body dto.CreateInvitationRequest true "Invitation request"
// @Success 201 {object} dto.InvitationResponse
// @Security BearerAuth
// @Router /employer/company/invitations [post]
func (h *InvitationHandler) CreateInvitation(c *gin.Context) {
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	companyID, _ := c.Get("company_id")
	cid := companyID.(uuid.UUID)

	var req dto.CreateInvitationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Default expiration: 7 days
	expiresIn := 7 * 24 * time.Hour

	invitation, err := h.invitationService.CreateInvitation(cid, req.Email, req.Role, user.ID, expiresIn)
	if err != nil {
		if err == domain.ErrCompanyNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err == domain.ErrInvitationAlreadyExists {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	invitationResponse := dto.ToInvitationResponse(invitation)
	response.Created(c, "Invitation sent successfully", gin.H{"invitation": invitationResponse})
}

// GetCompanyInvitations godoc
// @Summary Get company invitations
// @Description Get all invitations for the company
// @Tags Employer Invitation
// @Accept json
// @Produce json
// @Param status query string false "Filter by status"
// @Success 200 {object} dto.InvitationListResponse
// @Security BearerAuth
// @Router /employer/company/invitations [get]
func (h *InvitationHandler) GetCompanyInvitations(c *gin.Context) {
	companyID, _ := c.Get("company_id")
	cid := companyID.(uuid.UUID)

	statusStr := c.Query("status")
	var status *domain.InvitationStatus
	if statusStr != "" {
		s := domain.InvitationStatus(statusStr)
		status = &s
	}

	invitations, err := h.invitationService.GetCompanyInvitations(cid, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	invitationsResponse := dto.ToInvitationListResponse(invitations)
	response.OK(c, "Invitations retrieved successfully", gin.H{"invitations": invitationsResponse.Invitations})
}

// CancelInvitation godoc
// @Summary Cancel an invitation
// @Description Cancel a pending invitation
// @Tags Employer Invitation
// @Accept json
// @Produce json
// @Param id path string true "Invitation ID"
// @Success 200 {object} map[string]string
// @Security BearerAuth
// @Router /employer/company/invitations/{id} [delete]
func (h *InvitationHandler) CancelInvitation(c *gin.Context) {
	invitationIDStr := c.Param("id")
	invitationID, err := uuid.Parse(invitationIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	err = h.invitationService.CancelInvitation(invitationID)
	if err != nil {
		if err == domain.ErrInvitationNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err == domain.ErrInvitationNotPending {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Invitation cancelled"})
}

// ResendInvitation godoc
// @Summary Resend an invitation
// @Description Resend a pending invitation by extending expiration
// @Tags Employer Invitation
// @Accept json
// @Produce json
// @Param id path string true "Invitation ID"
// @Success 200 {object} map[string]string
// @Security BearerAuth
// @Router /employer/company/invitations/{id}/resend [post]
func (h *InvitationHandler) ResendInvitation(c *gin.Context) {
	invitationIDStr := c.Param("id")
	invitationID, err := uuid.Parse(invitationIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	// Extend by 7 days
	expiresIn := 7 * 24 * time.Hour

	err = h.invitationService.ResendInvitation(invitationID, expiresIn)
	if err != nil {
		if err == domain.ErrInvitationNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err == domain.ErrInvitationNotPending {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Invitation resent"})
}

// GetMyInvitations godoc
// @Summary Get my invitations
// @Description Get pending invitations for the authenticated user's email
// @Tags Invitation
// @Accept json
// @Produce json
// @Success 200 {object} dto.InvitationListResponse
// @Security BearerAuth
// @Router /invitations/me [get]
func (h *InvitationHandler) GetMyInvitations(c *gin.Context) {
	email := c.GetString("email")
	if email == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "email not found"})
		return
	}

	invitations, err := h.invitationService.GetInvitationsByEmail(email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := dto.ToInvitationListResponse(invitations)
	c.JSON(http.StatusOK, response)
}

// ValidateInvitation godoc
// @Summary Validate invitation
// @Description Validate an invitation token
// @Tags Invitation
// @Accept json
// @Produce json
// @Param token path string true "Invitation token"
// @Success 200 {object} dto.InvitationResponse
// @Router /invitations/validate/{token} [get]
func (h *InvitationHandler) ValidateInvitation(c *gin.Context) {
	token := c.Param("token")

	invitation, err := h.invitationService.ValidateInvitation(token)
	if err != nil {
		if err == domain.ErrInvitationNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err == domain.ErrInvitationExpired {
			c.JSON(http.StatusGone, gin.H{"error": err.Error()})
			return
		}
		if err == domain.ErrInvitationNotPending {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := dto.ToInvitationResponse(invitation)
	c.JSON(http.StatusOK, response)
}

// AcceptInvitation godoc
// @Summary Accept invitation
// @Description Accept a team invitation
// @Tags Invitation
// @Accept json
// @Produce json
// @Param token path string true "Invitation token"
// @Success 200 {object} dto.TeamMemberResponse
// @Security BearerAuth
// @Router /invitations/accept/{token} [post]
func (h *InvitationHandler) AcceptInvitation(c *gin.Context) {
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	token := c.Param("token")

	member, err := h.invitationService.AcceptInvitation(token, user.ID)
	if err != nil {
		if err == domain.ErrInvitationNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err == domain.ErrInvitationExpired {
			c.JSON(http.StatusGone, gin.H{"error": err.Error()})
			return
		}
		if err == domain.ErrInvitationNotPending {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		if err == domain.ErrTeamMemberAlreadyExists {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	memberResponse := dto.ToTeamMemberResponse(member)
	c.JSON(http.StatusOK, memberResponse)
}

// DeclineInvitation godoc
// @Summary Decline invitation
// @Description Decline a team invitation
// @Tags Invitation
// @Accept json
// @Produce json
// @Param token path string true "Invitation token"
// @Success 200 {object} map[string]string
// @Security BearerAuth
// @Router /invitations/decline/{token} [post]
func (h *InvitationHandler) DeclineInvitation(c *gin.Context) {
	token := c.Param("token")

	err := h.invitationService.DeclineInvitation(token)
	if err != nil {
		if err == domain.ErrInvitationNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err == domain.ErrInvitationNotPending {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Invitation declined"})
}

package dto

import (
	"job-platform/internal/domain"
	"time"

	"github.com/google/uuid"
)

// ============================================
// INVITATION REQUEST DTOs
// ============================================

// CreateInvitationRequest represents the request to create an invitation
type CreateInvitationRequest struct {
	Email string          `json:"email" binding:"required,email"`
	Role  domain.TeamRole `json:"role" binding:"required"`
}

// AcceptInvitationRequest represents the request to accept an invitation
type AcceptInvitationRequest struct {
	Token string `json:"token" binding:"required"`
}

// ============================================
// INVITATION RESPONSE DTOs
// ============================================

// InvitationResponse represents an invitation response
type InvitationResponse struct {
	ID         uuid.UUID                 `json:"id"`
	CompanyID  uuid.UUID                 `json:"company_id"`
	Company    *CompanyBriefResponse     `json:"company,omitempty"`
	Email      string                    `json:"email"`
	Role       domain.TeamRole           `json:"role"`
	Token      string                    `json:"token"`
	Status     domain.InvitationStatus   `json:"status"`
	InvitedBy  uuid.UUID                 `json:"invited_by"`
	Inviter    *UserBriefResponse        `json:"inviter,omitempty"`
	ExpiresAt  time.Time                 `json:"expires_at"`
	AcceptedAt *time.Time                `json:"accepted_at,omitempty"`
	CreatedAt  time.Time                 `json:"created_at"`
	UpdatedAt  time.Time                 `json:"updated_at"`
}

// InvitationListResponse represents the list of invitations
type InvitationListResponse struct {
	Invitations []InvitationResponse `json:"invitations"`
	Total       int                  `json:"total"`
}

// CompanyBriefResponse represents brief company information
type CompanyBriefResponse struct {
	ID      uuid.UUID `json:"id"`
	Name    string    `json:"name"`
	Slug    string    `json:"slug"`
	LogoURL *string   `json:"logo_url"`
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// ToInvitationResponse converts an invitation domain model to a response DTO
func ToInvitationResponse(invitation *domain.CompanyInvitation) InvitationResponse {
	response := InvitationResponse{
		ID:         invitation.ID,
		CompanyID:  invitation.CompanyID,
		Email:      invitation.Email,
		Role:       invitation.Role,
		Token:      invitation.Token,
		Status:     invitation.Status,
		InvitedBy:  invitation.InvitedBy,
		ExpiresAt:  invitation.ExpiresAt,
		AcceptedAt: invitation.AcceptedAt,
		CreatedAt:  invitation.CreatedAt,
		UpdatedAt:  invitation.UpdatedAt,
	}

	// Add company info if preloaded
	if invitation.Company != nil {
		response.Company = &CompanyBriefResponse{
			ID:      invitation.Company.ID,
			Name:    invitation.Company.Name,
			Slug:    invitation.Company.Slug,
			LogoURL: invitation.Company.LogoURL,
		}
	}

	// Add inviter info if preloaded
	if invitation.Inviter != nil {
		var avatarURL *string
		if invitation.Inviter.Profile != nil {
			avatarURL = invitation.Inviter.Profile.AvatarURL
		}
		response.Inviter = &UserBriefResponse{
			ID:        invitation.Inviter.ID,
			FirstName: invitation.Inviter.FirstName,
			LastName:  invitation.Inviter.LastName,
			Email:     invitation.Inviter.Email,
			AvatarURL: avatarURL,
		}
	}

	return response
}

// ToInvitationListResponse converts a list of invitations to a list response DTO
func ToInvitationListResponse(invitations []*domain.CompanyInvitation) InvitationListResponse {
	responses := make([]InvitationResponse, len(invitations))
	for i, invitation := range invitations {
		responses[i] = ToInvitationResponse(invitation)
	}

	return InvitationListResponse{
		Invitations: responses,
		Total:       len(responses),
	}
}

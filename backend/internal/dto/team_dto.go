package dto

import (
	"job-platform/internal/domain"
	"time"

	"github.com/google/uuid"
)

// ============================================
// TEAM REQUEST DTOs
// ============================================

// AddTeamMemberRequest represents the request to add a team member
type AddTeamMemberRequest struct {
	UserID uuid.UUID        `json:"user_id" binding:"required"`
	Role   domain.TeamRole  `json:"role" binding:"required"`
}

// UpdateTeamMemberRoleRequest represents the request to update a team member's role
type UpdateTeamMemberRoleRequest struct {
	Role domain.TeamRole `json:"role" binding:"required"`
}

// UpdateTeamMemberStatusRequest represents the request to update a team member's status
type UpdateTeamMemberStatusRequest struct {
	Status domain.TeamMemberStatus `json:"status" binding:"required"`
}

// TransferOwnershipRequest represents the request to transfer ownership
type TransferOwnershipRequest struct {
	NewOwnerUserID uuid.UUID `json:"new_owner_user_id" binding:"required"`
}

// ============================================
// TEAM RESPONSE DTOs
// ============================================

// TeamMemberResponse represents a team member response
type TeamMemberResponse struct {
	ID         uuid.UUID                  `json:"id"`
	CompanyID  uuid.UUID                  `json:"company_id"`
	UserID     uuid.UUID                  `json:"user_id"`
	User       *UserBriefResponse         `json:"user,omitempty"`
	Role       domain.TeamRole            `json:"role"`
	Status     domain.TeamMemberStatus    `json:"status"`
	Permissions map[string]interface{}    `json:"permissions,omitempty"`
	InvitedBy  *uuid.UUID                 `json:"invited_by,omitempty"`
	InvitedAt  *time.Time                 `json:"invited_at,omitempty"`
	JoinedAt   *time.Time                 `json:"joined_at,omitempty"`
	CreatedAt  time.Time                  `json:"created_at"`
	UpdatedAt  time.Time                  `json:"updated_at"`
}

// TeamMemberListResponse represents the list of team members
type TeamMemberListResponse struct {
	Members []TeamMemberResponse `json:"members"`
	Total   int                  `json:"total"`
}

// UserBriefResponse represents brief user information
type UserBriefResponse struct {
	ID        uuid.UUID `json:"id"`
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name"`
	Email     string    `json:"email"`
	AvatarURL *string   `json:"avatar_url"`
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// ToTeamMemberResponse converts a team member domain model to a response DTO
func ToTeamMemberResponse(member *domain.CompanyTeamMember) TeamMemberResponse {
	response := TeamMemberResponse{
		ID:          member.ID,
		CompanyID:   member.CompanyID,
		UserID:      member.UserID,
		Role:        member.Role,
		Status:      member.Status,
		Permissions: member.Permissions,
		InvitedBy:   member.InvitedBy,
		InvitedAt:   member.InvitedAt,
		JoinedAt:    member.JoinedAt,
		CreatedAt:   member.CreatedAt,
		UpdatedAt:   member.UpdatedAt,
	}

	// Add user info if preloaded
	if member.User != nil {
		var avatarURL *string
		if member.User.Profile != nil {
			avatarURL = member.User.Profile.AvatarURL
		}
		response.User = &UserBriefResponse{
			ID:        member.User.ID,
			FirstName: member.User.FirstName,
			LastName:  member.User.LastName,
			Email:     member.User.Email,
			AvatarURL: avatarURL,
		}
	}

	return response
}

// ToTeamMemberListResponse converts a list of team members to a list response DTO
func ToTeamMemberListResponse(members []*domain.CompanyTeamMember) TeamMemberListResponse {
	responses := make([]TeamMemberResponse, len(members))
	for i, member := range members {
		responses[i] = ToTeamMemberResponse(member)
	}

	return TeamMemberListResponse{
		Members: responses,
		Total:   len(responses),
	}
}

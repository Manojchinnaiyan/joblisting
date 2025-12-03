package dto

import (
	"job-platform/internal/domain"
	"time"

	"github.com/google/uuid"
)

// ============================================
// FOLLOWER REQUEST DTOs
// ============================================

// FollowCompanyRequest represents the request to follow a company
type FollowCompanyRequest struct {
	NotifyNewJobs bool `json:"notify_new_jobs"`
}

// UpdateFollowerNotificationsRequest represents the request to update notification preferences
type UpdateFollowerNotificationsRequest struct {
	NotifyNewJobs bool `json:"notify_new_jobs" binding:"required"`
}

// ============================================
// FOLLOWER RESPONSE DTOs
// ============================================

// FollowerResponse represents a follower response
type FollowerResponse struct {
	ID            uuid.UUID              `json:"id"`
	CompanyID     uuid.UUID              `json:"company_id"`
	UserID        uuid.UUID              `json:"user_id"`
	User          *UserBriefResponse     `json:"user,omitempty"`
	Company       *CompanyBriefResponse  `json:"company,omitempty"`
	NotifyNewJobs bool                   `json:"notify_new_jobs"`
	CreatedAt     time.Time              `json:"created_at"`
}

// FollowerListResponse represents the list of followers with pagination
type FollowerListResponse struct {
	Followers  []FollowerResponse `json:"followers"`
	Total      int64              `json:"total"`
	Page       int                `json:"page"`
	Limit      int                `json:"limit"`
	TotalPages int                `json:"total_pages"`
}

// FollowingListResponse represents the list of companies a user is following
type FollowingListResponse struct {
	Following  []FollowerResponse `json:"following"`
	Total      int64              `json:"total"`
	Page       int                `json:"page"`
	Limit      int                `json:"limit"`
	TotalPages int                `json:"total_pages"`
}

// FollowerStatsResponse represents follower statistics
type FollowerStatsResponse struct {
	TotalFollowers int64 `json:"total_followers"`
	TotalFollowing int64 `json:"total_following"`
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// ToFollowerResponse converts a follower domain model to a response DTO
func ToFollowerResponse(follower *domain.CompanyFollower) FollowerResponse {
	response := FollowerResponse{
		ID:            follower.ID,
		CompanyID:     follower.CompanyID,
		UserID:        follower.UserID,
		NotifyNewJobs: follower.NotifyNewJobs,
		CreatedAt:     follower.CreatedAt,
	}

	// Add user info if preloaded
	if follower.User != nil {
		var avatarURL *string
		if follower.User.Profile != nil {
			avatarURL = follower.User.Profile.AvatarURL
		}
		response.User = &UserBriefResponse{
			ID:        follower.User.ID,
			FirstName: follower.User.FirstName,
			LastName:  follower.User.LastName,
			Email:     follower.User.Email,
			AvatarURL: avatarURL,
		}
	}

	// Add company info if preloaded
	if follower.Company != nil {
		response.Company = &CompanyBriefResponse{
			ID:      follower.Company.ID,
			Name:    follower.Company.Name,
			Slug:    follower.Company.Slug,
			LogoURL: follower.Company.LogoURL,
		}
	}

	return response
}

// ToFollowerListResponse converts a list of followers to a list response DTO
func ToFollowerListResponse(followers []*domain.CompanyFollower, total int64, page, limit int) FollowerListResponse {
	responses := make([]FollowerResponse, len(followers))
	for i, follower := range followers {
		responses[i] = ToFollowerResponse(follower)
	}

	totalPages := int(total) / limit
	if int(total)%limit != 0 {
		totalPages++
	}

	return FollowerListResponse{
		Followers:  responses,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}
}

// ToFollowingListResponse converts a list of following to a list response DTO
func ToFollowingListResponse(following []*domain.CompanyFollower, total int64, page, limit int) FollowingListResponse {
	responses := make([]FollowerResponse, len(following))
	for i, follower := range following {
		responses[i] = ToFollowerResponse(follower)
	}

	totalPages := int(total) / limit
	if int(total)%limit != 0 {
		totalPages++
	}

	return FollowingListResponse{
		Following:  responses,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}
}

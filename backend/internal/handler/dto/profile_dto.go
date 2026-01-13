package dto

import (
	"job-platform/internal/domain"
	"time"

	"github.com/google/uuid"
)

// CreateProfileRequest contains fields for creating a profile
type CreateProfileRequest struct {
	Headline               *string  `json:"headline"`
	Bio                    *string  `json:"bio"`
	City                   *string  `json:"city"`
	State                  *string  `json:"state"`
	Country                *string  `json:"country"`
	Phone                  *string  `json:"phone"`
	LinkedInURL            *string  `json:"linkedin_url"`
	GitHubURL              *string  `json:"github_url"`
	PortfolioURL           *string  `json:"portfolio_url"`
	PreferredJobTypes      []string `json:"preferred_job_types"`
	DesiredSalaryMin       *int     `json:"desired_salary_min"`
	DesiredSalaryMax       *int     `json:"desired_salary_max"`
	WillingToRelocate      *bool    `json:"willing_to_relocate"`
	OpenToRemote           *bool    `json:"open_to_remote"`
	AvailableFrom          *string  `json:"available_from"` // YYYY-MM-DD
	PreferredWorkLocations []string `json:"preferred_work_locations"`
	Visibility             *string  `json:"visibility"` // PUBLIC, EMPLOYERS_ONLY, PRIVATE, APPLIED_ONLY
}

// UpdateProfileRequest contains fields for updating a profile
type UpdateProfileRequest struct {
	// User fields (will be updated on User model)
	FirstName *string `json:"first_name"`
	LastName  *string `json:"last_name"`

	// Profile fields
	Headline               *string  `json:"headline"`
	Bio                    *string  `json:"bio"`
	City                   *string  `json:"city"`
	State                  *string  `json:"state"`
	Country                *string  `json:"country"`
	Phone                  *string  `json:"phone"`
	DateOfBirth            *string  `json:"date_of_birth"` // YYYY-MM-DD
	CurrentTitle           *string  `json:"current_title"`
	CurrentCompany         *string  `json:"current_company"`
	LinkedInURL            *string  `json:"linkedin_url"`
	GitHubURL              *string  `json:"github_url"`
	PortfolioURL           *string  `json:"portfolio_url"`
	WebsiteURL             *string  `json:"website_url"`
	TotalExperienceYears   *float32 `json:"total_experience_years"`
	PreferredJobTypes      []string `json:"preferred_job_types"`
	DesiredSalaryMin       *int     `json:"desired_salary_min"`
	DesiredSalaryMax       *int     `json:"desired_salary_max"`
	WillingToRelocate      *bool    `json:"willing_to_relocate"`
	OpenToRemote           *bool    `json:"open_to_remote"`
	AvailableFrom          *string  `json:"available_from"` // YYYY-MM-DD
	PreferredWorkLocations []string `json:"preferred_work_locations"`
	Visibility             *string  `json:"visibility"`
	ShowEmail              *bool    `json:"show_email"`
	ShowPhone              *bool    `json:"show_phone"`
	OpenToOpportunities    *bool    `json:"open_to_opportunities"`
}

// ProfileResponse represents a profile response
type ProfileResponse struct {
	ID                     uuid.UUID  `json:"id"`
	UserID                 uuid.UUID  `json:"user_id"`
	Headline               *string    `json:"headline"`
	Bio                    *string    `json:"bio"`
	AvatarURL              *string    `json:"avatar_url"`
	City                   *string    `json:"city"`
	State                  *string    `json:"state"`
	Country                *string    `json:"country"`
	Phone                  *string    `json:"phone"`
	DateOfBirth            *time.Time `json:"date_of_birth"`
	CurrentTitle           *string    `json:"current_title"`
	CurrentCompany         *string    `json:"current_company"`
	LinkedInURL            *string    `json:"linkedin_url"`
	GitHubURL              *string    `json:"github_url"`
	PortfolioURL           *string    `json:"portfolio_url"`
	WebsiteURL             *string    `json:"website_url"`
	TotalExperienceYears   *float32   `json:"total_experience_years"`
	PreferredJobTypes      []string   `json:"preferred_job_types"`
	DesiredSalaryMin       *int       `json:"desired_salary_min"`
	DesiredSalaryMax       *int       `json:"desired_salary_max"`
	WillingToRelocate      bool       `json:"willing_to_relocate"`
	OpenToRemote           bool       `json:"open_to_remote"`
	AvailableFrom          *time.Time `json:"available_from"`
	PreferredWorkLocations []string   `json:"preferred_work_locations"`
	CompletenessScore      int        `json:"completeness_score"`
	Visibility             string     `json:"visibility"`
	ShowEmail              bool       `json:"show_email"`
	ShowPhone              bool       `json:"show_phone"`
	OpenToOpportunities    bool       `json:"open_to_opportunities"`
	LastActive             *time.Time `json:"last_active"`
	ProfileViews           int        `json:"profile_views"`
	CreatedAt              time.Time  `json:"created_at"`
	UpdatedAt              time.Time  `json:"updated_at"`
}

// ProfileWithUserResponse includes user information
type ProfileWithUserResponse struct {
	ProfileResponse
	User UserSummaryResponse `json:"user"`
}

// UserSummaryResponse contains basic user information
type UserSummaryResponse struct {
	ID        uuid.UUID `json:"id"`
	Email     string    `json:"email"`
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name"`
	FullName  string    `json:"full_name"`
	Role      string    `json:"role"`
}

// CompletenessBreakdownResponse represents profile completeness breakdown
type CompletenessBreakdownResponse struct {
	TotalScore       int                        `json:"total_score"`
	MaxScore         int                        `json:"max_score"`
	Percentage       int                        `json:"percentage"`
	Sections         map[string]SectionScore    `json:"sections"`
	MissingSections  []string                   `json:"missing_sections"`
	Recommendations  []string                   `json:"recommendations"`
}

// SectionScore represents a section's completeness score
type SectionScore struct {
	CurrentScore int    `json:"current_score"`
	MaxScore     int    `json:"max_score"`
	Percentage   int    `json:"percentage"`
	IsComplete   bool   `json:"is_complete"`
	Description  string `json:"description"`
}

// ProfileSearchRequest contains search filters
type ProfileSearchRequest struct {
	Skills             []string `json:"skills"`
	MinExperienceYears *float32 `json:"min_experience_years"`
	MaxExperienceYears *float32 `json:"max_experience_years"`
	DesiredSalaryMin   *int     `json:"desired_salary_min"`
	DesiredSalaryMax   *int     `json:"desired_salary_max"`
	JobTypes           []string `json:"job_types"`
	Locations          []string `json:"locations"`
	RemoteOnly         *bool    `json:"remote_only"`
	AvailableFrom      *string  `json:"available_from"` // YYYY-MM-DD
	Keyword            string   `json:"keyword"`
	MinCompleteness    *int     `json:"min_completeness"`
	Limit              int      `json:"limit"`
	Offset             int      `json:"offset"`
}

// ProfileSearchResponse contains search results
type ProfileSearchResponse struct {
	Profiles   []ProfileWithUserResponse `json:"profiles"`
	Total      int64                     `json:"total"`
	Limit      int                       `json:"limit"`
	Offset     int                       `json:"offset"`
	Page       int                       `json:"page"`
	TotalPages int                       `json:"total_pages"`
}

// UpdateVisibilityRequest for updating profile visibility
type UpdateVisibilityRequest struct {
	Visibility string `json:"visibility" binding:"required"`
}

// ProfileStatsResponse contains profile statistics
type ProfileStatsResponse struct {
	TotalProfiles       int64              `json:"total_profiles"`
	CompleteProfiles    int64              `json:"complete_profiles"`
	IncompleteProfiles  int64              `json:"incomplete_profiles"`
	AverageCompleteness float64            `json:"average_completeness"`
	VisibilityStats     map[string]int64   `json:"visibility_stats"`
	TopSkills           []SkillStat        `json:"top_skills"`
}

// SkillStat represents skill usage statistics
type SkillStat struct {
	Name  string `json:"name"`
	Count int64  `json:"count"`
}

// ToProfileResponse converts domain.UserProfile to ProfileResponse
func ToProfileResponse(profile *domain.UserProfile) *ProfileResponse {
	return &ProfileResponse{
		ID:                     profile.ID,
		UserID:                 profile.UserID,
		Headline:               profile.Headline,
		Bio:                    profile.Bio,
		AvatarURL:              profile.AvatarURL,
		City:                   profile.City,
		State:                  profile.State,
		Country:                profile.Country,
		Phone:                  profile.Phone,
		DateOfBirth:            profile.DateOfBirth,
		CurrentTitle:           profile.CurrentTitle,
		CurrentCompany:         profile.CurrentCompany,
		LinkedInURL:            profile.LinkedInURL,
		GitHubURL:              profile.GithubURL,
		PortfolioURL:           profile.PortfolioURL,
		WebsiteURL:             profile.WebsiteURL,
		TotalExperienceYears:   profile.TotalExperienceYears,
		PreferredJobTypes:      profile.PreferredJobTypes,
		DesiredSalaryMin:       profile.ExpectedSalaryMin,
		DesiredSalaryMax:       profile.ExpectedSalaryMax,
		WillingToRelocate:      profile.WillingToRelocate,
		OpenToRemote:           false,
		AvailableFrom:          profile.AvailableFrom,
		PreferredWorkLocations: profile.PreferredWorkplaceTypes,
		CompletenessScore:      profile.CompletenessScore,
		Visibility:             string(profile.Visibility),
		ShowEmail:              profile.ShowEmail,
		ShowPhone:              profile.ShowPhone,
		OpenToOpportunities:    profile.OpenToOpportunities,
		LastActive:             profile.LastActive,
		ProfileViews:           profile.ProfileViews,
		CreatedAt:              profile.CreatedAt,
		UpdatedAt:              profile.UpdatedAt,
	}
}

// ToProfileWithUserResponse converts domain.UserProfile and domain.User to ProfileWithUserResponse
func ToProfileWithUserResponse(profile *domain.UserProfile, user *domain.User) *ProfileWithUserResponse {
	return &ProfileWithUserResponse{
		ProfileResponse: *ToProfileResponse(profile),
		User: UserSummaryResponse{
			ID:        user.ID,
			Email:     user.Email,
			FirstName: user.FirstName,
			LastName:  user.LastName,
			FullName:  user.FirstName + " " + user.LastName,
			Role:      string(user.Role),
		},
	}
}

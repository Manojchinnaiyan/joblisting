package dto

import (
	"job-platform/internal/domain"
	"time"

	"github.com/google/uuid"
)

// CreateExperienceRequest contains fields for creating work experience
type CreateExperienceRequest struct {
	CompanyName      string   `json:"company_name" binding:"required"`
	CompanyWebsite   *string  `json:"company_website"`
	Title            string   `json:"title" binding:"required"`
	EmploymentType   string   `json:"employment_type" binding:"required"` // FULL_TIME, PART_TIME, CONTRACT, FREELANCE, INTERNSHIP
	Location         *string  `json:"location"`
	IsRemote         bool     `json:"is_remote"`
	StartDate        string   `json:"start_date" binding:"required"` // YYYY-MM-DD
	EndDate          *string  `json:"end_date"`                      // YYYY-MM-DD or null
	IsCurrent        bool     `json:"is_current"`
	Description      *string  `json:"description"`
	Achievements     []string `json:"achievements"`
	SkillsUsed       []string `json:"skills_used"`
}

// UpdateExperienceRequest contains fields for updating work experience
type UpdateExperienceRequest struct {
	CompanyName      *string  `json:"company_name"`
	CompanyWebsite   *string  `json:"company_website"`
	Title            *string  `json:"title"`
	EmploymentType   *string  `json:"employment_type"`
	Location         *string  `json:"location"`
	IsRemote         *bool    `json:"is_remote"`
	StartDate        *string  `json:"start_date"` // YYYY-MM-DD
	EndDate          *string  `json:"end_date"`   // YYYY-MM-DD
	IsCurrent        *bool    `json:"is_current"`
	Description      *string  `json:"description"`
	Achievements     []string `json:"achievements"`
	SkillsUsed       []string `json:"skills_used"`
}

// ExperienceResponse represents a work experience response
type ExperienceResponse struct {
	ID               uuid.UUID  `json:"id"`
	UserID           uuid.UUID  `json:"user_id"`
	CompanyName      string     `json:"company_name"`
	CompanyWebsite   *string    `json:"company_website"`
	Title            string     `json:"title"`
	EmploymentType   string     `json:"employment_type"`
	Location         *string    `json:"location"`
	IsRemote         bool       `json:"is_remote"`
	StartDate        time.Time  `json:"start_date"`
	EndDate          *time.Time `json:"end_date"`
	IsCurrent        bool       `json:"is_current"`
	Description      *string    `json:"description"`
	Achievements     []string   `json:"achievements"`
	SkillsUsed       []string   `json:"skills_used"`
	DurationYears    float32    `json:"duration_years"`
	DurationMonths   int        `json:"duration_months"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

// ExperienceListResponse contains list of work experiences
type ExperienceListResponse struct {
	Experiences          []ExperienceResponse `json:"experiences"`
	Total                int                  `json:"total"`
	TotalExperienceYears float32              `json:"total_experience_years"`
	CurrentPositions     int                  `json:"current_positions"`
}

// ToExperienceResponse converts domain.WorkExperience to ExperienceResponse
func ToExperienceResponse(exp *domain.WorkExperience) *ExperienceResponse {
	durationYears := exp.GetDurationYears()
	durationMonths := int(durationYears * 12)

	return &ExperienceResponse{
		ID:               exp.ID,
		UserID:           exp.UserID,
		CompanyName:      exp.CompanyName,
		CompanyWebsite:   nil, // Not in domain model
		Title:            exp.Title,
		EmploymentType:   string(exp.EmploymentType),
		Location:         exp.Location,
		IsRemote:         exp.IsRemote,
		StartDate:        exp.StartDate,
		EndDate:          exp.EndDate,
		IsCurrent:        exp.IsCurrent,
		Description:      exp.Description,
		Achievements:     exp.Achievements,
		SkillsUsed:       exp.SkillsUsed,
		DurationYears:    durationYears,
		DurationMonths:   durationMonths,
		CreatedAt:        exp.CreatedAt,
		UpdatedAt:        exp.UpdatedAt,
	}
}

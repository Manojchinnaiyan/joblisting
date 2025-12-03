package dto

import (
	"job-platform/internal/domain"
	"time"

	"github.com/google/uuid"
)

// CreateEducationRequest contains fields for creating education
type CreateEducationRequest struct {
	InstitutionName string   `json:"institution_name" binding:"required"`
	DegreeType      string   `json:"degree_type" binding:"required"` // HIGH_SCHOOL, ASSOCIATE, BACHELOR, MASTER, DOCTORATE, CERTIFICATION, OTHER
	FieldOfStudy    *string  `json:"field_of_study"`
	DegreeName      *string  `json:"degree_name"`
	StartDate       string   `json:"start_date" binding:"required"` // YYYY-MM-DD
	EndDate         *string  `json:"end_date"`                      // YYYY-MM-DD or null
	IsCurrent       bool     `json:"is_current"`
	Grade           *string  `json:"grade"`
	GPA             *float32 `json:"gpa"`
	MaxGPA          *float32 `json:"max_gpa"`
	Description     *string  `json:"description"`
	Achievements    []string `json:"achievements"`
	Location        *string  `json:"location"`
}

// UpdateEducationRequest contains fields for updating education
type UpdateEducationRequest struct {
	InstitutionName *string  `json:"institution_name"`
	DegreeType      *string  `json:"degree_type"`
	FieldOfStudy    *string  `json:"field_of_study"`
	DegreeName      *string  `json:"degree_name"`
	StartDate       *string  `json:"start_date"` // YYYY-MM-DD
	EndDate         *string  `json:"end_date"`   // YYYY-MM-DD
	IsCurrent       *bool    `json:"is_current"`
	Grade           *string  `json:"grade"`
	GPA             *float32 `json:"gpa"`
	MaxGPA          *float32 `json:"max_gpa"`
	Description     *string  `json:"description"`
	Achievements    []string `json:"achievements"`
	Location        *string  `json:"location"`
}

// EducationResponse represents an education response
type EducationResponse struct {
	ID              uuid.UUID  `json:"id"`
	UserID          uuid.UUID  `json:"user_id"`
	InstitutionName string     `json:"institution_name"`
	DegreeType      string     `json:"degree_type"`
	FieldOfStudy    *string    `json:"field_of_study"`
	DegreeName      *string    `json:"degree_name"`
	StartDate       time.Time  `json:"start_date"`
	EndDate         *time.Time `json:"end_date"`
	IsCurrent       bool       `json:"is_current"`
	Grade           *string    `json:"grade"`
	GPA             *float32   `json:"gpa"`
	MaxGPA          *float32   `json:"max_gpa"`
	Description     *string    `json:"description"`
	Achievements    []string   `json:"achievements"`
	Location        *string    `json:"location"`
	DurationYears   float32    `json:"duration_years"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

// EducationListResponse contains list of education entries
type EducationListResponse struct {
	Education      []EducationResponse `json:"education"`
	Total          int                 `json:"total"`
	HighestDegree  *string             `json:"highest_degree"`
}

// ToEducationResponse converts domain.Education to EducationResponse
func ToEducationResponse(edu *domain.Education) *EducationResponse {
	durationYears := edu.GetDurationYears()

	// Convert Activities to Achievements for DTO
	var achievements []string
	if len(edu.Activities) > 0 {
		achievements = edu.Activities
	}

	// Map field names from domain to DTO
	institutionName := edu.Institution
	degreeType := string(edu.Degree)
	fieldOfStudy := &edu.FieldOfStudy

	return &EducationResponse{
		ID:              edu.ID,
		UserID:          edu.UserID,
		InstitutionName: institutionName,
		DegreeType:      degreeType,
		FieldOfStudy:    fieldOfStudy,
		DegreeName:      nil, // Not in domain model
		StartDate:       edu.StartDate,
		EndDate:         edu.EndDate,
		IsCurrent:       edu.IsCurrent,
		Grade:           edu.Grade,
		GPA:             nil, // Not in domain model
		MaxGPA:          nil, // Not in domain model
		Description:     edu.Description,
		Achievements:    achievements,
		Location:        nil, // Not in domain model
		DurationYears:   durationYears,
		CreatedAt:       edu.CreatedAt,
		UpdatedAt:       edu.UpdatedAt,
	}
}

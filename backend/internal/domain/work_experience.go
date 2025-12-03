package domain

import (
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
)

// EmploymentType defines types of employment
type EmploymentType string

const (
	EmploymentFullTime   EmploymentType = "FULL_TIME"
	EmploymentPartTime   EmploymentType = "PART_TIME"
	EmploymentContract   EmploymentType = "CONTRACT"
	EmploymentFreelance  EmploymentType = "FREELANCE"
	EmploymentInternship EmploymentType = "INTERNSHIP"
)

// WorkExperience represents a user's work experience entry
type WorkExperience struct {
	ID     uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	UserID uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`

	// Company Info
	CompanyName    string  `gorm:"type:varchar(255);not null" json:"company_name"`
	CompanyLogoURL *string `gorm:"type:text" json:"company_logo_url"`

	// Position
	Title          string         `gorm:"type:varchar(255);not null" json:"title"`
	EmploymentType EmploymentType `gorm:"type:employment_type;default:'FULL_TIME'" json:"employment_type"`
	Location       *string        `gorm:"type:varchar(255)" json:"location"`
	IsRemote       bool           `gorm:"default:false" json:"is_remote"`

	// Duration
	StartDate time.Time  `gorm:"type:date;not null" json:"start_date"`
	EndDate   *time.Time `gorm:"type:date" json:"end_date"`
	IsCurrent bool       `gorm:"default:false" json:"is_current"`

	// Details
	Description  *string        `gorm:"type:text" json:"description"`
	Achievements pq.StringArray `gorm:"type:text[]" json:"achievements"`
	SkillsUsed   pq.StringArray `gorm:"type:text[]" json:"skills_used"`

	// Relationships
	User *User `gorm:"foreignKey:UserID" json:"user,omitempty"`

	// Timestamps
	CreatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`
}

// TableName specifies the table name for WorkExperience
func (WorkExperience) TableName() string {
	return "work_experiences"
}

// GetDuration calculates the duration of employment in months
func (w *WorkExperience) GetDuration() int {
	endDate := time.Now()
	if w.EndDate != nil {
		endDate = *w.EndDate
	}

	years := endDate.Year() - w.StartDate.Year()
	months := int(endDate.Month()) - int(w.StartDate.Month())

	totalMonths := years*12 + months

	if totalMonths < 0 {
		return 0
	}

	return totalMonths
}

// GetDurationYears calculates the duration in years (decimal)
func (w *WorkExperience) GetDurationYears() float32 {
	months := w.GetDuration()
	return float32(months) / 12.0
}

// IsActive checks if this is a current position
func (w *WorkExperience) IsActive() bool {
	return w.IsCurrent
}

// Validate performs basic validation
func (w *WorkExperience) Validate() error {
	if w.CompanyName == "" {
		return ErrInvalidInput
	}
	if w.Title == "" {
		return ErrInvalidInput
	}
	if w.IsCurrent && w.EndDate != nil {
		return ErrInvalidInput
	}
	if !w.IsCurrent && w.EndDate != nil && w.EndDate.Before(w.StartDate) {
		return ErrInvalidInput
	}
	return nil
}

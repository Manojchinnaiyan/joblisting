package domain

import (
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
)

// DegreeType defines types of degrees
type DegreeType string

const (
	DegreeHighSchool    DegreeType = "HIGH_SCHOOL"
	DegreeAssociate     DegreeType = "ASSOCIATE"
	DegreeBachelor      DegreeType = "BACHELOR"
	DegreeMaster        DegreeType = "MASTER"
	DegreeDoctorate     DegreeType = "DOCTORATE"
	DegreeCertification DegreeType = "CERTIFICATION"
	DegreeOther         DegreeType = "OTHER"
)

// Education represents a user's education entry
type Education struct {
	ID     uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	UserID uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`

	// Institution
	Institution        string  `gorm:"type:varchar(255);not null" json:"institution"`
	InstitutionLogoURL *string `gorm:"type:text" json:"institution_logo_url"`

	// Degree
	Degree       DegreeType `gorm:"type:degree_type;not null" json:"degree"`
	FieldOfStudy string     `gorm:"type:varchar(255);not null" json:"field_of_study"`

	// Duration
	StartDate time.Time  `gorm:"type:date;not null" json:"start_date"`
	EndDate   *time.Time `gorm:"type:date" json:"end_date"`
	IsCurrent bool       `gorm:"default:false" json:"is_current"`

	// Details
	Grade       *string        `gorm:"type:varchar(50)" json:"grade"`
	Description *string        `gorm:"type:text" json:"description"`
	Activities  pq.StringArray `gorm:"type:text[]" json:"activities"`

	// Relationships
	User *User `gorm:"foreignKey:UserID" json:"user,omitempty"`

	// Timestamps
	CreatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`
}

// TableName specifies the table name for Education
func (Education) TableName() string {
	return "education"
}

// IsActive checks if currently studying
func (e *Education) IsActive() bool {
	return e.IsCurrent
}

// GetDuration calculates the duration of education in months
func (e *Education) GetDuration() int {
	endDate := time.Now()
	if e.EndDate != nil {
		endDate = *e.EndDate
	}

	years := endDate.Year() - e.StartDate.Year()
	months := int(endDate.Month()) - int(e.StartDate.Month())

	totalMonths := years*12 + months

	if totalMonths < 0 {
		return 0
	}

	return totalMonths
}

// Validate performs basic validation
func (e *Education) Validate() error {
	if e.Institution == "" {
		return ErrInvalidInput
	}
	if e.FieldOfStudy == "" {
		return ErrInvalidInput
	}
	if e.IsCurrent && e.EndDate != nil {
		return ErrInvalidInput
	}
	if !e.IsCurrent && e.EndDate != nil && e.EndDate.Before(e.StartDate) {
		return ErrInvalidInput
	}
	return nil
}

// IsUndergraduate checks if degree is undergraduate level
func (e *Education) IsUndergraduate() bool {
	return e.Degree == DegreeAssociate || e.Degree == DegreeBachelor
}

// IsPostgraduate checks if degree is postgraduate level
func (e *Education) IsPostgraduate() bool {
	return e.Degree == DegreeMaster || e.Degree == DegreeDoctorate
}

// GetDurationYears calculates the duration in years
func (e *Education) GetDurationYears() float32 {
	return float32(e.GetDuration()) / 12.0
}

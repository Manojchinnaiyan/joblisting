package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
)

// ApplicationStatus represents the current status of a job application
type ApplicationStatus string

const (
	ApplicationStatusSubmitted   ApplicationStatus = "SUBMITTED"
	ApplicationStatusReviewed    ApplicationStatus = "REVIEWED"
	ApplicationStatusShortlisted ApplicationStatus = "SHORTLISTED"
	ApplicationStatusInterview   ApplicationStatus = "INTERVIEW"
	ApplicationStatusOffered     ApplicationStatus = "OFFERED"
	ApplicationStatusHired       ApplicationStatus = "HIRED"
	ApplicationStatusRejected    ApplicationStatus = "REJECTED"
	ApplicationStatusWithdrawn   ApplicationStatus = "WITHDRAWN"
)

// Application represents a job application submitted by a candidate
type Application struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	JobID       uuid.UUID `gorm:"type:uuid;not null;index;uniqueIndex:idx_job_applicant"`
	ApplicantID uuid.UUID `gorm:"type:uuid;not null;index;uniqueIndex:idx_job_applicant"`

	// Application Data
	ResumeURL      string         `gorm:"type:text;not null"`
	CoverLetter    string         `gorm:"type:text"`
	ExpectedSalary *int           `gorm:"type:integer"`
	AvailableFrom  *time.Time     `gorm:"type:date"`
	Answers        datatypes.JSON `gorm:"type:jsonb"`

	// Status
	Status          ApplicationStatus `gorm:"type:varchar(20);not null;default:SUBMITTED;index"`
	StatusUpdatedAt *time.Time
	StatusUpdatedBy *uuid.UUID `gorm:"type:uuid"`
	RejectionReason string     `gorm:"type:text"`

	// Notes (employer internal)
	EmployerNotes string `gorm:"type:text"`
	Rating        *int   `gorm:"check:rating >= 1 AND rating <= 5"`

	// Dates
	AppliedAt  time.Time `gorm:"default:CURRENT_TIMESTAMP;index"`
	ReviewedAt *time.Time
	CreatedAt  time.Time
	UpdatedAt  time.Time

	// Relationships
	Job           Job                        `gorm:"foreignKey:JobID"`
	Applicant     User                       `gorm:"foreignKey:ApplicantID"`
	StatusUpdater *User                      `gorm:"foreignKey:StatusUpdatedBy"`
	StatusHistory []ApplicationStatusHistory `gorm:"foreignKey:ApplicationID"`
}

// TableName specifies the table name for Application
func (Application) TableName() string {
	return "applications"
}

// CanWithdraw returns true if the application can be withdrawn
func (a *Application) CanWithdraw() bool {
	return a.Status == ApplicationStatusSubmitted ||
		a.Status == ApplicationStatusReviewed ||
		a.Status == ApplicationStatusShortlisted
}

// IsInFinalStage returns true if application is in a final stage
func (a *Application) IsInFinalStage() bool {
	return a.Status == ApplicationStatusHired ||
		a.Status == ApplicationStatusRejected ||
		a.Status == ApplicationStatusWithdrawn
}

// ApplicationStatusHistory tracks the history of status changes
type ApplicationStatusHistory struct {
	ID            uuid.UUID          `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	ApplicationID uuid.UUID          `gorm:"type:uuid;not null;index"`
	FromStatus    *ApplicationStatus `gorm:"type:varchar(20)"`
	ToStatus      ApplicationStatus  `gorm:"type:varchar(20);not null"`
	ChangedBy     *uuid.UUID         `gorm:"type:uuid"`
	Notes         string             `gorm:"type:text"`
	CreatedAt     time.Time

	// Relationships
	Application Application `gorm:"foreignKey:ApplicationID"`
	Changer     *User       `gorm:"foreignKey:ChangedBy"`
}

// TableName specifies the table name for ApplicationStatusHistory
func (ApplicationStatusHistory) TableName() string {
	return "application_status_history"
}

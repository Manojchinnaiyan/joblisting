package domain

import (
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
)

// JobType represents the type of employment
type JobType string

const (
	JobTypeFullTime   JobType = "FULL_TIME"
	JobTypePartTime   JobType = "PART_TIME"
	JobTypeContract   JobType = "CONTRACT"
	JobTypeFreelance  JobType = "FREELANCE"
	JobTypeInternship JobType = "INTERNSHIP"
)

// ExperienceLevel represents the required experience level
type ExperienceLevel string

const (
	ExperienceLevelEntry     ExperienceLevel = "ENTRY"
	ExperienceLevelMid       ExperienceLevel = "MID"
	ExperienceLevelSenior    ExperienceLevel = "SENIOR"
	ExperienceLevelLead      ExperienceLevel = "LEAD"
	ExperienceLevelExecutive ExperienceLevel = "EXECUTIVE"
)

// JobStatus represents the current status of a job posting
type JobStatus string

const (
	JobStatusDraft           JobStatus = "DRAFT"
	JobStatusPendingApproval JobStatus = "PENDING_APPROVAL"
	JobStatusActive          JobStatus = "ACTIVE"
	JobStatusExpired         JobStatus = "EXPIRED"
	JobStatusClosed          JobStatus = "CLOSED"
	JobStatusRejected        JobStatus = "REJECTED"
)

// WorkplaceType represents where the work is performed
type WorkplaceType string

const (
	WorkplaceTypeOnsite WorkplaceType = "ONSITE"
	WorkplaceTypeRemote WorkplaceType = "REMOTE"
	WorkplaceTypeHybrid WorkplaceType = "HYBRID"
)

// Job represents a job posting
type Job struct {
	ID         uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	EmployerID uuid.UUID `gorm:"type:uuid;not null;index"`

	// Basic Info
	Title            string `gorm:"size:255;not null"`
	Slug             string `gorm:"size:255;uniqueIndex;not null"`
	Description      string `gorm:"type:text;not null"`
	ShortDescription string `gorm:"size:500"`

	// Company Info (denormalized for search)
	CompanyName    string `gorm:"size:255;not null"`
	CompanyLogoURL string `gorm:"type:text"`

	// Job Details
	JobType         JobType         `gorm:"type:varchar(20);not null;index"`
	ExperienceLevel ExperienceLevel `gorm:"type:varchar(20);not null"`
	WorkplaceType   WorkplaceType   `gorm:"type:varchar(20);not null;default:ONSITE"`

	// Location
	Location  string   `gorm:"size:255;not null;index"`
	City      string   `gorm:"size:100"`
	State     string   `gorm:"size:100"`
	Country   string   `gorm:"size:100"`
	Latitude  *float64 `gorm:"type:decimal(10,8)"`
	Longitude *float64 `gorm:"type:decimal(11,8)"`

	// Salary
	SalaryMin      *int   `gorm:"type:integer"`
	SalaryMax      *int   `gorm:"type:integer"`
	SalaryCurrency string `gorm:"size:3;default:USD"`
	SalaryPeriod   string `gorm:"size:20;default:YEARLY"`
	HideSalary     bool   `gorm:"default:false"`

	// Requirements
	Skills             pq.StringArray `gorm:"type:text[]"`
	Education          string         `gorm:"size:255"`
	YearsExperienceMin int            `gorm:"default:0"`
	YearsExperienceMax *int

	// Additional
	Benefits         pq.StringArray `gorm:"type:text[]"`
	ApplicationURL   string         `gorm:"type:text"`
	ApplicationEmail string         `gorm:"size:255"`

	// Status & Moderation
	Status          JobStatus  `gorm:"type:varchar(20);not null;default:ACTIVE;index"`
	RejectionReason string     `gorm:"type:text"`
	ModeratedBy     *uuid.UUID `gorm:"type:uuid"`
	ModeratedAt     *time.Time

	// Featuring
	IsFeatured   bool       `gorm:"default:false"`
	FeaturedUntil *time.Time

	// Analytics
	ViewsCount        int `gorm:"default:0"`
	ApplicationsCount int `gorm:"default:0"`

	// Scraping
	OriginalURL  *string `gorm:"size:1000"`
	ScrapedData  *string `gorm:"type:jsonb"`
	ScrapeStatus string  `gorm:"size:20;default:manual"`

	// Dates
	PublishedAt *time.Time
	ExpiresAt   *time.Time
	CreatedAt   time.Time
	UpdatedAt   time.Time
	DeletedAt   *time.Time `gorm:"index"`

	// Relationships
	Employer     User                    `gorm:"foreignKey:EmployerID"`
	Moderator    *User                   `gorm:"foreignKey:ModeratedBy"`
	Categories   []JobCategory           `gorm:"many2many:job_category_mappings;joinForeignKey:JobID;joinReferences:CategoryID"`
	Applications []Application           `gorm:"foreignKey:JobID"`
	SavedJobs    []SavedJob              `gorm:"foreignKey:JobID"`
	Views        []JobView               `gorm:"foreignKey:JobID"`
}

// TableName specifies the table name for Job
func (Job) TableName() string {
	return "jobs"
}

// IsActive returns true if the job is currently active
func (j *Job) IsActive() bool {
	return j.Status == JobStatusActive
}

// IsExpired returns true if the job has expired status
func (j *Job) IsExpired() bool {
	return j.Status == JobStatusExpired
}

// CanAcceptApplications returns true if job can accept new applications
func (j *Job) CanAcceptApplications() bool {
	return j.Status == JobStatusActive
}

// BeforeCreate sets default values before creating
func (j *Job) BeforeCreate() error {
	if j.Status == "" {
		j.Status = JobStatusActive
	}
	if j.PublishedAt == nil && j.Status == JobStatusActive {
		now := time.Now()
		j.PublishedAt = &now
	}
	return nil
}

package domain

import (
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
)

// PortfolioProject represents a user's portfolio project
type PortfolioProject struct {
	ID     uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	UserID uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`

	// Project Info
	Title       string `gorm:"type:varchar(255);not null" json:"title"`
	Description string `gorm:"type:text;not null" json:"description"`

	// Links
	ProjectURL    *string `gorm:"type:varchar(500)" json:"project_url"`
	SourceCodeURL *string `gorm:"type:varchar(500)" json:"source_code_url"`

	// Media
	ThumbnailURL *string        `gorm:"type:text" json:"thumbnail_url"`
	Images       pq.StringArray `gorm:"type:text[]" json:"images"`

	// Details
	Technologies pq.StringArray `gorm:"type:text[]" json:"technologies"`
	StartDate    *time.Time     `gorm:"type:date" json:"start_date"`
	EndDate      *time.Time     `gorm:"type:date" json:"end_date"`
	IsFeatured   bool           `gorm:"default:false" json:"is_featured"`

	// Relationships
	User *User `gorm:"foreignKey:UserID" json:"user,omitempty"`

	// Timestamps
	CreatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`
}

// TableName specifies the table name for PortfolioProject
func (PortfolioProject) TableName() string {
	return "portfolio_projects"
}

// Validate performs basic validation
func (p *PortfolioProject) Validate() error {
	if p.Title == "" {
		return ErrInvalidInput
	}
	if p.Description == "" {
		return ErrInvalidInput
	}
	if p.StartDate != nil && p.EndDate != nil && p.EndDate.Before(*p.StartDate) {
		return ErrInvalidInput
	}
	return nil
}

// HasLinks checks if project has any links
func (p *PortfolioProject) HasLinks() bool {
	return p.ProjectURL != nil || p.SourceCodeURL != nil
}

// HasMedia checks if project has images or thumbnail
func (p *PortfolioProject) HasMedia() bool {
	return p.ThumbnailURL != nil || (p.Images != nil && len(p.Images) > 0)
}

// GetImageCount returns the number of images
func (p *PortfolioProject) GetImageCount() int {
	if p.Images == nil {
		return 0
	}
	return len(p.Images)
}

// GetTechnologyCount returns the number of technologies
func (p *PortfolioProject) GetTechnologyCount() int {
	if p.Technologies == nil {
		return 0
	}
	return len(p.Technologies)
}

// IsOngoing checks if project is still in progress
func (p *PortfolioProject) IsOngoing() bool {
	return p.StartDate != nil && p.EndDate == nil
}

// GetDuration calculates project duration in months
func (p *PortfolioProject) GetDuration() int {
	if p.StartDate == nil {
		return 0
	}

	endDate := time.Now()
	if p.EndDate != nil {
		endDate = *p.EndDate
	}

	years := endDate.Year() - p.StartDate.Year()
	months := int(endDate.Month()) - int(p.StartDate.Month())

	totalMonths := years*12 + months

	if totalMonths < 0 {
		return 0
	}

	return totalMonths
}

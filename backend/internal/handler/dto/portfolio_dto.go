package dto

import (
	"job-platform/internal/domain"
	"time"

	"github.com/google/uuid"
)

// CreatePortfolioRequest contains fields for creating a portfolio project
type CreatePortfolioRequest struct {
	Title          string   `json:"title" binding:"required"`
	Description    string   `json:"description" binding:"required"`
	ProjectURL     *string  `json:"project_url"`
	SourceCodeURL  *string  `json:"source_code_url"`
	Technologies   []string `json:"technologies"`
	StartDate      *string  `json:"start_date"` // YYYY-MM-DD
	EndDate        *string  `json:"end_date"`   // YYYY-MM-DD
	Role           *string  `json:"role"`
	TeamSize       *int     `json:"team_size"`
	Highlights     []string `json:"highlights"`
	IsFeatured     bool     `json:"is_featured"`
}

// UpdatePortfolioRequest contains fields for updating a portfolio project
type UpdatePortfolioRequest struct {
	Title          *string  `json:"title"`
	Description    *string  `json:"description"`
	ProjectURL     *string  `json:"project_url"`
	SourceCodeURL  *string  `json:"source_code_url"`
	Technologies   []string `json:"technologies"`
	StartDate      *string  `json:"start_date"` // YYYY-MM-DD
	EndDate        *string  `json:"end_date"`   // YYYY-MM-DD
	Role           *string  `json:"role"`
	TeamSize       *int     `json:"team_size"`
	Highlights     []string `json:"highlights"`
	IsFeatured     *bool    `json:"is_featured"`
}

// PortfolioResponse represents a portfolio project response
type PortfolioResponse struct {
	ID            uuid.UUID  `json:"id"`
	UserID        uuid.UUID  `json:"user_id"`
	Title         string     `json:"title"`
	Description   string     `json:"description"`
	ProjectURL    *string    `json:"project_url"`
	SourceCodeURL *string    `json:"source_code_url"`
	ThumbnailURL  *string    `json:"thumbnail_url"`
	Images        []string   `json:"images"`
	Technologies  []string   `json:"technologies"`
	StartDate     *time.Time `json:"start_date"`
	EndDate       *time.Time `json:"end_date"`
	IsOngoing     bool       `json:"is_ongoing"`
	Role          *string    `json:"role"`
	TeamSize      *int       `json:"team_size"`
	Highlights    []string   `json:"highlights"`
	IsFeatured    bool       `json:"is_featured"`
	ViewCount     int        `json:"view_count"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

// PortfolioListResponse contains list of portfolio projects
type PortfolioListResponse struct {
	Projects       []PortfolioResponse `json:"projects"`
	Total          int                 `json:"total"`
	Featured       int                 `json:"featured"`
	MaxFeatured    int                 `json:"max_featured"`
	CanAddFeatured bool                `json:"can_add_featured"`
}

// SetFeaturedRequest for setting featured status
type SetFeaturedRequest struct {
	IsFeatured bool `json:"is_featured"`
}

// AddImageResponse contains uploaded image URL
type AddImageResponse struct {
	ImageURL string `json:"image_url"`
	Total    int    `json:"total"`
}

// RemoveImageRequest for removing an image
type RemoveImageRequest struct {
	ImageURL string `json:"image_url" binding:"required"`
}

// ToPortfolioResponse converts domain.PortfolioProject to PortfolioResponse
func ToPortfolioResponse(project *domain.PortfolioProject) *PortfolioResponse {
	isOngoing := project.StartDate != nil && project.EndDate == nil

	return &PortfolioResponse{
		ID:            project.ID,
		UserID:        project.UserID,
		Title:         project.Title,
		Description:   project.Description,
		ProjectURL:    project.ProjectURL,
		SourceCodeURL: project.SourceCodeURL,
		ThumbnailURL:  project.ThumbnailURL,
		Images:        project.Images,
		Technologies:  project.Technologies,
		StartDate:     project.StartDate,
		EndDate:       project.EndDate,
		IsOngoing:     isOngoing,
		Role:          nil, // Not in domain model
		TeamSize:      nil, // Not in domain model
		Highlights:    nil, // Not in domain model
		IsFeatured:    project.IsFeatured,
		ViewCount:     0, // Not in domain model
		CreatedAt:     project.CreatedAt,
		UpdatedAt:     project.UpdatedAt,
	}
}

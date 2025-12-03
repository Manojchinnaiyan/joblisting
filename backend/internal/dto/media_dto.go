package dto

import (
	"job-platform/internal/domain"
	"time"

	"github.com/google/uuid"
)

// ============================================
// MEDIA REQUEST DTOs
// ============================================

// AddVideoRequest represents the request to add a video
type AddVideoRequest struct {
	URL          string  `json:"url" binding:"required,url"`
	ThumbnailURL *string `json:"thumbnail_url" binding:"omitempty,url"`
	Title        *string `json:"title" binding:"omitempty,max=255"`
	Description  *string `json:"description" binding:"omitempty"`
}

// UpdateMediaRequest represents the request to update media
type UpdateMediaRequest struct {
	Title       *string `json:"title" binding:"omitempty,max=255"`
	Description *string `json:"description" binding:"omitempty"`
}

// SetFeaturedRequest represents the request to set media as featured
type SetFeaturedRequest struct {
	IsFeatured bool `json:"is_featured" binding:"required"`
}

// ReorderMediaRequest represents the request to reorder media
type ReorderMediaRequest struct {
	MediaOrders []MediaOrder `json:"media_orders" binding:"required"`
}

// MediaOrder represents a media ID and its new sort order
type MediaOrder struct {
	MediaID   uuid.UUID `json:"media_id" binding:"required"`
	SortOrder int       `json:"sort_order" binding:"required,min=0"`
}

// ============================================
// MEDIA RESPONSE DTOs
// ============================================

// MediaResponse represents a media response
type MediaResponse struct {
	ID           uuid.UUID         `json:"id"`
	CompanyID    uuid.UUID         `json:"company_id"`
	Type         domain.MediaType  `json:"type"`
	URL          string            `json:"url"`
	ThumbnailURL *string           `json:"thumbnail_url"`
	Title        *string           `json:"title"`
	Description  *string           `json:"description"`
	SortOrder    int               `json:"sort_order"`
	IsFeatured   bool              `json:"is_featured"`
	CreatedAt    time.Time         `json:"created_at"`
	UpdatedAt    time.Time         `json:"updated_at"`
}

// MediaListResponse represents the list of media
type MediaListResponse struct {
	Media []MediaResponse `json:"media"`
	Total int             `json:"total"`
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// ToMediaResponse converts a media domain model to a response DTO
func ToMediaResponse(media *domain.CompanyMedia) MediaResponse {
	return MediaResponse{
		ID:           media.ID,
		CompanyID:    media.CompanyID,
		Type:         media.Type,
		URL:          media.URL,
		ThumbnailURL: media.ThumbnailURL,
		Title:        media.Title,
		Description:  media.Description,
		SortOrder:    media.SortOrder,
		IsFeatured:   media.IsFeatured,
		CreatedAt:    media.CreatedAt,
		UpdatedAt:    media.UpdatedAt,
	}
}

// ToMediaListResponse converts a list of media to a list response DTO
func ToMediaListResponse(media []*domain.CompanyMedia) MediaListResponse {
	responses := make([]MediaResponse, len(media))
	for i, m := range media {
		responses[i] = ToMediaResponse(m)
	}

	return MediaListResponse{
		Media: responses,
		Total: len(responses),
	}
}

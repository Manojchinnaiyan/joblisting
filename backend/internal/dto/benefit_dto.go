package dto

import (
	"job-platform/internal/domain"
	"time"

	"github.com/google/uuid"
)

// ============================================
// BENEFIT REQUEST DTOs
// ============================================

// CreateBenefitRequest represents the request to create a benefit
type CreateBenefitRequest struct {
	Title       string                  `json:"title" binding:"required,max=255"`
	Description *string                 `json:"description" binding:"omitempty"`
	Category    domain.BenefitCategory  `json:"category" binding:"required"`
	Icon        *string                 `json:"icon" binding:"omitempty,max=50"`
}

// UpdateBenefitRequest represents the request to update a benefit
type UpdateBenefitRequest struct {
	Title       string                  `json:"title" binding:"required,max=255"`
	Description *string                 `json:"description" binding:"omitempty"`
	Category    domain.BenefitCategory  `json:"category" binding:"required"`
	Icon        *string                 `json:"icon" binding:"omitempty,max=50"`
}

// ReorderBenefitsRequest represents the request to reorder benefits
type ReorderBenefitsRequest struct {
	BenefitOrders []BenefitOrder `json:"benefit_orders" binding:"required"`
}

// BenefitOrder represents a benefit ID and its new sort order
type BenefitOrder struct {
	BenefitID uuid.UUID `json:"benefit_id" binding:"required"`
	SortOrder int       `json:"sort_order" binding:"required,min=0"`
}

// ============================================
// BENEFIT RESPONSE DTOs
// ============================================

// BenefitResponse represents a benefit response
type BenefitResponse struct {
	ID          uuid.UUID              `json:"id"`
	CompanyID   uuid.UUID              `json:"company_id"`
	Title       string                 `json:"title"`
	Description *string                `json:"description"`
	Category    domain.BenefitCategory `json:"category"`
	Icon        *string                `json:"icon"`
	SortOrder   int                    `json:"sort_order"`
	CreatedAt   time.Time              `json:"created_at"`
	UpdatedAt   time.Time              `json:"updated_at"`
}

// BenefitListResponse represents the list of benefits
type BenefitListResponse struct {
	Benefits []BenefitResponse `json:"benefits"`
	Total    int               `json:"total"`
}

// BenefitsByCategory represents benefits grouped by category
type BenefitsByCategory struct {
	Category domain.BenefitCategory `json:"category"`
	Benefits []BenefitResponse      `json:"benefits"`
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// ToBenefitResponse converts a benefit domain model to a response DTO
func ToBenefitResponse(benefit *domain.CompanyBenefit) BenefitResponse {
	return BenefitResponse{
		ID:          benefit.ID,
		CompanyID:   benefit.CompanyID,
		Title:       benefit.Title,
		Description: benefit.Description,
		Category:    benefit.Category,
		Icon:        benefit.Icon,
		SortOrder:   benefit.SortOrder,
		CreatedAt:   benefit.CreatedAt,
		UpdatedAt:   benefit.UpdatedAt,
	}
}

// ToBenefitListResponse converts a list of benefits to a list response DTO
func ToBenefitListResponse(benefits []*domain.CompanyBenefit) BenefitListResponse {
	responses := make([]BenefitResponse, len(benefits))
	for i, benefit := range benefits {
		responses[i] = ToBenefitResponse(benefit)
	}

	return BenefitListResponse{
		Benefits: responses,
		Total:    len(responses),
	}
}

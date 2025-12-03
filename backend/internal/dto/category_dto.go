package dto

import (
	"job-platform/internal/domain"
)

// ============================================================
// REQUEST DTOs
// ============================================================

// CreateCategoryRequest represents a request to create a category
type CreateCategoryRequest struct {
	Name        string  `json:"name" binding:"required,min=2,max=100"`
	Description string  `json:"description"`
	Icon        string  `json:"icon"`
	ParentID    *string `json:"parent_id"`
	SortOrder   int     `json:"sort_order"`
}

// UpdateCategoryRequest represents a request to update a category
type UpdateCategoryRequest struct {
	Name        *string `json:"name" binding:"omitempty,min=2,max=100"`
	Description *string `json:"description"`
	Icon        *string `json:"icon"`
	ParentID    *string `json:"parent_id"`
	SortOrder   *int    `json:"sort_order"`
	IsActive    *bool   `json:"is_active"`
}

// ============================================================
// RESPONSE DTOs
// ============================================================

// CategoryTreeResponse represents a category with its subcategories
type CategoryTreeResponse struct {
	ID            string                 `json:"id"`
	Name          string                 `json:"name"`
	Slug          string                 `json:"slug"`
	Description   string                 `json:"description,omitempty"`
	Icon          string                 `json:"icon,omitempty"`
	SortOrder     int                    `json:"sort_order"`
	IsActive      bool                   `json:"is_active"`
	JobCount      int64                  `json:"job_count,omitempty"`
	Subcategories []CategoryTreeResponse `json:"subcategories,omitempty"`
}

// CategoryListResponse represents a list of categories
type CategoryListResponse struct {
	Categories []CategoryResponse `json:"categories"`
}

// CategoryTreeListResponse represents a tree of categories
type CategoryTreeListResponse struct {
	Categories []CategoryTreeResponse `json:"categories"`
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

// ToCategoryTreeResponse converts a domain.JobCategory to CategoryTreeResponse
func ToCategoryTreeResponse(category *domain.JobCategory) CategoryTreeResponse {
	response := CategoryTreeResponse{
		ID:          category.ID.String(),
		Name:        category.Name,
		Slug:        category.Slug,
		Description: category.Description,
		Icon:        category.Icon,
		SortOrder:   category.SortOrder,
		IsActive:    category.IsActive,
	}

	// Add subcategories if available
	if len(category.Subcategories) > 0 {
		subs := make([]CategoryTreeResponse, len(category.Subcategories))
		for i, sub := range category.Subcategories {
			subs[i] = ToCategoryTreeResponse(&sub)
		}
		response.Subcategories = subs
	}

	return response
}

// ToCategoryListResponse converts a list of categories to CategoryListResponse
func ToCategoryListResponse(categories []domain.JobCategory) CategoryListResponse {
	responses := make([]CategoryResponse, len(categories))
	for i, cat := range categories {
		responses[i] = ToCategoryResponse(&cat)
	}

	return CategoryListResponse{
		Categories: responses,
	}
}

// ToCategoryTreeListResponse converts a list of categories to CategoryTreeListResponse
func ToCategoryTreeListResponse(categories []domain.JobCategory) CategoryTreeListResponse {
	responses := make([]CategoryTreeResponse, len(categories))
	for i, cat := range categories {
		responses[i] = ToCategoryTreeResponse(&cat)
	}

	return CategoryTreeListResponse{
		Categories: responses,
	}
}

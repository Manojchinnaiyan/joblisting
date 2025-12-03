package dto

import (
	"job-platform/internal/domain"
	"time"

	"github.com/google/uuid"
)

// ============================================
// REVIEW REQUEST DTOs
// ============================================

// CreateReviewRequest represents the request to create a review
type CreateReviewRequest struct {
	OverallRating       int     `json:"overall_rating" binding:"required,min=1,max=5"`
	CultureRating       *int    `json:"culture_rating" binding:"omitempty,min=1,max=5"`
	WorkLifeRating      *int    `json:"work_life_rating" binding:"omitempty,min=1,max=5"`
	CompensationRating  *int    `json:"compensation_rating" binding:"omitempty,min=1,max=5"`
	ManagementRating    *int    `json:"management_rating" binding:"omitempty,min=1,max=5"`
	Title               string  `json:"title" binding:"required,max=255"`
	Pros                string  `json:"pros" binding:"required"`
	Cons                string  `json:"cons" binding:"required"`
	AdviceToManagement  *string `json:"advice_to_management" binding:"omitempty"`
	JobTitle            *string `json:"job_title" binding:"omitempty,max=255"`
	EmploymentStatus    *string `json:"employment_status" binding:"omitempty,max=50"`
	YearsAtCompany      *int    `json:"years_at_company" binding:"omitempty,min=0"`
	IsAnonymous         bool    `json:"is_anonymous"`
	IsCurrentEmployee   bool    `json:"is_current_employee"`
}

// UpdateReviewRequest represents the request to update a review
type UpdateReviewRequest struct {
	OverallRating       int     `json:"overall_rating" binding:"required,min=1,max=5"`
	CultureRating       *int    `json:"culture_rating" binding:"omitempty,min=1,max=5"`
	WorkLifeRating      *int    `json:"work_life_rating" binding:"omitempty,min=1,max=5"`
	CompensationRating  *int    `json:"compensation_rating" binding:"omitempty,min=1,max=5"`
	ManagementRating    *int    `json:"management_rating" binding:"omitempty,min=1,max=5"`
	Title               string  `json:"title" binding:"required,max=255"`
	Pros                string  `json:"pros" binding:"required"`
	Cons                string  `json:"cons" binding:"required"`
	AdviceToManagement  *string `json:"advice_to_management" binding:"omitempty"`
	JobTitle            *string `json:"job_title" binding:"omitempty,max=255"`
	EmploymentStatus    *string `json:"employment_status" binding:"omitempty,max=50"`
	YearsAtCompany      *int    `json:"years_at_company" binding:"omitempty,min=0"`
	IsAnonymous         bool    `json:"is_anonymous"`
	IsCurrentEmployee   bool    `json:"is_current_employee"`
}

// RejectReviewRequest represents the request to reject a review
type RejectReviewRequest struct {
	Reason string `json:"reason" binding:"required"`
}

// AddCompanyResponseRequest represents the request to add a company response
type AddCompanyResponseRequest struct {
	Response string `json:"response" binding:"required"`
}

// GetReviewsRequest represents the request to get reviews
type GetReviewsRequest struct {
	Page   int     `form:"page" binding:"omitempty,min=1"`
	Limit  int     `form:"limit" binding:"omitempty,min=1,max=100"`
	Status *string `form:"status" binding:"omitempty"`
	Rating *int    `form:"rating" binding:"omitempty,min=1,max=5"`
}

// ============================================
// REVIEW RESPONSE DTOs
// ============================================

// ReviewResponse represents a review response
type ReviewResponse struct {
	ID                   uuid.UUID            `json:"id"`
	CompanyID            uuid.UUID            `json:"company_id"`
	UserID               uuid.UUID            `json:"user_id"`
	User                 *UserBriefResponse   `json:"user,omitempty"`
	OverallRating        int                  `json:"overall_rating"`
	CultureRating        *int                 `json:"culture_rating"`
	WorkLifeRating       *int                 `json:"work_life_rating"`
	CompensationRating   *int                 `json:"compensation_rating"`
	ManagementRating     *int                 `json:"management_rating"`
	Title                string               `json:"title"`
	Pros                 string               `json:"pros"`
	Cons                 string               `json:"cons"`
	AdviceToManagement   *string              `json:"advice_to_management"`
	JobTitle             *string              `json:"job_title"`
	EmploymentStatus     *string              `json:"employment_status"`
	YearsAtCompany       *int                 `json:"years_at_company"`
	IsAnonymous          bool                 `json:"is_anonymous"`
	IsCurrentEmployee    bool                 `json:"is_current_employee"`
	Status               domain.ReviewStatus  `json:"status"`
	CompanyResponse      *string              `json:"company_response"`
	CompanyResponseAt    *time.Time           `json:"company_response_at"`
	HelpfulCount         int                  `json:"helpful_count"`
	CreatedAt            time.Time            `json:"created_at"`
	UpdatedAt            time.Time            `json:"updated_at"`
}

// ReviewListResponse represents the list of reviews with pagination
type ReviewListResponse struct {
	Reviews    []ReviewResponse `json:"reviews"`
	Total      int64            `json:"total"`
	Page       int              `json:"page"`
	Limit      int              `json:"limit"`
	TotalPages int              `json:"total_pages"`
}

// RatingBreakdownResponse represents the rating distribution
type RatingBreakdownResponse struct {
	Rating int   `json:"rating"`
	Count  int64 `json:"count"`
}

// ReviewAnalyticsResponse represents review analytics
type ReviewAnalyticsResponse struct {
	TotalReviews     int64                     `json:"total_reviews"`
	AverageRating    float32                   `json:"average_rating"`
	RatingBreakdown  []RatingBreakdownResponse `json:"rating_breakdown"`
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// ToReviewResponse converts a review domain model to a response DTO
func ToReviewResponse(review *domain.CompanyReview) ReviewResponse {
	response := ReviewResponse{
		ID:                 review.ID,
		CompanyID:          review.CompanyID,
		UserID:             review.UserID,
		OverallRating:      review.OverallRating,
		CultureRating:      review.CultureRating,
		WorkLifeRating:     review.WorkLifeRating,
		CompensationRating: review.CompensationRating,
		ManagementRating:   review.ManagementRating,
		Title:              review.Title,
		Pros:               review.Pros,
		Cons:               review.Cons,
		AdviceToManagement: review.AdviceToManagement,
		JobTitle:           review.JobTitle,
		EmploymentStatus:   review.EmploymentStatus,
		YearsAtCompany:     review.YearsAtCompany,
		IsAnonymous:        review.IsAnonymous,
		IsCurrentEmployee:  review.IsCurrentEmployee,
		Status:             review.Status,
		CompanyResponse:    review.CompanyResponse,
		CompanyResponseAt:  review.CompanyResponseAt,
		HelpfulCount:       review.HelpfulCount,
		CreatedAt:          review.CreatedAt,
		UpdatedAt:          review.UpdatedAt,
	}

	// Add user info if not anonymous and preloaded
	if !review.IsAnonymous && review.User != nil {
		var avatarURL *string
		if review.User.Profile != nil {
			avatarURL = review.User.Profile.AvatarURL
		}
		response.User = &UserBriefResponse{
			ID:        review.User.ID,
			FirstName: review.User.FirstName,
			LastName:  review.User.LastName,
			Email:     review.User.Email,
			AvatarURL: avatarURL,
		}
	}

	return response
}

// ToReviewListResponse converts a list of reviews to a list response DTO
func ToReviewListResponse(reviews []*domain.CompanyReview, total int64, page, limit int) ReviewListResponse {
	responses := make([]ReviewResponse, len(reviews))
	for i, review := range reviews {
		responses[i] = ToReviewResponse(review)
	}

	totalPages := int(total) / limit
	if int(total)%limit != 0 {
		totalPages++
	}

	return ReviewListResponse{
		Reviews:    responses,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}
}

// ToRatingBreakdownResponse converts rating breakdown to response DTO
func ToRatingBreakdownResponse(breakdown map[int]int64) []RatingBreakdownResponse {
	responses := make([]RatingBreakdownResponse, 0, len(breakdown))
	for rating := 1; rating <= 5; rating++ {
		responses = append(responses, RatingBreakdownResponse{
			Rating: rating,
			Count:  breakdown[rating],
		})
	}
	return responses
}

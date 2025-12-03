package dto

import (
	"job-platform/internal/domain"
	"time"

	"github.com/google/uuid"
)

// ============================================
// COMPANY REQUEST DTOs
// ============================================

// CreateCompanyRequest represents the request to create a company
type CreateCompanyRequest struct {
	Name               string                `json:"name" binding:"required,min=2,max=255"`
	Tagline            *string               `json:"tagline" binding:"omitempty,max=255"`
	Description        *string               `json:"description" binding:"omitempty"`
	Industry           string                `json:"industry" binding:"required,max=100"`
	SubIndustry        *string               `json:"sub_industry" binding:"omitempty,max=100"`
	CompanySize        domain.CompanySize    `json:"company_size" binding:"required"`
	FoundedYear        *int                  `json:"founded_year" binding:"omitempty,min=1800,max=2100"`
	CompanyType        *string               `json:"company_type" binding:"omitempty,max=50"`
	Website            *string               `json:"website" binding:"omitempty,url"`
	Email              *string               `json:"email" binding:"omitempty,email"`
	Phone              *string               `json:"phone" binding:"omitempty,max=20"`
	LinkedInURL        *string               `json:"linkedin_url" binding:"omitempty,url"`
	TwitterURL         *string               `json:"twitter_url" binding:"omitempty,url"`
	FacebookURL        *string               `json:"facebook_url" binding:"omitempty,url"`
	InstagramURL       *string               `json:"instagram_url" binding:"omitempty,url"`
	Mission            *string               `json:"mission" binding:"omitempty"`
	Vision             *string               `json:"vision" binding:"omitempty"`
	CultureDescription *string               `json:"culture_description" binding:"omitempty"`
}

// UpdateCompanyRequest represents the request to update a company
type UpdateCompanyRequest struct {
	Name               *string               `json:"name" binding:"omitempty,min=2,max=255"`
	Tagline            *string               `json:"tagline" binding:"omitempty,max=255"`
	Description        *string               `json:"description" binding:"omitempty"`
	Industry           *string               `json:"industry" binding:"omitempty,max=100"`
	SubIndustry        *string               `json:"sub_industry" binding:"omitempty,max=100"`
	CompanySize        *domain.CompanySize   `json:"company_size" binding:"omitempty"`
	FoundedYear        *int                  `json:"founded_year" binding:"omitempty,min=1800,max=2100"`
	CompanyType        *string               `json:"company_type" binding:"omitempty,max=50"`
	Website            *string               `json:"website" binding:"omitempty,url"`
	Email              *string               `json:"email" binding:"omitempty,email"`
	Phone              *string               `json:"phone" binding:"omitempty,max=20"`
	LinkedInURL        *string               `json:"linkedin_url" binding:"omitempty,url"`
	TwitterURL         *string               `json:"twitter_url" binding:"omitempty,url"`
	FacebookURL        *string               `json:"facebook_url" binding:"omitempty,url"`
	InstagramURL       *string               `json:"instagram_url" binding:"omitempty,url"`
	Mission            *string               `json:"mission" binding:"omitempty"`
	Vision             *string               `json:"vision" binding:"omitempty"`
	CultureDescription *string               `json:"culture_description" binding:"omitempty"`
	BrandColor         *string               `json:"brand_color" binding:"omitempty,len=7"`
}

// ListCompaniesRequest represents the request to list companies
type ListCompaniesRequest struct {
	Page        int                   `form:"page" binding:"omitempty,min=1"`
	Limit       int                   `form:"limit" binding:"omitempty,min=1,max=100"`
	Status      *string               `form:"status" binding:"omitempty"`
	Industry    *string               `form:"industry" binding:"omitempty"`
	CompanySize *string               `form:"company_size" binding:"omitempty"`
	IsVerified  *bool                 `form:"is_verified" binding:"omitempty"`
	IsFeatured  *bool                 `form:"is_featured" binding:"omitempty"`
	City        *string               `form:"city" binding:"omitempty"`
	Country     *string               `form:"country" binding:"omitempty"`
	Search      *string               `form:"search" binding:"omitempty"`
}

// RejectCompanyRequest represents the request to reject a company
type RejectCompanyRequest struct {
	Reason string `json:"reason" binding:"required"`
}

// FeatureCompanyRequest represents the request to feature a company
type FeatureCompanyRequest struct {
	FeaturedUntil *time.Time `json:"featured_until" binding:"omitempty"`
}

// ============================================
// COMPANY RESPONSE DTOs
// ============================================

// CompanyResponse represents the company response
type CompanyResponse struct {
	ID                 uuid.UUID             `json:"id"`
	Name               string                `json:"name"`
	Slug               string                `json:"slug"`
	Tagline            *string               `json:"tagline"`
	Description        *string               `json:"description"`
	Industry           string                `json:"industry"`
	SubIndustry        *string               `json:"sub_industry"`
	CompanySize        domain.CompanySize    `json:"company_size"`
	FoundedYear        *int                  `json:"founded_year"`
	CompanyType        *string               `json:"company_type"`
	LogoURL            *string               `json:"logo_url"`
	CoverImageURL      *string               `json:"cover_image_url"`
	BrandColor         *string               `json:"brand_color"`
	Website            *string               `json:"website"`
	Email              *string               `json:"email"`
	Phone              *string               `json:"phone"`
	LinkedInURL        *string               `json:"linkedin_url"`
	TwitterURL         *string               `json:"twitter_url"`
	FacebookURL        *string               `json:"facebook_url"`
	InstagramURL       *string               `json:"instagram_url"`
	Mission            *string               `json:"mission"`
	Vision             *string               `json:"vision"`
	CultureDescription *string               `json:"culture_description"`
	Status             domain.CompanyStatus  `json:"status"`
	IsVerified         bool                  `json:"is_verified"`
	VerifiedAt         *time.Time            `json:"verified_at"`
	IsFeatured         bool                  `json:"is_featured"`
	FeaturedUntil      *time.Time            `json:"featured_until"`
	TotalJobs          int                   `json:"total_jobs"`
	ActiveJobs         int                   `json:"active_jobs"`
	TotalEmployees     *int                  `json:"total_employees"`
	FollowersCount     int                   `json:"followers_count"`
	ReviewsCount       int                   `json:"reviews_count"`
	AverageRating      float32               `json:"average_rating"`
	CreatedAt          time.Time             `json:"created_at"`
	UpdatedAt          time.Time             `json:"updated_at"`
}

// CompanyDetailResponse represents detailed company information
type CompanyDetailResponse struct {
	CompanyResponse
	Locations      []LocationResponse      `json:"locations"`
	Benefits       []BenefitResponse       `json:"benefits"`
	Media          []MediaResponse         `json:"media"`
	TeamMembersCount int                   `json:"team_members_count"`
	IsFollowing    bool                    `json:"is_following"`
}

// CompanyListResponse represents the list of companies with pagination
type CompanyListResponse struct {
	Companies []CompanyResponse `json:"companies"`
	Total     int64             `json:"total"`
	Page      int               `json:"page"`
	Limit     int               `json:"limit"`
	TotalPages int              `json:"total_pages"`
}

// CompanyStatsResponse represents company statistics
type CompanyStatsResponse struct {
	TotalJobs      int     `json:"total_jobs"`
	ActiveJobs     int     `json:"active_jobs"`
	TeamMembers    int64   `json:"team_members"`
	Locations      int64   `json:"locations"`
	Followers      int64   `json:"followers"`
	Reviews        int64   `json:"reviews"`
	AverageRating  float32 `json:"average_rating"`
	TotalEmployees int     `json:"total_employees"`
	IsVerified     bool    `json:"is_verified"`
	IsFeatured     bool    `json:"is_featured"`
	Status         string  `json:"status"`
}

// IndustryResponse represents an industry
type IndustryResponse struct {
	Name string `json:"name"`
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// ToCompanyResponse converts a company domain model to a response DTO
func ToCompanyResponse(company *domain.Company) CompanyResponse {
	return CompanyResponse{
		ID:                 company.ID,
		Name:               company.Name,
		Slug:               company.Slug,
		Tagline:            company.Tagline,
		Description:        company.Description,
		Industry:           company.Industry,
		SubIndustry:        company.SubIndustry,
		CompanySize:        company.CompanySize,
		FoundedYear:        company.FoundedYear,
		CompanyType:        company.CompanyType,
		LogoURL:            company.LogoURL,
		CoverImageURL:      company.CoverImageURL,
		BrandColor:         company.BrandColor,
		Website:            company.Website,
		Email:              company.Email,
		Phone:              company.Phone,
		LinkedInURL:        company.LinkedInURL,
		TwitterURL:         company.TwitterURL,
		FacebookURL:        company.FacebookURL,
		InstagramURL:       company.InstagramURL,
		Mission:            company.Mission,
		Vision:             company.Vision,
		CultureDescription: company.CultureDescription,
		Status:             company.Status,
		IsVerified:         company.IsVerified,
		VerifiedAt:         company.VerifiedAt,
		IsFeatured:         company.IsFeatured,
		FeaturedUntil:      company.FeaturedUntil,
		TotalJobs:          company.TotalJobs,
		ActiveJobs:         company.ActiveJobs,
		TotalEmployees:     &company.TotalEmployees,
		FollowersCount:     company.FollowersCount,
		ReviewsCount:       company.ReviewsCount,
		AverageRating:      company.AverageRating,
		CreatedAt:          company.CreatedAt,
		UpdatedAt:          company.UpdatedAt,
	}
}

// ToCompanyListResponse converts a list of companies to a list response DTO
func ToCompanyListResponse(companies []*domain.Company, total int64, page, limit int) CompanyListResponse {
	responses := make([]CompanyResponse, len(companies))
	for i, company := range companies {
		responses[i] = ToCompanyResponse(company)
	}

	totalPages := int(total) / limit
	if int(total)%limit != 0 {
		totalPages++
	}

	return CompanyListResponse{
		Companies:  responses,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}
}

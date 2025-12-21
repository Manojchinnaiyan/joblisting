package dto

import (
	"job-platform/internal/domain"
	"time"

	"github.com/google/uuid"
)

// ============================================================
// REQUEST DTOs
// ============================================================

// CreateJobRequest represents a request to create a job
type CreateJobRequest struct {
	Title              string   `json:"title" binding:"required,min=5,max=255"`
	Description        string   `json:"description" binding:"required,min=100"`
	ShortDescription   string   `json:"short_description" binding:"max=500"`
	JobType            string   `json:"job_type" binding:"required,oneof=FULL_TIME PART_TIME CONTRACT FREELANCE INTERNSHIP"`
	ExperienceLevel    string   `json:"experience_level" binding:"required,oneof=ENTRY MID SENIOR LEAD EXECUTIVE"`
	WorkplaceType      string   `json:"workplace_type" binding:"required,oneof=ONSITE REMOTE HYBRID"`
	Location           string   `json:"location" binding:"required"`
	City               string   `json:"city"`
	State              string   `json:"state"`
	Country            string   `json:"country"`
	Latitude           *float64 `json:"latitude"`
	Longitude          *float64 `json:"longitude"`
	SalaryMin          *int     `json:"salary_min"`
	SalaryMax          *int     `json:"salary_max"`
	SalaryCurrency     string   `json:"salary_currency"`
	SalaryPeriod       string   `json:"salary_period"`
	HideSalary         bool     `json:"hide_salary"`
	Skills             []string `json:"skills"`
	Education          string   `json:"education"`
	YearsExperienceMin int      `json:"years_experience_min"`
	YearsExperienceMax *int     `json:"years_experience_max"`
	Benefits           []string `json:"benefits"`
	CategoryIDs        []string `json:"category_ids"`
	ApplicationURL     string   `json:"application_url"`
	ApplicationEmail   string   `json:"application_email" binding:"omitempty,email"`
}

// AdminCreateJobRequest represents a request for admin to create a job
type AdminCreateJobRequest struct {
	Title              string   `json:"title" binding:"required,min=5,max=255"`
	Description        string   `json:"description" binding:"required,min=100"`
	ShortDescription   string   `json:"short_description" binding:"max=500"`
	JobType            string   `json:"job_type" binding:"required,oneof=FULL_TIME PART_TIME CONTRACT FREELANCE INTERNSHIP"`
	ExperienceLevel    string   `json:"experience_level" binding:"required,oneof=ENTRY MID SENIOR LEAD EXECUTIVE"`
	WorkplaceType      string   `json:"workplace_type" binding:"required,oneof=ONSITE REMOTE HYBRID"`
	Location           string   `json:"location" binding:"required"`
	City               string   `json:"city"`
	State              string   `json:"state"`
	Country            string   `json:"country"`
	Latitude           *float64 `json:"latitude"`
	Longitude          *float64 `json:"longitude"`
	SalaryMin          *int     `json:"salary_min"`
	SalaryMax          *int     `json:"salary_max"`
	SalaryCurrency     string   `json:"salary_currency"`
	SalaryPeriod       string   `json:"salary_period"`
	HideSalary         bool     `json:"hide_salary"`
	Skills             []string `json:"skills"`
	Education          string   `json:"education"`
	YearsExperienceMin int      `json:"years_experience_min"`
	YearsExperienceMax *int     `json:"years_experience_max"`
	Benefits           []string `json:"benefits"`
	CategoryIDs        []string `json:"category_ids"`
	ApplicationURL     string   `json:"application_url"`
	ApplicationEmail   string   `json:"application_email" binding:"omitempty,email"`
	// Admin-specific fields
	CompanyName    string `json:"company_name" binding:"required,min=2,max=255"`
	CompanyLogoURL string `json:"company_logo_url"`
	Status         string `json:"status" binding:"omitempty,oneof=ACTIVE DRAFT PENDING_APPROVAL"`
}

// UpdateJobRequest represents a request to update a job
type UpdateJobRequest struct {
	Title              *string   `json:"title" binding:"omitempty,min=5,max=255"`
	Description        *string   `json:"description" binding:"omitempty,min=100"`
	ShortDescription   *string   `json:"short_description" binding:"omitempty,max=500"`
	JobType            *string   `json:"job_type" binding:"omitempty,oneof=FULL_TIME PART_TIME CONTRACT FREELANCE INTERNSHIP"`
	ExperienceLevel    *string   `json:"experience_level" binding:"omitempty,oneof=ENTRY MID SENIOR LEAD EXECUTIVE"`
	WorkplaceType      *string   `json:"workplace_type" binding:"omitempty,oneof=ONSITE REMOTE HYBRID"`
	Location           *string   `json:"location"`
	City               *string   `json:"city"`
	State              *string   `json:"state"`
	Country            *string   `json:"country"`
	Latitude           *float64  `json:"latitude"`
	Longitude          *float64  `json:"longitude"`
	SalaryMin          *int      `json:"salary_min"`
	SalaryMax          *int      `json:"salary_max"`
	SalaryCurrency     *string   `json:"salary_currency"`
	SalaryPeriod       *string   `json:"salary_period"`
	HideSalary         *bool     `json:"hide_salary"`
	Skills             *[]string `json:"skills"`
	Education          *string   `json:"education"`
	YearsExperienceMin *int      `json:"years_experience_min"`
	YearsExperienceMax *int      `json:"years_experience_max"`
	Benefits           *[]string `json:"benefits"`
	CategoryIDs        *[]string `json:"category_ids"`
	ApplicationURL     *string   `json:"application_url"`
	ApplicationEmail   *string   `json:"application_email" binding:"omitempty,email"`
}

// AdminUpdateJobRequest represents a request for admin to update a job
type AdminUpdateJobRequest struct {
	Title              *string   `json:"title" binding:"omitempty,min=5,max=255"`
	Description        *string   `json:"description" binding:"omitempty,min=100"`
	ShortDescription   *string   `json:"short_description" binding:"omitempty,max=500"`
	JobType            *string   `json:"job_type" binding:"omitempty,oneof=FULL_TIME PART_TIME CONTRACT FREELANCE INTERNSHIP"`
	ExperienceLevel    *string   `json:"experience_level" binding:"omitempty,oneof=ENTRY MID SENIOR LEAD EXECUTIVE"`
	WorkplaceType      *string   `json:"workplace_type" binding:"omitempty,oneof=ONSITE REMOTE HYBRID"`
	Location           *string   `json:"location"`
	City               *string   `json:"city"`
	State              *string   `json:"state"`
	Country            *string   `json:"country"`
	Latitude           *float64  `json:"latitude"`
	Longitude          *float64  `json:"longitude"`
	SalaryMin          *int      `json:"salary_min"`
	SalaryMax          *int      `json:"salary_max"`
	SalaryCurrency     *string   `json:"salary_currency"`
	SalaryPeriod       *string   `json:"salary_period"`
	HideSalary         *bool     `json:"hide_salary"`
	Skills             *[]string `json:"skills"`
	Education          *string   `json:"education"`
	YearsExperienceMin *int      `json:"years_experience_min"`
	YearsExperienceMax *int      `json:"years_experience_max"`
	Benefits           *[]string `json:"benefits"`
	CategoryIDs        *[]string `json:"category_ids"`
	ApplicationURL     *string   `json:"application_url"`
	ApplicationEmail   *string   `json:"application_email" binding:"omitempty,email"`
	// Admin-specific fields
	CompanyName    *string `json:"company_name" binding:"omitempty,min=2,max=255"`
	CompanyLogoURL *string `json:"company_logo_url"`
	Status         *string `json:"status" binding:"omitempty,oneof=ACTIVE DRAFT PENDING_APPROVAL EXPIRED CLOSED REJECTED"`
}

// RenewJobRequest represents a request to renew a job
type RenewJobRequest struct {
	Days int `json:"days" binding:"omitempty,min=1,max=90"`
}

// FeatureJobRequest represents a request to feature a job
type FeatureJobRequest struct {
	UntilDate string `json:"until_date" binding:"required"`
}

// RejectJobRequest represents a request to reject a job
type RejectJobRequest struct {
	Reason string `json:"reason" binding:"required,min=10"`
}

// ============================================================
// SCRAPER DTOs
// ============================================================

// ScrapeJobRequest represents a request to scrape a job from URL
type ScrapeJobRequest struct {
	URL string `json:"url" binding:"required,url"`
}

// BulkScrapeRequest represents a request to scrape multiple jobs
type BulkScrapeRequest struct {
	URLs []string `json:"urls" binding:"required,min=1,max=10"`
}

// ScrapedJobResponse represents extracted job data from a URL
type ScrapedJobResponse struct {
	Title           string   `json:"title"`
	Company         string   `json:"company"`
	CompanyLogo     string   `json:"company_logo,omitempty"`
	Location        string   `json:"location"`
	Description     string   `json:"description"`
	Requirements    string   `json:"requirements"`
	Salary          string   `json:"salary"`
	JobType         string   `json:"job_type"`
	ExperienceLevel string   `json:"experience_level"`
	Skills          []string `json:"skills"`
	OriginalURL     string   `json:"original_url"`
	City            string   `json:"city,omitempty"`
	State           string   `json:"state,omitempty"`
	Country         string   `json:"country,omitempty"`
	Benefits        []string `json:"benefits,omitempty"`
}

// CreateFromScrapedRequest represents a request to create job from scraped data
type CreateFromScrapedRequest struct {
	ScrapedData ScrapedJobResponse     `json:"scraped_data" binding:"required"`
	Edits       map[string]interface{} `json:"edits"`
}

// ScrapePreviewResponse represents the response for a scrape preview
type ScrapePreviewResponse struct {
	Success    bool               `json:"success"`
	ScrapedJob ScrapedJobResponse `json:"scraped_job"`
	Warnings   []string           `json:"warnings,omitempty"`
}

// BulkScrapeResponse represents the response for bulk scraping
type BulkScrapeResponse struct {
	Results []BulkScrapeResult `json:"results"`
	Total   int                `json:"total"`
	Success int                `json:"success"`
	Failed  int                `json:"failed"`
}

// BulkScrapeResult represents a single result in bulk scraping
type BulkScrapeResult struct {
	URL        string              `json:"url"`
	Success    bool                `json:"success"`
	ScrapedJob *ScrapedJobResponse `json:"scraped_job,omitempty"`
	Error      string              `json:"error,omitempty"`
}

// ExtractLinksRequest represents a request to extract job links from a listing page
type ExtractLinksRequest struct {
	URL string `json:"url" binding:"required,url"`
}

// ExtractedJobLink represents a single extracted job link
type ExtractedJobLink struct {
	URL   string `json:"url"`
	Title string `json:"title,omitempty"`
}

// ExtractLinksResponse represents the response for extracting job links
type ExtractLinksResponse struct {
	Success   bool               `json:"success"`
	SourceURL string             `json:"source_url"`
	Links     []ExtractedJobLink `json:"links"`
	Total     int                `json:"total"`
	Message   string             `json:"message,omitempty"`
}

// SearchJobsRequest represents a search jobs request
type SearchJobsRequest struct {
	Query          string   `json:"query"`
	Location       string   `json:"location"`
	JobTypes       []string `json:"job_types"`
	ExperienceLevels []string `json:"experience_levels"`
	WorkplaceTypes []string `json:"workplace_types"`
	SalaryMin      *int     `json:"salary_min"`
	SalaryMax      *int     `json:"salary_max"`
	CategoryIDs    []string `json:"category_ids"`
	Skills         []string `json:"skills"`
	Remote         *bool    `json:"remote"`
	Featured       *bool    `json:"featured"`
	SortBy         string   `json:"sort_by"` // relevance, date, salary
	Page           int      `json:"page"`
	Limit          int      `json:"limit"`
}

// ============================================================
// RESPONSE DTOs
// ============================================================

// SalaryResponse represents salary information
type SalaryResponse struct {
	Min      *int   `json:"min,omitempty"`
	Max      *int   `json:"max,omitempty"`
	Currency string `json:"currency"`
	Period   string `json:"period"`
	Hidden   bool   `json:"hidden"`
}

// CategoryResponse represents a job category
type CategoryResponse struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Slug        string  `json:"slug"`
	Description string  `json:"description,omitempty"`
	Icon        string  `json:"icon,omitempty"`
	ParentID    *string `json:"parent_id,omitempty"`
}

// EmployerResponse represents employer information
type EmployerResponse struct {
	ID             string  `json:"id"`
	CompanyName    string  `json:"company_name"`
	CompanyLogoURL *string `json:"company_logo_url,omitempty"`
}

// JobResponse represents a job in API responses
type JobResponse struct {
	ID               string             `json:"id"`
	Title            string             `json:"title"`
	Slug             string             `json:"slug"`
	Description      string             `json:"description"`
	ShortDescription string             `json:"short_description,omitempty"`
	CompanyName      string             `json:"company_name"`
	CompanyLogoURL   string             `json:"company_logo_url,omitempty"`
	JobType          string             `json:"job_type"`
	ExperienceLevel  string             `json:"experience_level"`
	WorkplaceType    string             `json:"workplace_type"`
	Location         string             `json:"location"`
	City             string             `json:"city,omitempty"`
	State            string             `json:"state,omitempty"`
	Country          string             `json:"country,omitempty"`
	Salary           *SalaryResponse    `json:"salary,omitempty"`
	Skills           []string           `json:"skills,omitempty"`
	Benefits         []string           `json:"benefits,omitempty"`
	Education        string             `json:"education,omitempty"`
	YearsExpMin      int                `json:"years_experience_min"`
	YearsExpMax      *int               `json:"years_experience_max,omitempty"`
	Categories       []CategoryResponse `json:"categories,omitempty"`
	Status           string             `json:"status"`
	IsFeatured       bool               `json:"is_featured"`
	ViewsCount       int                `json:"views_count"`
	ApplicationsCount int               `json:"applications_count"`
	ApplicationURL   string             `json:"application_url,omitempty"`
	ApplicationEmail string             `json:"application_email,omitempty"`
	OriginalURL      *string            `json:"original_url,omitempty"`
	ScrapeStatus     string             `json:"scrape_status,omitempty"`
	PublishedAt      *time.Time         `json:"published_at,omitempty"`
	ExpiresAt        *time.Time         `json:"expires_at,omitempty"`
	CreatedAt        time.Time          `json:"created_at"`
	UpdatedAt        time.Time          `json:"updated_at"`

	// For authenticated users
	IsSaved    *bool `json:"is_saved,omitempty"`
	HasApplied *bool `json:"has_applied,omitempty"`

	// For employers/admin
	Employer *EmployerResponse `json:"employer,omitempty"`
}

// JobListResponse represents a paginated list of jobs
type JobListResponse struct {
	Jobs       []JobResponse      `json:"jobs"`
	Pagination PaginationResponse `json:"pagination"`
	Facets     *FacetsResponse    `json:"facets,omitempty"`
}

// PaginationResponse represents pagination metadata
type PaginationResponse struct {
	Page       int   `json:"page"`
	Limit      int   `json:"limit"`
	Total      int64 `json:"total"`
	TotalPages int   `json:"total_pages"`
	HasNext    bool  `json:"has_next"`
	HasPrev    bool  `json:"has_prev"`
}

// FacetsResponse represents search facets
type FacetsResponse struct {
	JobTypes         map[string]int64 `json:"job_types,omitempty"`
	ExperienceLevels map[string]int64 `json:"experience_levels,omitempty"`
	WorkplaceTypes   map[string]int64 `json:"workplace_types,omitempty"`
	Locations        map[string]int64 `json:"locations,omitempty"`
	Categories       map[string]int64 `json:"categories,omitempty"`
}

// JobAnalyticsResponse represents job analytics
type JobAnalyticsResponse struct {
	JobID              string                 `json:"job_id"`
	TotalViews         int64                  `json:"total_views"`
	UniqueViews        int64                  `json:"unique_views"`
	TotalApplications  int64                  `json:"total_applications"`
	ApplicationsByStatus map[string]int64     `json:"applications_by_status"`
	ViewsByDate        map[string]int64       `json:"views_by_date,omitempty"`
	ViewsByReferrer    map[string]int64       `json:"views_by_referrer,omitempty"`
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

// ToJobResponse converts a domain.Job to JobResponse
func ToJobResponse(job *domain.Job, userID *uuid.UUID) JobResponse {
	response := JobResponse{
		ID:                job.ID.String(),
		Title:             job.Title,
		Slug:              job.Slug,
		Description:       job.Description,
		ShortDescription:  job.ShortDescription,
		CompanyName:       job.CompanyName,
		CompanyLogoURL:    job.CompanyLogoURL,
		JobType:           string(job.JobType),
		ExperienceLevel:   string(job.ExperienceLevel),
		WorkplaceType:     string(job.WorkplaceType),
		Location:          job.Location,
		City:              job.City,
		State:             job.State,
		Country:           job.Country,
		Skills:            job.Skills,
		Benefits:          job.Benefits,
		Education:         job.Education,
		YearsExpMin:       job.YearsExperienceMin,
		YearsExpMax:       job.YearsExperienceMax,
		Status:            string(job.Status),
		IsFeatured:        job.IsFeatured,
		ViewsCount:        job.ViewsCount,
		ApplicationsCount: job.ApplicationsCount,
		ApplicationURL:    job.ApplicationURL,
		ApplicationEmail:  job.ApplicationEmail,
		OriginalURL:       job.OriginalURL,
		ScrapeStatus:      job.ScrapeStatus,
		PublishedAt:       job.PublishedAt,
		ExpiresAt:         job.ExpiresAt,
		CreatedAt:         job.CreatedAt,
		UpdatedAt:         job.UpdatedAt,
	}

	// Add salary if not hidden
	if !job.HideSalary && (job.SalaryMin != nil || job.SalaryMax != nil) {
		response.Salary = &SalaryResponse{
			Min:      job.SalaryMin,
			Max:      job.SalaryMax,
			Currency: job.SalaryCurrency,
			Period:   job.SalaryPeriod,
			Hidden:   job.HideSalary,
		}
	}

	// Add categories
	if len(job.Categories) > 0 {
		categories := make([]CategoryResponse, len(job.Categories))
		for i, cat := range job.Categories {
			categories[i] = ToCategoryResponse(&cat)
		}
		response.Categories = categories
	}

	// Add employer info if available
	if job.Employer.ID != uuid.Nil {
		companyName := job.CompanyName
		var logoURL *string
		if job.CompanyLogoURL != "" {
			logoURL = &job.CompanyLogoURL
		}

		response.Employer = &EmployerResponse{
			ID:             job.Employer.ID.String(),
			CompanyName:    companyName,
			CompanyLogoURL: logoURL,
		}
	}

	return response
}

// ToCategoryResponse converts a domain.JobCategory to CategoryResponse
func ToCategoryResponse(category *domain.JobCategory) CategoryResponse {
	response := CategoryResponse{
		ID:          category.ID.String(),
		Name:        category.Name,
		Slug:        category.Slug,
		Description: category.Description,
		Icon:        category.Icon,
	}

	if category.ParentID != nil {
		parentID := category.ParentID.String()
		response.ParentID = &parentID
	}

	return response
}

// ToJobListResponse converts a list of jobs to JobListResponse
func ToJobListResponse(jobs []domain.Job, total int64, page, limit int, userID *uuid.UUID) JobListResponse {
	jobResponses := make([]JobResponse, len(jobs))
	for i, job := range jobs {
		jobResponses[i] = ToJobResponse(&job, userID)
	}

	totalPages := int(total) / limit
	if int(total)%limit > 0 {
		totalPages++
	}

	return JobListResponse{
		Jobs: jobResponses,
		Pagination: PaginationResponse{
			Page:       page,
			Limit:      limit,
			Total:      total,
			TotalPages: totalPages,
			HasNext:    page < totalPages,
			HasPrev:    page > 1,
		},
	}
}

// NewPaginationResponse creates a pagination response
func NewPaginationResponse(page, limit int, total int64) PaginationResponse {
	totalPages := int(total) / limit
	if int(total)%limit > 0 {
		totalPages++
	}

	return PaginationResponse{
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: totalPages,
		HasNext:    page < totalPages,
		HasPrev:    page > 1,
	}
}

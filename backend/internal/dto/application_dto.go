package dto

import (
	"job-platform/internal/domain"
	"strings"
	"time"

	"github.com/google/uuid"
)

// ============================================================
// REQUEST DTOs
// ============================================================

// ApplyJobRequest represents a request to apply to a job
type ApplyJobRequest struct {
	ResumeURL      string                 `json:"resume_url" binding:"required,url"`
	CoverLetter    string                 `json:"cover_letter"`
	ExpectedSalary *int                   `json:"expected_salary"`
	AvailableFrom  string                 `json:"available_from"` // Date string: YYYY-MM-DD
	Answers        map[string]interface{} `json:"answers"`
}

// UpdateApplicationStatusRequest represents a request to update application status
type UpdateApplicationStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=SUBMITTED REVIEWED SHORTLISTED INTERVIEW OFFERED HIRED REJECTED"`
	Reason string `json:"reason"`
}

// AddApplicationNotesRequest represents a request to add employer notes
type AddApplicationNotesRequest struct {
	Notes string `json:"notes" binding:"required"`
}

// RateApplicantRequest represents a request to rate an applicant
type RateApplicantRequest struct {
	Rating int `json:"rating" binding:"required,min=1,max=5"`
}

// ============================================================
// RESPONSE DTOs
// ============================================================

// ApplicantResponse represents applicant information
type ApplicantResponse struct {
	ID        string  `json:"id"`
	FirstName string  `json:"first_name"`
	LastName  string  `json:"last_name"`
	Email     string  `json:"email"`
	Phone     *string `json:"phone,omitempty"`
	Location  *string `json:"location,omitempty"`
	Bio       *string `json:"bio,omitempty"`
}

// StatusHistoryResponse represents status change history
type StatusHistoryResponse struct {
	FromStatus *string    `json:"from_status"`
	ToStatus   string     `json:"to_status"`
	ChangedBy  *string    `json:"changed_by,omitempty"`
	Notes      string     `json:"notes,omitempty"`
	ChangedAt  time.Time  `json:"changed_at"`
}

// ApplicationResponse represents an application in API responses
type ApplicationResponse struct {
	ID             string                  `json:"id"`
	Job            *JobResponse            `json:"job,omitempty"`
	Applicant      *ApplicantResponse      `json:"applicant,omitempty"`
	ResumeURL      string                  `json:"resume_url"`
	CoverLetter    string                  `json:"cover_letter,omitempty"`
	ExpectedSalary *int                    `json:"expected_salary,omitempty"`
	AvailableFrom  *string                 `json:"available_from,omitempty"`
	Status         string                  `json:"status"`
	StatusUpdatedAt *time.Time             `json:"status_updated_at,omitempty"`
	EmployerNotes  string                  `json:"employer_notes,omitempty"`
	Rating         *int                    `json:"rating,omitempty"`
	StatusHistory  []StatusHistoryResponse `json:"status_history,omitempty"`
	AppliedAt      time.Time               `json:"applied_at"`
	CreatedAt      time.Time               `json:"created_at"`
	UpdatedAt      time.Time               `json:"updated_at"`
}

// ApplicationListResponse represents a paginated list of applications
type ApplicationListResponse struct {
	Applications []ApplicationResponse `json:"applications"`
	Pagination   PaginationResponse    `json:"pagination"`
}

// ApplicationStatsResponse represents application statistics
type ApplicationStatsResponse struct {
	Total        int64            `json:"total"`
	ByStatus     map[string]int64 `json:"by_status"`
	RecentCount  int64            `json:"recent_count"` // Last 7 days
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

// ToApplicationResponse converts a domain.Application to ApplicationResponse
func ToApplicationResponse(app *domain.Application, includeJob, includeApplicant bool) ApplicationResponse {
	response := ApplicationResponse{
		ID:              app.ID.String(),
		ResumeURL:       app.ResumeURL,
		CoverLetter:     app.CoverLetter,
		ExpectedSalary:  app.ExpectedSalary,
		Status:          string(app.Status),
		StatusUpdatedAt: app.StatusUpdatedAt,
		AppliedAt:       app.AppliedAt,
		CreatedAt:       app.CreatedAt,
		UpdatedAt:       app.UpdatedAt,
	}

	// Add available from date if set
	if app.AvailableFrom != nil {
		dateStr := app.AvailableFrom.Format("2006-01-02")
		response.AvailableFrom = &dateStr
	}

	// Add employer notes and rating (only for employer view)
	if app.EmployerNotes != "" {
		response.EmployerNotes = app.EmployerNotes
	}
	if app.Rating != nil {
		response.Rating = app.Rating
	}

	// Add job information if requested
	if includeJob && app.Job.ID != uuid.Nil {
		jobResp := ToJobResponse(&app.Job, nil)
		response.Job = &jobResp
	}

	// Add applicant information if requested
	if includeApplicant && app.Applicant.ID != uuid.Nil {
		response.Applicant = &ApplicantResponse{
			ID:        app.Applicant.ID.String(),
			FirstName: app.Applicant.FirstName,
			LastName:  app.Applicant.LastName,
			Email:     app.Applicant.Email,
		}

		// Add profile info if available
		if app.Applicant.Profile != nil {
			response.Applicant.Phone = app.Applicant.Profile.Phone
			// Build location from City, State, Country
			var locationParts []string
			if app.Applicant.Profile.City != nil {
				locationParts = append(locationParts, *app.Applicant.Profile.City)
			}
			if app.Applicant.Profile.State != nil {
				locationParts = append(locationParts, *app.Applicant.Profile.State)
			}
			if app.Applicant.Profile.Country != nil {
				locationParts = append(locationParts, *app.Applicant.Profile.Country)
			}
			if len(locationParts) > 0 {
				location := strings.Join(locationParts, ", ")
				response.Applicant.Location = &location
			}
			response.Applicant.Bio = app.Applicant.Profile.Bio
		}
	}

	// Add status history if available
	if len(app.StatusHistory) > 0 {
		history := make([]StatusHistoryResponse, len(app.StatusHistory))
		for i, h := range app.StatusHistory {
			var fromStatus *string
			if h.FromStatus != nil {
				fs := string(*h.FromStatus)
				fromStatus = &fs
			}

			var changedBy *string
			if h.ChangedBy != nil {
				cb := h.ChangedBy.String()
				changedBy = &cb
			}

			history[i] = StatusHistoryResponse{
				FromStatus: fromStatus,
				ToStatus:   string(h.ToStatus),
				ChangedBy:  changedBy,
				Notes:      h.Notes,
				ChangedAt:  h.CreatedAt,
			}
		}
		response.StatusHistory = history
	}

	return response
}

// ToApplicationListResponse converts a list of applications to ApplicationListResponse
func ToApplicationListResponse(apps []domain.Application, total int64, page, limit int, includeJob, includeApplicant bool) ApplicationListResponse {
	appResponses := make([]ApplicationResponse, len(apps))
	for i, app := range apps {
		appResponses[i] = ToApplicationResponse(&app, includeJob, includeApplicant)
	}

	return ApplicationListResponse{
		Applications: appResponses,
		Pagination:   NewPaginationResponse(page, limit, total),
	}
}

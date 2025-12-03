package dto

import (
	"job-platform/internal/domain"
	"time"

	"github.com/google/uuid"
)

// ============================================================
// REQUEST DTOs
// ============================================================

// SaveJobRequest represents a request to save a job
type SaveJobRequest struct {
	Notes string `json:"notes"`
}

// UpdateSavedJobNotesRequest represents a request to update saved job notes
type UpdateSavedJobNotesRequest struct {
	Notes string `json:"notes" binding:"required"`
}

// ============================================================
// RESPONSE DTOs
// ============================================================

// SavedJobResponse represents a saved job in API responses
type SavedJobResponse struct {
	ID        string       `json:"id"`
	Job       JobResponse  `json:"job"`
	Notes     string       `json:"notes,omitempty"`
	SavedAt   time.Time    `json:"saved_at"`
}

// SavedJobListResponse represents a paginated list of saved jobs
type SavedJobListResponse struct {
	SavedJobs  []SavedJobResponse `json:"saved_jobs"`
	Pagination PaginationResponse `json:"pagination"`
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

// ToSavedJobResponse converts a domain.SavedJob to SavedJobResponse
func ToSavedJobResponse(savedJob *domain.SavedJob) SavedJobResponse {
	var jobResp JobResponse
	if savedJob.Job.ID != uuid.Nil {
		jobResp = ToJobResponse(&savedJob.Job, nil)
	}

	return SavedJobResponse{
		ID:      savedJob.ID.String(),
		Job:     jobResp,
		Notes:   savedJob.Notes,
		SavedAt: savedJob.CreatedAt,
	}
}

// ToSavedJobListResponse converts a list of saved jobs to SavedJobListResponse
func ToSavedJobListResponse(savedJobs []domain.SavedJob, total int64, page, limit int) SavedJobListResponse {
	responses := make([]SavedJobResponse, len(savedJobs))
	for i, savedJob := range savedJobs {
		responses[i] = ToSavedJobResponse(&savedJob)
	}

	return SavedJobListResponse{
		SavedJobs:  responses,
		Pagination: NewPaginationResponse(page, limit, total),
	}
}

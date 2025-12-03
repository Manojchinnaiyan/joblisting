package dto

import (
	"job-platform/internal/domain"
	"time"

	"github.com/google/uuid"
)

// SaveCandidateRequest contains fields for saving a candidate
type SaveCandidateRequest struct {
	CandidateID uuid.UUID `json:"candidate_id" binding:"required"`
	Notes       string    `json:"notes"`
	Folder      string    `json:"folder"`
}

// UpdateSavedCandidateRequest contains fields for updating saved candidate
type UpdateSavedCandidateRequest struct {
	Notes  *string `json:"notes"`
	Folder *string `json:"folder"`
}

// BulkSaveCandidatesRequest contains fields for bulk saving candidates
type BulkSaveCandidatesRequest struct {
	CandidateIDs []uuid.UUID `json:"candidate_ids" binding:"required"`
	Folder       string      `json:"folder"`
}

// MoveCandidatesToFolderRequest for moving candidates to folder
type MoveCandidatesToFolderRequest struct {
	CandidateIDs []uuid.UUID `json:"candidate_ids" binding:"required"`
	Folder       string      `json:"folder" binding:"required"`
}

// SavedCandidateResponse represents a saved candidate response
type SavedCandidateResponse struct {
	ID          uuid.UUID              `json:"id"`
	EmployerID  uuid.UUID              `json:"employer_id"`
	CandidateID uuid.UUID              `json:"candidate_id"`
	Candidate   *ProfileWithUserResponse `json:"candidate,omitempty"`
	Notes       string                 `json:"notes"`
	Folder      string                 `json:"folder"`
	SavedAt     time.Time              `json:"saved_at"`
	UpdatedAt   time.Time              `json:"updated_at"`
}

// SavedCandidateListResponse contains list of saved candidates
type SavedCandidateListResponse struct {
	Candidates []SavedCandidateResponse `json:"candidates"`
	Total      int64                    `json:"total"`
	Limit      int                      `json:"limit"`
	Offset     int                      `json:"offset"`
	Page       int                      `json:"page"`
	TotalPages int                      `json:"total_pages"`
}

// FolderListResponse contains list of folders
type FolderListResponse struct {
	Folders []FolderInfo `json:"folders"`
	Total   int          `json:"total"`
}

// FolderInfo represents folder information
type FolderInfo struct {
	Name  string `json:"name"`
	Count int64  `json:"count"`
}

// CandidateStatsResponse contains candidate statistics
type CandidateStatsResponse struct {
	Total        int64              `json:"total"`
	Folders      int                `json:"folders"`
	FolderCounts map[string]int64   `json:"folder_counts"`
	Unfiled      int64              `json:"unfiled"`
}

// CandidateSearchRequest contains search filters for candidates
type CandidateSearchRequest struct {
	Skills             []string `json:"skills"`
	MinExperienceYears *float32 `json:"min_experience_years"`
	MaxExperienceYears *float32 `json:"max_experience_years"`
	DesiredSalaryMin   *int     `json:"desired_salary_min"`
	DesiredSalaryMax   *int     `json:"desired_salary_max"`
	JobTypes           []string `json:"job_types"`
	Locations          []string `json:"locations"`
	RemoteOnly         *bool    `json:"remote_only"`
	AvailableFrom      *string  `json:"available_from"` // YYYY-MM-DD
	Keyword            string   `json:"keyword"`
	MinCompleteness    *int     `json:"min_completeness"`
	Limit              int      `json:"limit"`
	Offset             int      `json:"offset"`
}

// CandidateSearchResponse contains search results
type CandidateSearchResponse struct {
	Candidates []CandidateSearchResult `json:"candidates"`
	Total      int64                   `json:"total"`
	Limit      int                     `json:"limit"`
	Offset     int                     `json:"offset"`
	Page       int                     `json:"page"`
	TotalPages int                     `json:"total_pages"`
}

// CandidateSearchResult represents a candidate in search results
type CandidateSearchResult struct {
	Profile  ProfileWithUserResponse `json:"profile"`
	IsSaved  bool                    `json:"is_saved"`
	Folder   *string                 `json:"folder,omitempty"`
}

// RecommendedCandidatesResponse contains recommended candidates
type RecommendedCandidatesResponse struct {
	Candidates []ProfileWithUserResponse `json:"candidates"`
	Total      int                       `json:"total"`
	Criteria   string                    `json:"criteria"`
}

// ToSavedCandidateResponse converts domain.SavedCandidate to SavedCandidateResponse
func ToSavedCandidateResponse(saved *domain.SavedCandidate) *SavedCandidateResponse {
	notes := ""
	if saved.Notes != nil {
		notes = *saved.Notes
	}
	folder := ""
	if saved.Folder != nil {
		folder = *saved.Folder
	}
	return &SavedCandidateResponse{
		ID:          saved.ID,
		EmployerID:  saved.EmployerID,
		CandidateID: saved.CandidateID,
		Notes:       notes,
		Folder:      folder,
		SavedAt:     saved.CreatedAt,
		UpdatedAt:   saved.UpdatedAt,
	}
}

// ToSavedCandidateResponseWithProfile converts with profile data
func ToSavedCandidateResponseWithProfile(saved *domain.SavedCandidate, profile *domain.UserProfile, user *domain.User) *SavedCandidateResponse {
	resp := ToSavedCandidateResponse(saved)
	if profile != nil && user != nil {
		profileResp := ToProfileWithUserResponse(profile, user)
		resp.Candidate = profileResp
	}
	return resp
}

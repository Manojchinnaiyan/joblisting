package dto

import (
	"job-platform/internal/domain"
	"time"

	"github.com/google/uuid"
)

// UploadResumeRequest contains fields for uploading a resume
type UploadResumeRequest struct {
	Title string `form:"title" binding:"required"`
}

// ResumeResponse represents a resume response
type ResumeResponse struct {
	ID            uuid.UUID  `json:"id"`
	UserID        uuid.UUID  `json:"user_id"`
	FileName      string     `json:"file_name"`
	FileSize      int64      `json:"file_size"`
	MimeType      string     `json:"mime_type"`
	IsPrimary     bool       `json:"is_primary"`
	Title         string     `json:"title"`
	DownloadCount int        `json:"download_count"`
	UploadedAt    time.Time  `json:"uploaded_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
	DownloadURL   *string    `json:"download_url,omitempty"`
}

// ResumeListResponse contains list of resumes
type ResumeListResponse struct {
	Resumes       []ResumeResponse `json:"resumes"`
	Total         int              `json:"total"`
	MaxAllowed    int              `json:"max_allowed"`
	CanUploadMore bool             `json:"can_upload_more"`
}

// ResumeDownloadResponse contains download URL
type ResumeDownloadResponse struct {
	DownloadURL string    `json:"download_url"`
	ExpiresAt   time.Time `json:"expires_at"`
	FileName    string    `json:"file_name"`
}

// UpdateResumeRequest contains fields for updating resume metadata
type UpdateResumeRequest struct {
	Title *string `json:"title"`
}

// SetPrimaryResumeRequest for setting primary resume
type SetPrimaryResumeRequest struct {
	ResumeID uuid.UUID `json:"resume_id" binding:"required"`
}

// ToResumeResponse converts domain.Resume to ResumeResponse
func ToResumeResponse(resume *domain.Resume) *ResumeResponse {
	title := ""
	if resume.Title != nil {
		title = *resume.Title
	}
	return &ResumeResponse{
		ID:            resume.ID,
		UserID:        resume.UserID,
		FileName:      resume.FileName,
		FileSize:      resume.FileSize,
		MimeType:      resume.MimeType,
		IsPrimary:     resume.IsPrimary,
		Title:         title,
		DownloadCount: resume.DownloadCount,
		UploadedAt:    resume.CreatedAt,
		UpdatedAt:     resume.UpdatedAt,
	}
}

// ToResumeResponseWithURL converts domain.Resume to ResumeResponse with download URL
func ToResumeResponseWithURL(resume *domain.Resume, downloadURL string) *ResumeResponse {
	resp := ToResumeResponse(resume)
	resp.DownloadURL = &downloadURL
	return resp
}

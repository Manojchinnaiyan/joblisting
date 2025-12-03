package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Resume represents a user's uploaded resume file
type Resume struct {
	ID     uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	UserID uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`

	// File Info
	FileName     string `gorm:"type:varchar(255);not null" json:"file_name"`
	OriginalName string `gorm:"type:varchar(255);not null" json:"original_name"`
	FilePath     string `gorm:"type:text;not null" json:"file_path"`
	FileSize     int64  `gorm:"type:integer;not null" json:"file_size"`
	MimeType     string `gorm:"type:varchar(100);not null" json:"mime_type"`

	// Metadata
	Title     *string `gorm:"type:varchar(255)" json:"title"`
	IsPrimary bool    `gorm:"default:false" json:"is_primary"`

	// Stats
	DownloadCount int `gorm:"default:0" json:"download_count"`

	// Relationships
	User *User `gorm:"foreignKey:UserID" json:"user,omitempty"`

	// Timestamps
	CreatedAt time.Time      `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt time.Time      `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}

// TableName specifies the table name for Resume
func (Resume) TableName() string {
	return "resumes"
}

// IsDeleted checks if resume is soft deleted
func (r *Resume) IsDeleted() bool {
	return r.DeletedAt.Valid
}

// IsPDF checks if resume is a PDF file
func (r *Resume) IsPDF() bool {
	return r.MimeType == "application/pdf"
}

// IsWordDoc checks if resume is a Word document
func (r *Resume) IsWordDoc() bool {
	return r.MimeType == "application/msword" ||
		r.MimeType == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
}

// GetFileExtension returns the file extension
func (r *Resume) GetFileExtension() string {
	if r.IsPDF() {
		return "pdf"
	}
	if r.MimeType == "application/msword" {
		return "doc"
	}
	if r.MimeType == "application/vnd.openxmlformats-officedocument.wordprocessingml.document" {
		return "docx"
	}
	return "unknown"
}

// IncrementDownload increments the download counter
func (r *Resume) IncrementDownload() {
	r.DownloadCount++
}

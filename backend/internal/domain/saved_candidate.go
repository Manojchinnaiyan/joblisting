package domain

import (
	"time"

	"github.com/google/uuid"
)

// SavedCandidate represents an employer's saved/shortlisted candidate
type SavedCandidate struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	EmployerID  uuid.UUID `gorm:"type:uuid;not null" json:"employer_id"`
	CandidateID uuid.UUID `gorm:"type:uuid;not null" json:"candidate_id"`

	// Notes
	Notes  *string `gorm:"type:text" json:"notes"`
	Folder *string `gorm:"type:varchar(100)" json:"folder"`

	// Relationships
	Employer  *User `gorm:"foreignKey:EmployerID" json:"employer,omitempty"`
	Candidate *User `gorm:"foreignKey:CandidateID" json:"candidate,omitempty"`

	// Timestamps
	CreatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`
}

// TableName specifies the table name for SavedCandidate
func (SavedCandidate) TableName() string {
	return "saved_candidates"
}

// HasNotes checks if notes are present
func (s *SavedCandidate) HasNotes() bool {
	return s.Notes != nil && *s.Notes != ""
}

// HasFolder checks if assigned to a folder
func (s *SavedCandidate) HasFolder() bool {
	return s.Folder != nil && *s.Folder != ""
}

// IsInFolder checks if candidate is in a specific folder
func (s *SavedCandidate) IsInFolder(folder string) bool {
	return s.Folder != nil && *s.Folder == folder
}

// Validate validates saved candidate data
func (s *SavedCandidate) Validate() error {
	if s.EmployerID == uuid.Nil {
		return ErrInvalidInput
	}
	if s.CandidateID == uuid.Nil {
		return ErrInvalidInput
	}
	if s.EmployerID == s.CandidateID {
		return ErrInvalidInput
	}
	// Validate folder name length if present
	if s.Folder != nil && len(*s.Folder) > 100 {
		return ErrInvalidInput
	}
	return nil
}

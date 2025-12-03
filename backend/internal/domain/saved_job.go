package domain

import (
	"time"

	"github.com/google/uuid"
)

// SavedJob represents a job bookmarked/saved by a user
type SavedJob struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index;uniqueIndex:idx_user_job"`
	JobID     uuid.UUID `gorm:"type:uuid;not null;index;uniqueIndex:idx_user_job"`
	Notes     string    `gorm:"type:text"`
	CreatedAt time.Time

	// Relationships
	User User `gorm:"foreignKey:UserID"`
	Job  Job  `gorm:"foreignKey:JobID"`
}

// TableName specifies the table name for SavedJob
func (SavedJob) TableName() string {
	return "saved_jobs"
}

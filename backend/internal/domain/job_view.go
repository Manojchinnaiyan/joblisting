package domain

import (
	"time"

	"github.com/google/uuid"
)

// JobView represents an analytics record of a job view
type JobView struct {
	ID        uuid.UUID  `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	JobID     uuid.UUID  `gorm:"type:uuid;not null;index"`
	UserID    *uuid.UUID `gorm:"type:uuid;index"`
	IPAddress string     `gorm:"size:45"`
	UserAgent string     `gorm:"type:text"`
	Referrer  string     `gorm:"type:text"`
	ViewedAt  time.Time  `gorm:"default:CURRENT_TIMESTAMP;index"`

	// Relationships
	Job  Job   `gorm:"foreignKey:JobID"`
	User *User `gorm:"foreignKey:UserID"`
}

// TableName specifies the table name for JobView
func (JobView) TableName() string {
	return "job_views"
}

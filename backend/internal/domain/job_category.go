package domain

import (
	"time"

	"github.com/google/uuid"
)

// JobCategory represents a job category/industry
type JobCategory struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	Name        string    `gorm:"size:100;not null"`
	Slug        string    `gorm:"size:100;uniqueIndex;not null"`
	Description string    `gorm:"type:text"`
	Icon        string    `gorm:"size:50"`
	ParentID    *uuid.UUID `gorm:"type:uuid"`
	SortOrder   int       `gorm:"default:0"`
	IsActive    bool      `gorm:"default:true"`
	CreatedAt   time.Time
	UpdatedAt   time.Time

	// Relationships
	Parent       *JobCategory  `gorm:"foreignKey:ParentID"`
	Subcategories []JobCategory `gorm:"foreignKey:ParentID"`
	Jobs         []Job         `gorm:"many2many:job_category_mappings;joinForeignKey:CategoryID;joinReferences:JobID"`
}

// TableName specifies the table name for JobCategory
func (JobCategory) TableName() string {
	return "job_categories"
}

// JobCategoryMapping represents the many-to-many relationship between jobs and categories
type JobCategoryMapping struct {
	JobID      uuid.UUID `gorm:"type:uuid;primaryKey"`
	CategoryID uuid.UUID `gorm:"type:uuid;primaryKey"`

	// Relationships
	Job      Job         `gorm:"foreignKey:JobID"`
	Category JobCategory `gorm:"foreignKey:CategoryID"`
}

// TableName specifies the table name for JobCategoryMapping
func (JobCategoryMapping) TableName() string {
	return "job_category_mappings"
}

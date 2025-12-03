package repository

import (
	"job-platform/internal/domain"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// JobViewRepository handles job view analytics database operations
type JobViewRepository struct {
	db *gorm.DB
}

// NewJobViewRepository creates a new job view repository
func NewJobViewRepository(db *gorm.DB) *JobViewRepository {
	return &JobViewRepository{db: db}
}

// Create creates a new job view record
func (r *JobViewRepository) Create(view *domain.JobView) error {
	return r.db.Create(view).Error
}

// GetByJobID retrieves all views for a job
func (r *JobViewRepository) GetByJobID(jobID uuid.UUID, limit, offset int) ([]domain.JobView, int64, error) {
	var views []domain.JobView
	var total int64

	query := r.db.Model(&domain.JobView{}).
		Where("job_id = ?", jobID)

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := query.
		Preload("User").
		Order("viewed_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&views).Error

	return views, total, err
}

// CountByJobID counts views for a job
func (r *JobViewRepository) CountByJobID(jobID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&domain.JobView{}).
		Where("job_id = ?", jobID).
		Count(&count).Error
	return count, err
}

// CountUniqueViewsByJobID counts unique views (by user) for a job
func (r *JobViewRepository) CountUniqueViewsByJobID(jobID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&domain.JobView{}).
		Where("job_id = ?", jobID).
		Distinct("user_id").
		Count(&count).Error
	return count, err
}

// GetViewsInDateRange retrieves views within a date range
func (r *JobViewRepository) GetViewsInDateRange(jobID uuid.UUID, startDate, endDate time.Time) ([]domain.JobView, error) {
	var views []domain.JobView
	err := r.db.
		Where("job_id = ? AND viewed_at BETWEEN ? AND ?", jobID, startDate, endDate).
		Order("viewed_at DESC").
		Find(&views).Error
	return views, err
}

// CountViewsInDateRange counts views within a date range
func (r *JobViewRepository) CountViewsInDateRange(jobID uuid.UUID, startDate, endDate time.Time) (int64, error) {
	var count int64
	err := r.db.Model(&domain.JobView{}).
		Where("job_id = ? AND viewed_at BETWEEN ? AND ?", jobID, startDate, endDate).
		Count(&count).Error
	return count, err
}

// GetViewsByReferrer retrieves views grouped by referrer
func (r *JobViewRepository) GetViewsByReferrer(jobID uuid.UUID) (map[string]int64, error) {
	type ReferrerCount struct {
		Referrer string
		Count    int64
	}

	var results []ReferrerCount
	err := r.db.Model(&domain.JobView{}).
		Select("referrer, COUNT(*) as count").
		Where("job_id = ?", jobID).
		Group("referrer").
		Order("count DESC").
		Scan(&results).Error

	if err != nil {
		return nil, err
	}

	referrerMap := make(map[string]int64)
	for _, result := range results {
		referrerMap[result.Referrer] = result.Count
	}

	return referrerMap, nil
}

// DeleteOldViews deletes views older than a specific date (for cleanup)
func (r *JobViewRepository) DeleteOldViews(beforeDate time.Time) error {
	return r.db.Where("viewed_at < ?", beforeDate).
		Delete(&domain.JobView{}).Error
}

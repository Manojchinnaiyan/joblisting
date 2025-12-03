package repository

import (
	"job-platform/internal/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SavedJobRepository handles saved job database operations
type SavedJobRepository struct {
	db *gorm.DB
}

// NewSavedJobRepository creates a new saved job repository
func NewSavedJobRepository(db *gorm.DB) *SavedJobRepository {
	return &SavedJobRepository{db: db}
}

// Create creates a new saved job
func (r *SavedJobRepository) Create(savedJob *domain.SavedJob) error {
	return r.db.Create(savedJob).Error
}

// Delete deletes a saved job
func (r *SavedJobRepository) Delete(userID, jobID uuid.UUID) error {
	return r.db.Where("user_id = ? AND job_id = ?", userID, jobID).
		Delete(&domain.SavedJob{}).Error
}

// GetByUserID retrieves all saved jobs for a user
func (r *SavedJobRepository) GetByUserID(userID uuid.UUID, limit, offset int) ([]domain.SavedJob, int64, error) {
	var savedJobs []domain.SavedJob
	var total int64

	query := r.db.Model(&domain.SavedJob{}).
		Where("user_id = ?", userID)

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := query.
		Preload("Job").
		Preload("Job.Employer").
		Preload("Job.Categories").
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&savedJobs).Error

	return savedJobs, total, err
}

// Exists checks if a job is already saved by a user
func (r *SavedJobRepository) Exists(userID, jobID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.Model(&domain.SavedJob{}).
		Where("user_id = ? AND job_id = ?", userID, jobID).
		Count(&count).Error
	return count > 0, err
}

// GetByUserAndJob retrieves a specific saved job
func (r *SavedJobRepository) GetByUserAndJob(userID, jobID uuid.UUID) (*domain.SavedJob, error) {
	var savedJob domain.SavedJob
	err := r.db.
		Preload("Job").
		Where("user_id = ? AND job_id = ?", userID, jobID).
		First(&savedJob).Error
	if err != nil {
		return nil, err
	}
	return &savedJob, nil
}

// UpdateNotes updates notes for a saved job
func (r *SavedJobRepository) UpdateNotes(userID, jobID uuid.UUID, notes string) error {
	return r.db.Model(&domain.SavedJob{}).
		Where("user_id = ? AND job_id = ?", userID, jobID).
		Update("notes", notes).Error
}

// CountByUser counts saved jobs for a user
func (r *SavedJobRepository) CountByUser(userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&domain.SavedJob{}).
		Where("user_id = ?", userID).
		Count(&count).Error
	return count, err
}

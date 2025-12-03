package repository

import (
	"job-platform/internal/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ResumeRepository handles resume data access
type ResumeRepository struct {
	db *gorm.DB
}

// NewResumeRepository creates a new resume repository
func NewResumeRepository(db *gorm.DB) *ResumeRepository {
	return &ResumeRepository{db: db}
}

// Create creates a new resume
func (r *ResumeRepository) Create(resume *domain.Resume) error {
	return r.db.Create(resume).Error
}

// GetByID retrieves a resume by ID
func (r *ResumeRepository) GetByID(id uuid.UUID) (*domain.Resume, error) {
	var resume domain.Resume
	err := r.db.Where("id = ? AND deleted_at IS NULL", id).First(&resume).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, domain.ErrResumeNotFound
		}
		return nil, err
	}
	return &resume, nil
}

// GetUserResumes retrieves all resumes for a user
func (r *ResumeRepository) GetUserResumes(userID uuid.UUID) ([]domain.Resume, error) {
	var resumes []domain.Resume
	err := r.db.Where("user_id = ? AND deleted_at IS NULL", userID).
		Order("is_primary DESC, created_at DESC").
		Find(&resumes).Error
	return resumes, err
}

// GetPrimaryResume retrieves the primary resume for a user
func (r *ResumeRepository) GetPrimaryResume(userID uuid.UUID) (*domain.Resume, error) {
	var resume domain.Resume
	err := r.db.Where("user_id = ? AND is_primary = ? AND deleted_at IS NULL", userID, true).
		First(&resume).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, domain.ErrResumeNotFound
		}
		return nil, err
	}
	return &resume, nil
}

// Update updates a resume
func (r *ResumeRepository) Update(resume *domain.Resume) error {
	return r.db.Save(resume).Error
}

// Delete soft deletes a resume
func (r *ResumeRepository) Delete(id uuid.UUID) error {
	return r.db.Where("id = ?", id).Delete(&domain.Resume{}).Error
}

// HardDelete permanently deletes a resume
func (r *ResumeRepository) HardDelete(id uuid.UUID) error {
	return r.db.Unscoped().Where("id = ?", id).Delete(&domain.Resume{}).Error
}

// SetPrimary sets a resume as primary and unsets others
func (r *ResumeRepository) SetPrimary(id, userID uuid.UUID) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Unset all primary resumes for this user
		if err := tx.Model(&domain.Resume{}).
			Where("user_id = ? AND deleted_at IS NULL", userID).
			Update("is_primary", false).Error; err != nil {
			return err
		}

		// Set this resume as primary
		if err := tx.Model(&domain.Resume{}).
			Where("id = ? AND user_id = ? AND deleted_at IS NULL", id, userID).
			Update("is_primary", true).Error; err != nil {
			return err
		}

		return nil
	})
}

// CountUserResumes counts non-deleted resumes for a user
func (r *ResumeRepository) CountUserResumes(userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&domain.Resume{}).
		Where("user_id = ? AND deleted_at IS NULL", userID).
		Count(&count).Error
	return count, err
}

// IncrementDownloadCount increments the download counter
func (r *ResumeRepository) IncrementDownloadCount(id uuid.UUID) error {
	return r.db.Model(&domain.Resume{}).
		Where("id = ?", id).
		UpdateColumn("download_count", gorm.Expr("download_count + ?", 1)).Error
}

// GetByIDAndUserID retrieves a resume by ID and user ID
func (r *ResumeRepository) GetByIDAndUserID(id, userID uuid.UUID) (*domain.Resume, error) {
	var resume domain.Resume
	err := r.db.Where("id = ? AND user_id = ? AND deleted_at IS NULL", id, userID).
		First(&resume).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, domain.ErrResumeNotFound
		}
		return nil, err
	}
	return &resume, nil
}

// ExistsByID checks if a resume exists
func (r *ResumeRepository) ExistsByID(id uuid.UUID) (bool, error) {
	var count int64
	err := r.db.Model(&domain.Resume{}).
		Where("id = ? AND deleted_at IS NULL", id).
		Count(&count).Error
	return count > 0, err
}

// GetResumeStats retrieves resume statistics
func (r *ResumeRepository) GetResumeStats() (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// Total resumes
	var total int64
	if err := r.db.Model(&domain.Resume{}).
		Where("deleted_at IS NULL").
		Count(&total).Error; err != nil {
		return nil, err
	}
	stats["total_resumes"] = total

	// Total downloads
	var totalDownloads int64
	if err := r.db.Model(&domain.Resume{}).
		Where("deleted_at IS NULL").
		Select("SUM(download_count)").
		Scan(&totalDownloads).Error; err != nil {
		return nil, err
	}
	stats["total_downloads"] = totalDownloads

	// By file type
	var fileTypes []struct {
		MimeType string
		Count    int64
	}
	if err := r.db.Model(&domain.Resume{}).
		Select("mime_type, COUNT(*) as count").
		Where("deleted_at IS NULL").
		Group("mime_type").
		Scan(&fileTypes).Error; err != nil {
		return nil, err
	}
	stats["by_file_type"] = fileTypes

	return stats, nil
}

// GetMostDownloaded retrieves most downloaded resumes
func (r *ResumeRepository) GetMostDownloaded(limit int) ([]domain.Resume, error) {
	var resumes []domain.Resume
	err := r.db.Where("deleted_at IS NULL").
		Order("download_count DESC").
		Limit(limit).
		Find(&resumes).Error
	return resumes, err
}

// DeleteByFilePath deletes resumes by file path
func (r *ResumeRepository) DeleteByFilePath(filePath string) error {
	return r.db.Where("file_path = ?", filePath).Delete(&domain.Resume{}).Error
}

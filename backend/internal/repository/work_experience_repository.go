package repository

import (
	"job-platform/internal/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// WorkExperienceRepository handles work experience data access
type WorkExperienceRepository struct {
	db *gorm.DB
}

// NewWorkExperienceRepository creates a new work experience repository
func NewWorkExperienceRepository(db *gorm.DB) *WorkExperienceRepository {
	return &WorkExperienceRepository{db: db}
}

// Create creates a new work experience
func (r *WorkExperienceRepository) Create(exp *domain.WorkExperience) error {
	return r.db.Create(exp).Error
}

// GetByID retrieves a work experience by ID
func (r *WorkExperienceRepository) GetByID(id uuid.UUID) (*domain.WorkExperience, error) {
	var exp domain.WorkExperience
	err := r.db.Where("id = ?", id).First(&exp).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, domain.ErrExperienceNotFound
		}
		return nil, err
	}
	return &exp, nil
}

// GetByIDAndUserID retrieves a work experience by ID and user ID
func (r *WorkExperienceRepository) GetByIDAndUserID(id, userID uuid.UUID) (*domain.WorkExperience, error) {
	var exp domain.WorkExperience
	err := r.db.Where("id = ? AND user_id = ?", id, userID).First(&exp).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, domain.ErrExperienceNotFound
		}
		return nil, err
	}
	return &exp, nil
}

// GetUserExperiences retrieves all work experiences for a user
func (r *WorkExperienceRepository) GetUserExperiences(userID uuid.UUID) ([]domain.WorkExperience, error) {
	var experiences []domain.WorkExperience
	err := r.db.Where("user_id = ?", userID).
		Order("is_current DESC, start_date DESC").
		Find(&experiences).Error
	return experiences, err
}

// Update updates a work experience
func (r *WorkExperienceRepository) Update(exp *domain.WorkExperience) error {
	return r.db.Save(exp).Error
}

// Delete deletes a work experience
func (r *WorkExperienceRepository) Delete(id uuid.UUID) error {
	return r.db.Where("id = ?", id).Delete(&domain.WorkExperience{}).Error
}

// GetCurrentExperience retrieves current work experience for a user
func (r *WorkExperienceRepository) GetCurrentExperience(userID uuid.UUID) (*domain.WorkExperience, error) {
	var exp domain.WorkExperience
	err := r.db.Where("user_id = ? AND is_current = ?", userID, true).
		Order("start_date DESC").
		First(&exp).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, domain.ErrExperienceNotFound
		}
		return nil, err
	}
	return &exp, nil
}

// CountUserExperiences counts work experiences for a user
func (r *WorkExperienceRepository) CountUserExperiences(userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&domain.WorkExperience{}).
		Where("user_id = ?", userID).
		Count(&count).Error
	return count, err
}

// GetByCompany retrieves work experiences by company name
func (r *WorkExperienceRepository) GetByCompany(userID uuid.UUID, companyName string) ([]domain.WorkExperience, error) {
	var experiences []domain.WorkExperience
	err := r.db.Where("user_id = ? AND company_name ILIKE ?", userID, "%"+companyName+"%").
		Order("start_date DESC").
		Find(&experiences).Error
	return experiences, err
}

// UnsetCurrentStatus unsets current status for all experiences of a user
func (r *WorkExperienceRepository) UnsetCurrentStatus(userID uuid.UUID) error {
	return r.db.Model(&domain.WorkExperience{}).
		Where("user_id = ? AND is_current = ?", userID, true).
		Update("is_current", false).Error
}

// CalculateTotalExperience calculates total experience in years for a user
func (r *WorkExperienceRepository) CalculateTotalExperience(userID uuid.UUID) (float32, error) {
	var experiences []domain.WorkExperience
	err := r.db.Where("user_id = ?", userID).Find(&experiences).Error
	if err != nil {
		return 0, err
	}

	totalMonths := 0
	for _, exp := range experiences {
		totalMonths += exp.GetDuration()
	}

	return float32(totalMonths) / 12.0, nil
}

// ExistsByID checks if a work experience exists
func (r *WorkExperienceRepository) ExistsByID(id uuid.UUID) (bool, error) {
	var count int64
	err := r.db.Model(&domain.WorkExperience{}).
		Where("id = ?", id).
		Count(&count).Error
	return count > 0, err
}

// DeleteUserExperiences deletes all work experiences for a user
func (r *WorkExperienceRepository) DeleteUserExperiences(userID uuid.UUID) error {
	return r.db.Where("user_id = ?", userID).Delete(&domain.WorkExperience{}).Error
}

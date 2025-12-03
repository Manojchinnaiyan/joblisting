package repository

import (
	"job-platform/internal/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// EducationRepository handles education data access
type EducationRepository struct {
	db *gorm.DB
}

// NewEducationRepository creates a new education repository
func NewEducationRepository(db *gorm.DB) *EducationRepository {
	return &EducationRepository{db: db}
}

// Create creates a new education entry
func (r *EducationRepository) Create(edu *domain.Education) error {
	return r.db.Create(edu).Error
}

// GetByID retrieves an education entry by ID
func (r *EducationRepository) GetByID(id uuid.UUID) (*domain.Education, error) {
	var edu domain.Education
	err := r.db.Where("id = ?", id).First(&edu).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, domain.ErrEducationNotFound
		}
		return nil, err
	}
	return &edu, nil
}

// GetByIDAndUserID retrieves an education entry by ID and user ID
func (r *EducationRepository) GetByIDAndUserID(id, userID uuid.UUID) (*domain.Education, error) {
	var edu domain.Education
	err := r.db.Where("id = ? AND user_id = ?", id, userID).First(&edu).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, domain.ErrEducationNotFound
		}
		return nil, err
	}
	return &edu, nil
}

// GetUserEducation retrieves all education entries for a user
func (r *EducationRepository) GetUserEducation(userID uuid.UUID) ([]domain.Education, error) {
	var education []domain.Education
	err := r.db.Where("user_id = ?", userID).
		Order("is_current DESC, start_date DESC").
		Find(&education).Error
	return education, err
}

// Update updates an education entry
func (r *EducationRepository) Update(edu *domain.Education) error {
	return r.db.Save(edu).Error
}

// Delete deletes an education entry
func (r *EducationRepository) Delete(id uuid.UUID) error {
	return r.db.Where("id = ?", id).Delete(&domain.Education{}).Error
}

// GetCurrentEducation retrieves current education for a user
func (r *EducationRepository) GetCurrentEducation(userID uuid.UUID) (*domain.Education, error) {
	var edu domain.Education
	err := r.db.Where("user_id = ? AND is_current = ?", userID, true).
		Order("start_date DESC").
		First(&edu).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, domain.ErrEducationNotFound
		}
		return nil, err
	}
	return &edu, nil
}

// CountUserEducation counts education entries for a user
func (r *EducationRepository) CountUserEducation(userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&domain.Education{}).
		Where("user_id = ?", userID).
		Count(&count).Error
	return count, err
}

// GetByDegree retrieves education entries by degree type
func (r *EducationRepository) GetByDegree(userID uuid.UUID, degree domain.DegreeType) ([]domain.Education, error) {
	var education []domain.Education
	err := r.db.Where("user_id = ? AND degree = ?", userID, degree).
		Order("start_date DESC").
		Find(&education).Error
	return education, err
}

// GetHighestDegree retrieves the highest degree for a user
func (r *EducationRepository) GetHighestDegree(userID uuid.UUID) (*domain.Education, error) {
	var edu domain.Education

	// Order by degree level (descending)
	degreeOrder := `
		CASE degree
			WHEN 'DOCTORATE' THEN 5
			WHEN 'MASTER' THEN 4
			WHEN 'BACHELOR' THEN 3
			WHEN 'ASSOCIATE' THEN 2
			WHEN 'HIGH_SCHOOL' THEN 1
			ELSE 0
		END DESC
	`

	err := r.db.Where("user_id = ?", userID).
		Order(gorm.Expr(degreeOrder)).
		Order("start_date DESC").
		First(&edu).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, domain.ErrEducationNotFound
		}
		return nil, err
	}
	return &edu, nil
}

// UnsetCurrentStatus unsets current status for all education of a user
func (r *EducationRepository) UnsetCurrentStatus(userID uuid.UUID) error {
	return r.db.Model(&domain.Education{}).
		Where("user_id = ? AND is_current = ?", userID, true).
		Update("is_current", false).Error
}

// GetByInstitution retrieves education entries by institution name
func (r *EducationRepository) GetByInstitution(userID uuid.UUID, institution string) ([]domain.Education, error) {
	var education []domain.Education
	err := r.db.Where("user_id = ? AND institution ILIKE ?", userID, "%"+institution+"%").
		Order("start_date DESC").
		Find(&education).Error
	return education, err
}

// ExistsByID checks if an education entry exists
func (r *EducationRepository) ExistsByID(id uuid.UUID) (bool, error) {
	var count int64
	err := r.db.Model(&domain.Education{}).
		Where("id = ?", id).
		Count(&count).Error
	return count > 0, err
}

// DeleteUserEducation deletes all education entries for a user
func (r *EducationRepository) DeleteUserEducation(userID uuid.UUID) error {
	return r.db.Where("user_id = ?", userID).Delete(&domain.Education{}).Error
}

// HasDegree checks if a user has a specific degree type
func (r *EducationRepository) HasDegree(userID uuid.UUID, degree domain.DegreeType) (bool, error) {
	var count int64
	err := r.db.Model(&domain.Education{}).
		Where("user_id = ? AND degree = ?", userID, degree).
		Count(&count).Error
	return count > 0, err
}

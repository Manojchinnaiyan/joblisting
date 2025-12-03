package repository

import (
	"job-platform/internal/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// UserSkillRepository handles user skill data access
type UserSkillRepository struct {
	db *gorm.DB
}

// NewUserSkillRepository creates a new user skill repository
func NewUserSkillRepository(db *gorm.DB) *UserSkillRepository {
	return &UserSkillRepository{db: db}
}

// Create creates a new user skill
func (r *UserSkillRepository) Create(skill *domain.UserSkill) error {
	return r.db.Create(skill).Error
}

// GetByID retrieves a skill by ID
func (r *UserSkillRepository) GetByID(id uuid.UUID) (*domain.UserSkill, error) {
	var skill domain.UserSkill
	err := r.db.Where("id = ?", id).First(&skill).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, domain.ErrSkillNotFound
		}
		return nil, err
	}
	return &skill, nil
}

// GetByIDAndUserID retrieves a skill by ID and user ID
func (r *UserSkillRepository) GetByIDAndUserID(id, userID uuid.UUID) (*domain.UserSkill, error) {
	var skill domain.UserSkill
	err := r.db.Where("id = ? AND user_id = ?", id, userID).First(&skill).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, domain.ErrSkillNotFound
		}
		return nil, err
	}
	return &skill, nil
}

// GetUserSkills retrieves all skills for a user
func (r *UserSkillRepository) GetUserSkills(userID uuid.UUID) ([]domain.UserSkill, error) {
	var skills []domain.UserSkill
	err := r.db.Where("user_id = ?", userID).
		Order("level DESC, name ASC").
		Find(&skills).Error
	return skills, err
}

// Update updates a user skill
func (r *UserSkillRepository) Update(skill *domain.UserSkill) error {
	return r.db.Save(skill).Error
}

// Delete deletes a user skill
func (r *UserSkillRepository) Delete(id uuid.UUID) error {
	return r.db.Where("id = ?", id).Delete(&domain.UserSkill{}).Error
}

// ExistsByName checks if a skill with the same name exists for a user
func (r *UserSkillRepository) ExistsByName(userID uuid.UUID, name string) (bool, error) {
	var count int64
	err := r.db.Model(&domain.UserSkill{}).
		Where("user_id = ? AND LOWER(name) = LOWER(?)", userID, name).
		Count(&count).Error
	return count > 0, err
}

// CountUserSkills counts skills for a user
func (r *UserSkillRepository) CountUserSkills(userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&domain.UserSkill{}).
		Where("user_id = ?", userID).
		Count(&count).Error
	return count, err
}

// GetByLevel retrieves skills by level for a user
func (r *UserSkillRepository) GetByLevel(userID uuid.UUID, level domain.SkillLevel) ([]domain.UserSkill, error) {
	var skills []domain.UserSkill
	err := r.db.Where("user_id = ? AND level = ?", userID, level).
		Order("name ASC").
		Find(&skills).Error
	return skills, err
}

// SearchSkills searches skills by name pattern across all users
func (r *UserSkillRepository) SearchSkills(query string, limit int) ([]string, error) {
	var skills []string
	err := r.db.Model(&domain.UserSkill{}).
		Select("DISTINCT name").
		Where("name ILIKE ?", "%"+query+"%").
		Order("name ASC").
		Limit(limit).
		Pluck("name", &skills).Error
	return skills, err
}

// BulkCreate creates multiple skills for a user
func (r *UserSkillRepository) BulkCreate(skills []domain.UserSkill) error {
	return r.db.Create(&skills).Error
}

// DeleteUserSkills deletes all skills for a user
func (r *UserSkillRepository) DeleteUserSkills(userID uuid.UUID) error {
	return r.db.Where("user_id = ?", userID).Delete(&domain.UserSkill{}).Error
}

// GetTopSkills retrieves most common skills across all users
func (r *UserSkillRepository) GetTopSkills(limit int) ([]map[string]interface{}, error) {
	var results []map[string]interface{}
	err := r.db.Model(&domain.UserSkill{}).
		Select("name, COUNT(*) as count").
		Group("name").
		Order("count DESC").
		Limit(limit).
		Scan(&results).Error
	return results, err
}

// GetSkillsByNames retrieves skills by names for a user
func (r *UserSkillRepository) GetSkillsByNames(userID uuid.UUID, names []string) ([]domain.UserSkill, error) {
	var skills []domain.UserSkill
	err := r.db.Where("user_id = ? AND name IN ?", userID, names).
		Find(&skills).Error
	return skills, err
}

// HasSkill checks if a user has a specific skill
func (r *UserSkillRepository) HasSkill(userID uuid.UUID, skillName string) (bool, error) {
	var count int64
	err := r.db.Model(&domain.UserSkill{}).
		Where("user_id = ? AND LOWER(name) = LOWER(?)", userID, skillName).
		Count(&count).Error
	return count > 0, err
}

// ExistsByID checks if a skill exists
func (r *UserSkillRepository) ExistsByID(id uuid.UUID) (bool, error) {
	var count int64
	err := r.db.Model(&domain.UserSkill{}).
		Where("id = ?", id).
		Count(&count).Error
	return count > 0, err
}

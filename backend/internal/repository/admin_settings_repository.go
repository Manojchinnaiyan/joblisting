package repository

import (
	"job-platform/internal/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AdminSettingsRepository handles CMS settings database operations
type AdminSettingsRepository struct {
	db *gorm.DB
}

// NewAdminSettingsRepository creates a new admin settings repository
func NewAdminSettingsRepository(db *gorm.DB) *AdminSettingsRepository {
	return &AdminSettingsRepository{db: db}
}

// Create creates a new setting
func (r *AdminSettingsRepository) Create(setting *domain.AdminSetting) error {
	return r.db.Create(setting).Error
}

// GetByKey retrieves a setting by key
func (r *AdminSettingsRepository) GetByKey(key string) (*domain.AdminSetting, error) {
	var setting domain.AdminSetting
	err := r.db.Where("key = ?", key).
		Preload("UpdatedUser").
		First(&setting).Error
	if err != nil {
		return nil, err
	}
	return &setting, nil
}

// GetAll retrieves all settings
func (r *AdminSettingsRepository) GetAll() ([]domain.AdminSetting, error) {
	var settings []domain.AdminSetting
	err := r.db.Preload("UpdatedUser").
		Order("key ASC").
		Find(&settings).Error
	return settings, err
}

// Update updates a setting
func (r *AdminSettingsRepository) Update(setting *domain.AdminSetting) error {
	return r.db.Save(setting).Error
}

// Upsert creates or updates a setting
func (r *AdminSettingsRepository) Upsert(key, value string, description *string, updatedBy uuid.UUID) error {
	setting := &domain.AdminSetting{
		Key:         key,
		Value:       value,
		Description: description,
		UpdatedBy:   &updatedBy,
	}

	var existing domain.AdminSetting
	err := r.db.Where("key = ?", key).First(&existing).Error

	if err == gorm.ErrRecordNotFound {
		// Create new
		setting.ID = uuid.New()
		return r.db.Create(setting).Error
	} else if err != nil {
		return err
	}

	// Update existing
	return r.db.Model(&existing).Updates(map[string]interface{}{
		"value":       value,
		"description": description,
		"updated_by":  updatedBy,
	}).Error
}

// Delete deletes a setting by key
func (r *AdminSettingsRepository) Delete(key string) error {
	return r.db.Where("key = ?", key).Delete(&domain.AdminSetting{}).Error
}

// KeyExists checks if a setting key exists
func (r *AdminSettingsRepository) KeyExists(key string) (bool, error) {
	var count int64
	err := r.db.Model(&domain.AdminSetting{}).
		Where("key = ?", key).
		Count(&count).Error
	return count > 0, err
}

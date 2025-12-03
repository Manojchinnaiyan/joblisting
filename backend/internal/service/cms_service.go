package service

import (
	"job-platform/internal/domain"
	"job-platform/internal/repository"

	"github.com/google/uuid"
)

// CMSService handles CMS/admin settings operations
type CMSService struct {
	settingsRepo *repository.AdminSettingsRepository
}

// NewCMSService creates a new CMS service
func NewCMSService(settingsRepo *repository.AdminSettingsRepository) *CMSService {
	return &CMSService{
		settingsRepo: settingsRepo,
	}
}

// GetSetting retrieves a setting by key
func (s *CMSService) GetSetting(key string) (*domain.AdminSetting, error) {
	return s.settingsRepo.GetByKey(key)
}

// GetAllSettings retrieves all settings
func (s *CMSService) GetAllSettings() ([]domain.AdminSetting, error) {
	return s.settingsRepo.GetAll()
}

// UpdateSetting updates or creates a setting
func (s *CMSService) UpdateSetting(key, value string, description *string, updatedBy uuid.UUID) error {
	return s.settingsRepo.Upsert(key, value, description, updatedBy)
}

// DeleteSetting deletes a setting
func (s *CMSService) DeleteSetting(key string) error {
	return s.settingsRepo.Delete(key)
}

// SettingExists checks if a setting exists
func (s *CMSService) SettingExists(key string) (bool, error) {
	return s.settingsRepo.KeyExists(key)
}

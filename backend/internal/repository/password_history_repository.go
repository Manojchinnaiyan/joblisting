package repository

import (
	"job-platform/internal/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// PasswordHistoryRepository handles password history database operations
type PasswordHistoryRepository struct {
	db *gorm.DB
}

// NewPasswordHistoryRepository creates a new password history repository
func NewPasswordHistoryRepository(db *gorm.DB) *PasswordHistoryRepository {
	return &PasswordHistoryRepository{db: db}
}

// Create creates a new password history entry
func (r *PasswordHistoryRepository) Create(history *domain.PasswordHistory) error {
	return r.db.Create(history).Error
}

// GetRecentPasswords retrieves recent password hashes for a user
func (r *PasswordHistoryRepository) GetRecentPasswords(userID uuid.UUID, limit int) ([]domain.PasswordHistory, error) {
	var history []domain.PasswordHistory
	err := r.db.Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).
		Find(&history).Error
	return history, err
}

// DeleteOldPasswords keeps only the most recent N passwords
func (r *PasswordHistoryRepository) DeleteOldPasswords(userID uuid.UUID, keepLast int) error {
	// Get IDs of passwords to keep
	var keepIDs []uuid.UUID
	err := r.db.Model(&domain.PasswordHistory{}).
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(keepLast).
		Pluck("id", &keepIDs).Error

	if err != nil {
		return err
	}

	// Delete older passwords
	if len(keepIDs) > 0 {
		return r.db.Where("user_id = ? AND id NOT IN ?", userID, keepIDs).
			Delete(&domain.PasswordHistory{}).Error
	}

	return nil
}

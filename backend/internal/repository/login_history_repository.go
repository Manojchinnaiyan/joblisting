package repository

import (
	"job-platform/internal/domain"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// LoginHistoryRepository handles login history database operations
type LoginHistoryRepository struct {
	db *gorm.DB
}

// NewLoginHistoryRepository creates a new login history repository
func NewLoginHistoryRepository(db *gorm.DB) *LoginHistoryRepository {
	return &LoginHistoryRepository{db: db}
}

// Create creates a new login history entry
func (r *LoginHistoryRepository) Create(history *domain.LoginHistory) error {
	return r.db.Create(history).Error
}

// GetByUserID retrieves login history for a user
func (r *LoginHistoryRepository) GetByUserID(userID uuid.UUID, limit int) ([]domain.LoginHistory, error) {
	var history []domain.LoginHistory
	query := r.db.Where("user_id = ?", userID).
		Order("created_at DESC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Find(&history).Error
	return history, err
}

// GetByEmail retrieves login history by email (even if user doesn't exist)
func (r *LoginHistoryRepository) GetByEmail(email string, limit int) ([]domain.LoginHistory, error) {
	var history []domain.LoginHistory
	query := r.db.Where("email = ?", email).
		Order("created_at DESC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Find(&history).Error
	return history, err
}

// GetRecent retrieves recent login history across all users
func (r *LoginHistoryRepository) GetRecent(limit int) ([]domain.LoginHistory, error) {
	var history []domain.LoginHistory
	err := r.db.Order("created_at DESC").
		Limit(limit).
		Preload("User").
		Find(&history).Error
	return history, err
}

// CountByStatus counts login attempts by status
func (r *LoginHistoryRepository) CountByStatus(status domain.LoginStatus, since time.Time) (int64, error) {
	var count int64
	err := r.db.Model(&domain.LoginHistory{}).
		Where("status = ? AND created_at >= ?", status, since).
		Count(&count).Error
	return count, err
}

// CountFailedAttemptsByEmail counts recent failed attempts for an email
func (r *LoginHistoryRepository) CountFailedAttemptsByEmail(email string, since time.Time) (int64, error) {
	var count int64
	err := r.db.Model(&domain.LoginHistory{}).
		Where("email = ? AND status = ? AND created_at >= ?",
			email, domain.LoginStatusFailed, since).
		Count(&count).Error
	return count, err
}

// CountFailedAttemptsByIP counts recent failed attempts from an IP
func (r *LoginHistoryRepository) CountFailedAttemptsByIP(ip string, since time.Time) (int64, error) {
	var count int64
	err := r.db.Model(&domain.LoginHistory{}).
		Where("ip_address = ? AND status = ? AND created_at >= ?",
			ip, domain.LoginStatusFailed, since).
		Count(&count).Error
	return count, err
}

// GetSecurityEvents retrieves security-related events (failed, locked)
func (r *LoginHistoryRepository) GetSecurityEvents(since time.Time, limit int) ([]domain.LoginHistory, error) {
	var history []domain.LoginHistory
	err := r.db.Where("status IN (?, ?) AND created_at >= ?",
		domain.LoginStatusFailed, domain.LoginStatusLocked, since).
		Order("created_at DESC").
		Limit(limit).
		Preload("User").
		Find(&history).Error
	return history, err
}

// GetLoginStats retrieves login statistics
func (r *LoginHistoryRepository) GetLoginStats(since time.Time) (map[string]int64, error) {
	stats := make(map[string]int64)

	// Count successful logins
	var successCount int64
	if err := r.db.Model(&domain.LoginHistory{}).
		Where("status = ? AND created_at >= ?", domain.LoginStatusSuccess, since).
		Count(&successCount).Error; err != nil {
		return nil, err
	}
	stats["successful"] = successCount

	// Count failed logins
	var failedCount int64
	if err := r.db.Model(&domain.LoginHistory{}).
		Where("status = ? AND created_at >= ?", domain.LoginStatusFailed, since).
		Count(&failedCount).Error; err != nil {
		return nil, err
	}
	stats["failed"] = failedCount

	// Count locked accounts
	var lockedCount int64
	if err := r.db.Model(&domain.LoginHistory{}).
		Where("status = ? AND created_at >= ?", domain.LoginStatusLocked, since).
		Count(&lockedCount).Error; err != nil {
		return nil, err
	}
	stats["locked"] = lockedCount

	return stats, nil
}

// DeleteOldHistory deletes login history older than specified duration
func (r *LoginHistoryRepository) DeleteOldHistory(before time.Time) error {
	return r.db.Where("created_at < ?", before).
		Delete(&domain.LoginHistory{}).Error
}

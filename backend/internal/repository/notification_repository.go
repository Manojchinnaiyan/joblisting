package repository

import (
	"job-platform/internal/domain"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// NotificationRepository handles notification database operations
type NotificationRepository struct {
	db *gorm.DB
}

// NewNotificationRepository creates a new notification repository
func NewNotificationRepository(db *gorm.DB) *NotificationRepository {
	return &NotificationRepository{db: db}
}

// Create creates a new notification
func (r *NotificationRepository) Create(notification *domain.Notification) error {
	return r.db.Create(notification).Error
}

// GetByID retrieves a notification by ID
func (r *NotificationRepository) GetByID(id uuid.UUID) (*domain.Notification, error) {
	var notification domain.Notification
	err := r.db.Where("id = ?", id).First(&notification).Error
	if err != nil {
		return nil, err
	}
	return &notification, nil
}

// GetByUserID retrieves notifications for a user with pagination
func (r *NotificationRepository) GetByUserID(userID uuid.UUID, limit, offset int) ([]*domain.Notification, int64, error) {
	var notifications []*domain.Notification
	var total int64

	query := r.db.Model(&domain.Notification{}).Where("user_id = ?", userID)

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := query.
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&notifications).Error

	return notifications, total, err
}

// GetUnreadByUserID retrieves unread notifications for a user
func (r *NotificationRepository) GetUnreadByUserID(userID uuid.UUID, limit, offset int) ([]*domain.Notification, int64, error) {
	var notifications []*domain.Notification
	var total int64

	query := r.db.Model(&domain.Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false)

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := query.
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&notifications).Error

	return notifications, total, err
}

// GetUnreadCount returns the count of unread notifications for a user
func (r *NotificationRepository) GetUnreadCount(userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&domain.Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Count(&count).Error
	return count, err
}

// MarkAsRead marks a notification as read
func (r *NotificationRepository) MarkAsRead(id, userID uuid.UUID) error {
	now := time.Now()
	result := r.db.Model(&domain.Notification{}).
		Where("id = ? AND user_id = ?", id, userID).
		Updates(map[string]interface{}{
			"is_read": true,
			"read_at": now,
		})

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}

	return nil
}

// MarkAllAsRead marks all notifications as read for a user
func (r *NotificationRepository) MarkAllAsRead(userID uuid.UUID) error {
	now := time.Now()
	return r.db.Model(&domain.Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Updates(map[string]interface{}{
			"is_read": true,
			"read_at": now,
		}).Error
}

// Delete deletes a notification
func (r *NotificationRepository) Delete(id, userID uuid.UUID) error {
	result := r.db.
		Where("id = ? AND user_id = ?", id, userID).
		Delete(&domain.Notification{})

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}

	return nil
}

// DeleteAllRead deletes all read notifications for a user
func (r *NotificationRepository) DeleteAllRead(userID uuid.UUID) error {
	return r.db.
		Where("user_id = ? AND is_read = ?", userID, true).
		Delete(&domain.Notification{}).Error
}

// DeleteOlderThan deletes notifications older than a given time
func (r *NotificationRepository) DeleteOlderThan(olderThan time.Time) error {
	return r.db.
		Where("created_at < ?", olderThan).
		Delete(&domain.Notification{}).Error
}

// GetByType retrieves notifications by type for a user
func (r *NotificationRepository) GetByType(userID uuid.UUID, notifType domain.NotificationType, limit, offset int) ([]*domain.Notification, int64, error) {
	var notifications []*domain.Notification
	var total int64

	query := r.db.Model(&domain.Notification{}).
		Where("user_id = ? AND type = ?", userID, notifType)

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := query.
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&notifications).Error

	return notifications, total, err
}

// NotificationPreferencesRepository handles notification preferences database operations
type NotificationPreferencesRepository struct {
	db *gorm.DB
}

// NewNotificationPreferencesRepository creates a new notification preferences repository
func NewNotificationPreferencesRepository(db *gorm.DB) *NotificationPreferencesRepository {
	return &NotificationPreferencesRepository{db: db}
}

// Create creates notification preferences for a user
func (r *NotificationPreferencesRepository) Create(prefs *domain.NotificationPreferences) error {
	return r.db.Create(prefs).Error
}

// GetByUserID retrieves notification preferences for a user
func (r *NotificationPreferencesRepository) GetByUserID(userID uuid.UUID) (*domain.NotificationPreferences, error) {
	var prefs domain.NotificationPreferences
	err := r.db.Where("user_id = ?", userID).First(&prefs).Error
	if err != nil {
		return nil, err
	}
	return &prefs, nil
}

// Update updates notification preferences
func (r *NotificationPreferencesRepository) Update(prefs *domain.NotificationPreferences) error {
	prefs.UpdatedAt = time.Now()
	return r.db.Model(&domain.NotificationPreferences{}).
		Where("user_id = ?", prefs.UserID).
		Updates(prefs).Error
}

// Upsert creates or updates notification preferences
func (r *NotificationPreferencesRepository) Upsert(prefs *domain.NotificationPreferences) error {
	prefs.UpdatedAt = time.Now()
	return r.db.Save(prefs).Error
}

// GetOrCreate gets preferences or creates default ones if they don't exist
func (r *NotificationPreferencesRepository) GetOrCreate(userID uuid.UUID) (*domain.NotificationPreferences, error) {
	prefs, err := r.GetByUserID(userID)
	if err == gorm.ErrRecordNotFound {
		// Create default preferences
		prefs = domain.NewDefaultNotificationPreferences(userID)
		if err := r.Create(prefs); err != nil {
			return nil, err
		}
		return prefs, nil
	}
	if err != nil {
		return nil, err
	}
	return prefs, nil
}

// Delete deletes notification preferences for a user
func (r *NotificationPreferencesRepository) Delete(userID uuid.UUID) error {
	return r.db.Where("user_id = ?", userID).Delete(&domain.NotificationPreferences{}).Error
}

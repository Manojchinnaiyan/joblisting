package repository

import (
	"job-platform/internal/domain"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// UserRepository handles user database operations
type UserRepository struct {
	db *gorm.DB
}

// NewUserRepository creates a new user repository
func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

// Create creates a new user
func (r *UserRepository) Create(user *domain.User) error {
	return r.db.Create(user).Error
}

// GetByID retrieves a user by ID
func (r *UserRepository) GetByID(id uuid.UUID) (*domain.User, error) {
	var user domain.User
	err := r.db.Where("id = ? AND deleted_at IS NULL", id).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// GetByEmail retrieves a user by email
func (r *UserRepository) GetByEmail(email string) (*domain.User, error) {
	var user domain.User
	err := r.db.Where("email = ? AND deleted_at IS NULL", email).First(&user).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, domain.ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}

// GetByGoogleID retrieves a user by Google ID
func (r *UserRepository) GetByGoogleID(googleID string) (*domain.User, error) {
	var user domain.User
	err := r.db.Where("google_id = ? AND deleted_at IS NULL", googleID).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// Update updates a user
func (r *UserRepository) Update(user *domain.User) error {
	return r.db.Save(user).Error
}

// Delete soft deletes a user
func (r *UserRepository) Delete(id uuid.UUID) error {
	return r.db.Model(&domain.User{}).Where("id = ?", id).Update("deleted_at", time.Now()).Error
}

// IncrementFailedAttempts increments failed login attempts
func (r *UserRepository) IncrementFailedAttempts(id uuid.UUID) error {
	return r.db.Model(&domain.User{}).Where("id = ?", id).
		UpdateColumn("failed_login_attempts", gorm.Expr("failed_login_attempts + 1")).Error
}

// ResetFailedAttempts resets failed login attempts to 0
func (r *UserRepository) ResetFailedAttempts(id uuid.UUID) error {
	return r.db.Model(&domain.User{}).Where("id = ?", id).
		Updates(map[string]interface{}{
			"failed_login_attempts": 0,
			"locked_until":          nil,
		}).Error
}

// LockAccount locks a user account until specified time
func (r *UserRepository) LockAccount(id uuid.UUID, until time.Time) error {
	return r.db.Model(&domain.User{}).Where("id = ?", id).
		Update("locked_until", until).Error
}

// UpdateLastLogin updates last login time and IP
func (r *UserRepository) UpdateLastLogin(id uuid.UUID, ip string) error {
	return r.db.Model(&domain.User{}).Where("id = ?", id).
		Updates(map[string]interface{}{
			"last_login_at": time.Now(),
			"last_login_ip": ip,
		}).Error
}

// VerifyEmail marks email as verified
func (r *UserRepository) VerifyEmail(id uuid.UUID) error {
	now := time.Now()
	return r.db.Model(&domain.User{}).Where("id = ?", id).
		Updates(map[string]interface{}{
			"email_verified":    true,
			"email_verified_at": now,
		}).Error
}

// UpdatePassword updates user password
func (r *UserRepository) UpdatePassword(id uuid.UUID, hashedPassword string) error {
	return r.db.Model(&domain.User{}).Where("id = ?", id).
		Update("password", hashedPassword).Error
}

// Enable2FA enables two-factor authentication
func (r *UserRepository) Enable2FA(id uuid.UUID, secret string) error {
	return r.db.Model(&domain.User{}).Where("id = ?", id).
		Updates(map[string]interface{}{
			"two_factor_enabled": true,
			"two_factor_secret":  secret,
		}).Error
}

// Disable2FA disables two-factor authentication
func (r *UserRepository) Disable2FA(id uuid.UUID) error {
	return r.db.Model(&domain.User{}).Where("id = ?", id).
		Updates(map[string]interface{}{
			"two_factor_enabled": false,
			"two_factor_secret":  nil,
		}).Error
}

// Suspend suspends a user account
func (r *UserRepository) Suspend(id uuid.UUID) error {
	return r.db.Model(&domain.User{}).Where("id = ?", id).
		Update("status", domain.StatusSuspended).Error
}

// Activate activates a user account
func (r *UserRepository) Activate(id uuid.UUID) error {
	return r.db.Model(&domain.User{}).Where("id = ?", id).
		Update("status", domain.StatusActive).Error
}

// List retrieves paginated list of users with filters
func (r *UserRepository) List(filters map[string]interface{}, page, perPage int) ([]domain.User, int64, error) {
	var users []domain.User
	var total int64

	query := r.db.Model(&domain.User{}).Where("deleted_at IS NULL")

	// Apply filters
	if role, ok := filters["role"]; ok {
		query = query.Where("role = ?", role)
	}
	if status, ok := filters["status"]; ok {
		query = query.Where("status = ?", status)
	}
	if search, ok := filters["search"]; ok {
		searchTerm := "%" + search.(string) + "%"
		query = query.Where("email LIKE ? OR first_name LIKE ? OR last_name LIKE ?",
			searchTerm, searchTerm, searchTerm)
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * perPage
	if err := query.Offset(offset).Limit(perPage).Order("created_at DESC").Find(&users).Error; err != nil {
		return nil, 0, err
	}

	return users, total, nil
}

// CountByRole counts users by role
func (r *UserRepository) CountByRole(role domain.UserRole) (int64, error) {
	var count int64
	err := r.db.Model(&domain.User{}).
		Where("role = ? AND deleted_at IS NULL", role).
		Count(&count).Error
	return count, err
}

// CountByStatus counts users by status
func (r *UserRepository) CountByStatus(status domain.UserStatus) (int64, error) {
	var count int64
	err := r.db.Model(&domain.User{}).
		Where("status = ? AND deleted_at IS NULL", status).
		Count(&count).Error
	return count, err
}

// EmailExists checks if email already exists
func (r *UserRepository) EmailExists(email string) (bool, error) {
	var count int64
	err := r.db.Model(&domain.User{}).
		Where("email = ? AND deleted_at IS NULL", email).
		Count(&count).Error
	return count > 0, err
}

// ListWithSkillsFilter retrieves paginated list of users with skills filter (admin only)
func (r *UserRepository) ListWithSkillsFilter(filters map[string]interface{}, page, perPage int) ([]domain.User, int64, error) {
	var users []domain.User
	var total int64

	query := r.db.Model(&domain.User{}).Where("users.deleted_at IS NULL")

	// Apply standard filters
	if role, ok := filters["role"]; ok && role != "" {
		query = query.Where("users.role = ?", role)
	}
	if status, ok := filters["status"]; ok && status != "" {
		query = query.Where("users.status = ?", status)
	}
	if search, ok := filters["search"]; ok && search != "" {
		searchTerm := "%" + search.(string) + "%"
		query = query.Where("users.email ILIKE ? OR users.first_name ILIKE ? OR users.last_name ILIKE ?",
			searchTerm, searchTerm, searchTerm)
	}

	// Apply skills filter - find users who have ANY of the specified skills
	if skills, ok := filters["skills"].([]string); ok && len(skills) > 0 {
		query = query.Joins("INNER JOIN user_skills ON user_skills.user_id = users.id").
			Where("LOWER(user_skills.name) IN ?", skills).
			Distinct()
	}

	// Count total (need a subquery for DISTINCT count)
	countQuery := r.db.Model(&domain.User{}).Where("users.deleted_at IS NULL")
	if role, ok := filters["role"]; ok && role != "" {
		countQuery = countQuery.Where("users.role = ?", role)
	}
	if status, ok := filters["status"]; ok && status != "" {
		countQuery = countQuery.Where("users.status = ?", status)
	}
	if search, ok := filters["search"]; ok && search != "" {
		searchTerm := "%" + search.(string) + "%"
		countQuery = countQuery.Where("users.email ILIKE ? OR users.first_name ILIKE ? OR users.last_name ILIKE ?",
			searchTerm, searchTerm, searchTerm)
	}
	if skills, ok := filters["skills"].([]string); ok && len(skills) > 0 {
		countQuery = countQuery.Joins("INNER JOIN user_skills ON user_skills.user_id = users.id").
			Where("LOWER(user_skills.name) IN ?", skills).
			Distinct()
	}
	if err := countQuery.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * perPage
	if err := query.
		Preload("Profile").
		Offset(offset).
		Limit(perPage).
		Order("users.created_at DESC").
		Find(&users).Error; err != nil {
		return nil, 0, err
	}

	return users, total, nil
}

// GetUsersBySkills retrieves users who have specific skills
func (r *UserRepository) GetUsersBySkills(skillNames []string, limit, offset int) ([]domain.User, int64, error) {
	var users []domain.User
	var total int64

	// Copy skill names (they're already processed by caller)
	lowerSkills := make([]string, len(skillNames))
	copy(lowerSkills, skillNames)

	query := r.db.Model(&domain.User{}).
		Joins("INNER JOIN user_skills ON user_skills.user_id = users.id").
		Where("users.deleted_at IS NULL").
		Where("LOWER(user_skills.name) IN ?", lowerSkills).
		Distinct()

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := query.
		Preload("Profile").
		Offset(offset).
		Limit(limit).
		Order("users.created_at DESC").
		Find(&users).Error

	return users, total, err
}

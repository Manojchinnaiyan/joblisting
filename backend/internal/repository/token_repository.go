package repository

import (
	"job-platform/internal/domain"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// TokenRepository handles token database operations
type TokenRepository struct {
	db *gorm.DB
}

// NewTokenRepository creates a new token repository
func NewTokenRepository(db *gorm.DB) *TokenRepository {
	return &TokenRepository{db: db}
}

// === Email Verification Tokens ===

// CreateEmailVerificationToken creates a new email verification token
func (r *TokenRepository) CreateEmailVerificationToken(token *domain.EmailVerificationToken) error {
	return r.db.Create(token).Error
}

// GetEmailVerificationToken retrieves a verification token
func (r *TokenRepository) GetEmailVerificationToken(token string) (*domain.EmailVerificationToken, error) {
	var verificationToken domain.EmailVerificationToken
	err := r.db.Where("token = ? AND used = false", token).
		Preload("User").
		First(&verificationToken).Error
	if err != nil {
		return nil, err
	}
	return &verificationToken, nil
}

// MarkEmailTokenAsUsed marks an email verification token as used
func (r *TokenRepository) MarkEmailTokenAsUsed(token string) error {
	now := time.Now()
	return r.db.Model(&domain.EmailVerificationToken{}).
		Where("token = ?", token).
		Updates(map[string]interface{}{
			"used":    true,
			"used_at": now,
		}).Error
}

// DeleteExpiredEmailTokens deletes expired email verification tokens
func (r *TokenRepository) DeleteExpiredEmailTokens() error {
	return r.db.Where("expires_at < ? AND used = false", time.Now()).
		Delete(&domain.EmailVerificationToken{}).Error
}

// CountRecentEmailTokens counts recent email tokens for a user (for rate limiting)
func (r *TokenRepository) CountRecentEmailTokens(userID uuid.UUID, since time.Time) (int64, error) {
	var count int64
	err := r.db.Model(&domain.EmailVerificationToken{}).
		Where("user_id = ? AND created_at > ?", userID, since).
		Count(&count).Error
	return count, err
}

// === Password Reset Tokens ===

// CreatePasswordResetToken creates a new password reset token
func (r *TokenRepository) CreatePasswordResetToken(token *domain.PasswordResetToken) error {
	return r.db.Create(token).Error
}

// GetPasswordResetToken retrieves a password reset token
func (r *TokenRepository) GetPasswordResetToken(token string) (*domain.PasswordResetToken, error) {
	var resetToken domain.PasswordResetToken
	err := r.db.Where("token = ? AND used = false", token).
		Preload("User").
		First(&resetToken).Error
	if err != nil {
		return nil, err
	}
	return &resetToken, nil
}

// MarkPasswordTokenAsUsed marks a password reset token as used
func (r *TokenRepository) MarkPasswordTokenAsUsed(token string) error {
	now := time.Now()
	return r.db.Model(&domain.PasswordResetToken{}).
		Where("token = ?", token).
		Updates(map[string]interface{}{
			"used":    true,
			"used_at": now,
		}).Error
}

// DeleteExpiredPasswordTokens deletes expired password reset tokens
func (r *TokenRepository) DeleteExpiredPasswordTokens() error {
	return r.db.Where("expires_at < ? AND used = false", time.Now()).
		Delete(&domain.PasswordResetToken{}).Error
}

// InvalidateAllPasswordTokens invalidates all password reset tokens for a user
func (r *TokenRepository) InvalidateAllPasswordTokens(userID uuid.UUID) error {
	now := time.Now()
	return r.db.Model(&domain.PasswordResetToken{}).
		Where("user_id = ? AND used = false", userID).
		Updates(map[string]interface{}{
			"used":    true,
			"used_at": now,
		}).Error
}

// === Refresh Tokens ===

// CreateRefreshToken creates a new refresh token
func (r *TokenRepository) CreateRefreshToken(token *domain.RefreshToken) error {
	return r.db.Create(token).Error
}

// GetRefreshToken retrieves a refresh token
func (r *TokenRepository) GetRefreshToken(tokenHash string) (*domain.RefreshToken, error) {
	var refreshToken domain.RefreshToken
	err := r.db.Where("token_hash = ? AND revoked = false", tokenHash).
		Preload("User").
		First(&refreshToken).Error
	if err != nil {
		return nil, err
	}
	return &refreshToken, nil
}

// RevokeRefreshToken revokes a refresh token
func (r *TokenRepository) RevokeRefreshToken(tokenHash string) error {
	now := time.Now()
	return r.db.Model(&domain.RefreshToken{}).
		Where("token_hash = ?", tokenHash).
		Updates(map[string]interface{}{
			"revoked":    true,
			"revoked_at": now,
		}).Error
}

// RevokeAllUserTokens revokes all refresh tokens for a user
func (r *TokenRepository) RevokeAllUserTokens(userID uuid.UUID) error {
	now := time.Now()
	return r.db.Model(&domain.RefreshToken{}).
		Where("user_id = ? AND revoked = false", userID).
		Updates(map[string]interface{}{
			"revoked":    true,
			"revoked_at": now,
		}).Error
}

// DeleteExpiredRefreshTokens deletes expired refresh tokens
func (r *TokenRepository) DeleteExpiredRefreshTokens() error {
	return r.db.Where("expires_at < ?", time.Now()).
		Delete(&domain.RefreshToken{}).Error
}

// GetUserActiveSessions retrieves active refresh tokens (sessions) for a user
func (r *TokenRepository) GetUserActiveSessions(userID uuid.UUID) ([]domain.RefreshToken, error) {
	var tokens []domain.RefreshToken
	err := r.db.Where("user_id = ? AND revoked = false AND expires_at > ?",
		userID, time.Now()).
		Order("created_at DESC").
		Find(&tokens).Error
	return tokens, err
}

// GetAllActiveRefreshTokens retrieves all active refresh tokens
func (r *TokenRepository) GetAllActiveRefreshTokens() ([]domain.RefreshToken, error) {
	var tokens []domain.RefreshToken
	err := r.db.Where("revoked = false AND expires_at > ?", time.Now()).
		Find(&tokens).Error
	return tokens, err
}

// CountActiveRefreshTokens counts active refresh tokens for a user
func (r *TokenRepository) CountActiveRefreshTokens(userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&domain.RefreshToken{}).
		Where("user_id = ? AND revoked = false AND expires_at > ?", userID, time.Now()).
		Count(&count).Error
	return count, err
}

// CleanupExpiredTokens removes all expired tokens (cleanup job)
func (r *TokenRepository) CleanupExpiredTokens() error {
	now := time.Now()

	// Delete expired email verification tokens
	if err := r.db.Where("expires_at < ?", now).Delete(&domain.EmailVerificationToken{}).Error; err != nil {
		return err
	}

	// Delete expired password reset tokens
	if err := r.db.Where("expires_at < ?", now).Delete(&domain.PasswordResetToken{}).Error; err != nil {
		return err
	}

	// Delete expired refresh tokens
	if err := r.db.Where("expires_at < ?", now).Delete(&domain.RefreshToken{}).Error; err != nil {
		return err
	}

	return nil
}

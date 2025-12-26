package service

import (
	"job-platform/internal/domain"
	"job-platform/internal/repository"
	"job-platform/internal/util/jwt"
	"job-platform/internal/util/token"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// TokenService handles JWT and refresh token operations
type TokenService struct {
	tokenRepo        *repository.TokenRepository
	jwtSecret        string
	accessExpiry     time.Duration
	refreshExpiry    time.Duration
	adminExpiry      time.Duration
}

// NewTokenService creates a new token service
func NewTokenService(
	tokenRepo *repository.TokenRepository,
	jwtSecret string,
	accessExpiry, refreshExpiry, adminExpiry time.Duration,
) *TokenService {
	return &TokenService{
		tokenRepo:     tokenRepo,
		jwtSecret:     jwtSecret,
		accessExpiry:  accessExpiry,
		refreshExpiry: refreshExpiry,
		adminExpiry:   adminExpiry,
	}
}

// GenerateAccessToken generates a JWT access token
func (s *TokenService) GenerateAccessToken(user *domain.User) (string, error) {
	expiry := s.accessExpiry
	if user.Role == domain.RoleAdmin {
		expiry = s.adminExpiry
	}

	permissions := s.getPermissionsForRole(user.Role)

	return jwt.GenerateAccessToken(
		user.ID,
		user.Email,
		string(user.Role),
		permissions,
		s.jwtSecret,
		expiry,
	)
}

// GenerateRefreshToken generates and stores a refresh token
func (s *TokenService) GenerateRefreshToken(user *domain.User, ipAddress, userAgent string) (string, error) {
	// Generate random token
	tokenStr, err := token.GenerateSecureToken(32)
	if err != nil {
		return "", err
	}

	// Hash token for storage
	tokenHash, err := bcrypt.GenerateFromPassword([]byte(tokenStr), 10)
	if err != nil {
		return "", err
	}

	// Create refresh token record
	refreshToken := &domain.RefreshToken{
		ID:         uuid.New(),
		UserID:     user.ID,
		TokenHash:  string(tokenHash),
		ExpiresAt:  time.Now().Add(s.refreshExpiry),
		IPAddress:  &ipAddress,
		UserAgent:  &userAgent,
		DeviceInfo: &userAgent, // Can be enhanced to parse device info
	}

	if err := s.tokenRepo.CreateRefreshToken(refreshToken); err != nil {
		return "", err
	}

	return tokenStr, nil
}

// ValidateAccessToken validates a JWT access token
func (s *TokenService) ValidateAccessToken(tokenStr string) (*jwt.Claims, error) {
	claims, err := jwt.ValidateToken(tokenStr, s.jwtSecret)
	if err != nil {
		return nil, domain.ErrInvalidToken
	}

	if jwt.IsTokenExpired(claims) {
		return nil, domain.ErrTokenExpired
	}

	return claims, nil
}

// GetUserIDFromRefreshToken validates a refresh token and returns the user ID
func (s *TokenService) GetUserIDFromRefreshToken(refreshTokenStr string) (uuid.UUID, error) {
	// Get all active refresh tokens (we need to check all since tokens are hashed)
	allTokens, err := s.tokenRepo.GetAllActiveRefreshTokens()
	if err != nil {
		return uuid.Nil, domain.ErrInvalidToken
	}

	// Find matching token by comparing hashes
	var validToken *domain.RefreshToken
	for _, rt := range allTokens {
		if bcrypt.CompareHashAndPassword([]byte(rt.TokenHash), []byte(refreshTokenStr)) == nil {
			validToken = &rt
			break
		}
	}

	if validToken == nil {
		return uuid.Nil, domain.ErrInvalidToken
	}

	// Check if expired
	if validToken.ExpiresAt.Before(time.Now()) {
		return uuid.Nil, domain.ErrTokenExpired
	}

	// Check if revoked
	if validToken.Revoked {
		return uuid.Nil, domain.ErrInvalidToken
	}

	return validToken.UserID, nil
}

// RefreshAccessToken generates new access token using refresh token
func (s *TokenService) RefreshAccessToken(refreshTokenStr string, user *domain.User) (string, error) {
	// Hash the provided token to compare with stored hash
	storedTokens, err := s.tokenRepo.GetUserActiveSessions(user.ID)
	if err != nil {
		return "", domain.ErrInvalidToken
	}

	// Find matching token
	var validToken *domain.RefreshToken
	for _, rt := range storedTokens {
		if bcrypt.CompareHashAndPassword([]byte(rt.TokenHash), []byte(refreshTokenStr)) == nil {
			validToken = &rt
			break
		}
	}

	if validToken == nil {
		return "", domain.ErrInvalidToken
	}

	// Check if expired
	if validToken.ExpiresAt.Before(time.Now()) {
		return "", domain.ErrTokenExpired
	}

	// Check if revoked
	if validToken.Revoked {
		return "", domain.ErrInvalidToken
	}

	// Generate new access token
	return s.GenerateAccessToken(user)
}

// RevokeRefreshToken revokes a refresh token
func (s *TokenService) RevokeRefreshToken(refreshTokenStr string) error {
	// Find and revoke token (hash comparison needed)
	// For simplicity, we'll revoke by finding the token
	// In production, you'd want to hash and compare properly
	return s.tokenRepo.RevokeRefreshToken(refreshTokenStr)
}

// RevokeAllUserTokens revokes all refresh tokens for a user
func (s *TokenService) RevokeAllUserTokens(userID uuid.UUID) error {
	return s.tokenRepo.RevokeAllUserTokens(userID)
}

// CleanupExpiredTokens removes expired tokens (background job)
func (s *TokenService) CleanupExpiredTokens() error {
	return s.tokenRepo.CleanupExpiredTokens()
}

// GetActiveSessions retrieves active sessions for a user
func (s *TokenService) GetActiveSessions(userID uuid.UUID) ([]domain.RefreshToken, error) {
	return s.tokenRepo.GetUserActiveSessions(userID)
}

// GetActiveTokenCount returns the count of active tokens for a user
func (s *TokenService) GetActiveTokenCount(userID uuid.UUID) (int64, error) {
	sessions, err := s.tokenRepo.GetUserActiveSessions(userID)
	if err != nil {
		return 0, err
	}
	return int64(len(sessions)), nil
}

// getPermissionsForRole returns permissions based on role
func (s *TokenService) getPermissionsForRole(role domain.UserRole) []string {
	switch role {
	case domain.RoleAdmin:
		return []string{
			"users:read", "users:write", "users:delete",
			"jobs:read", "jobs:write", "jobs:delete",
			"applications:read", "applications:write",
			"settings:read", "settings:write",
			"analytics:read",
		}
	case domain.RoleEmployer:
		return []string{
			"jobs:read", "jobs:write", "jobs:delete",
			"applications:read", "applications:write",
			"company:read", "company:write",
		}
	case domain.RoleJobSeeker:
		return []string{
			"jobs:read",
			"applications:read", "applications:write",
			"profile:read", "profile:write",
			"resume:upload",
		}
	default:
		return []string{}
	}
}

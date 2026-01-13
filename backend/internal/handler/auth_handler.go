package handler

import (
	"context"
	"fmt"

	"job-platform/internal/cache"
	"job-platform/internal/domain"
	"job-platform/internal/middleware"
	"job-platform/internal/service"
	"job-platform/internal/util/response"

	"github.com/gin-gonic/gin"
)

// AuthHandler handles authentication endpoints
type AuthHandler struct {
	authService  *service.AuthService
	tokenService *service.TokenService
	userService  *service.UserService
	cacheService *cache.CacheService
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(
	authService *service.AuthService,
	tokenService *service.TokenService,
	userService *service.UserService,
	cacheService *cache.CacheService,
) *AuthHandler {
	return &AuthHandler{
		authService:  authService,
		tokenService: tokenService,
		userService:  userService,
		cacheService: cacheService,
	}
}

// RegisterRequest represents registration request body
type RegisterRequest struct {
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=8"`
	FirstName string `json:"first_name" binding:"required,min=2,max=50"`
	LastName  string `json:"last_name" binding:"required,min=2,max=50"`
	Role      string `json:"role" binding:"required,oneof=JOB_SEEKER EMPLOYER"`
}

// LoginRequest represents login request body
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// ChangePasswordRequest represents change password request
type ChangePasswordRequest struct {
	OldPassword string `json:"old_password" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=8"`
}

// SetPasswordRequest represents set password request (for OAuth users)
type SetPasswordRequest struct {
	NewPassword     string `json:"new_password" binding:"required,min=8"`
	ConfirmPassword string `json:"confirm_password" binding:"required,min=8"`
}

// ResetPasswordRequest represents reset password request
type ResetPasswordRequest struct {
	Token       string `json:"token" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=8"`
}

// ForgotPasswordRequest represents forgot password request
type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// RefreshTokenRequest represents refresh token request
type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

// Register handles user registration
func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err)
		return
	}

	// Map role string to domain.UserRole
	var role domain.UserRole
	switch req.Role {
	case "JOB_SEEKER":
		role = domain.RoleJobSeeker
	case "EMPLOYER":
		role = domain.RoleEmployer
	default:
		response.BadRequest(c, domain.ErrInvalidRole)
		return
	}

	// Register user
	user, err := h.authService.Register(service.RegisterRequest{
		Email:     req.Email,
		Password:  req.Password,
		FirstName: req.FirstName,
		LastName:  req.LastName,
		Role:      role,
	})

	if err != nil {
		if err == domain.ErrEmailAlreadyExists {
			response.Error(c, 409, err, nil)
			return
		}
		if err == domain.ErrWeakPassword {
			response.BadRequest(c, err)
			return
		}
		response.InternalError(c, err)
		return
	}

	response.Created(c, "Registration successful. Please check your email to verify your account.", gin.H{
		"user": gin.H{
			"id":         user.ID,
			"email":      user.Email,
			"first_name": user.FirstName,
			"last_name":  user.LastName,
			"role":       user.Role,
		},
	})
}

// Login handles user login
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err)
		return
	}

	// Get client info
	ipAddress := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")

	// Login
	user, accessToken, refreshToken, err := h.authService.Login(
		req.Email,
		req.Password,
		ipAddress,
		userAgent,
	)

	if err != nil {
		switch err {
		case domain.ErrInvalidCredentials:
			response.Unauthorized(c, err)
		case domain.ErrEmailNotVerified:
			response.Error(c, 403, err, nil)
		case domain.ErrAccountLocked:
			response.Error(c, 423, err, nil)
		case domain.ErrAccountSuspended:
			response.Error(c, 403, err, nil)
		default:
			response.InternalError(c, err)
		}
		return
	}

	response.OK(c, "Login successful", gin.H{
		"user": gin.H{
			"id":         user.ID,
			"email":      user.Email,
			"first_name": user.FirstName,
			"last_name":  user.LastName,
			"role":       user.Role,
		},
		"access_token":  accessToken,
		"refresh_token": refreshToken,
		"token_type":    "Bearer",
	})
}

// Logout handles user logout
func (h *AuthHandler) Logout(c *gin.Context) {
	var req RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err)
		return
	}

	if err := h.authService.Logout(req.RefreshToken); err != nil {
		response.InternalError(c, err)
		return
	}

	response.OK(c, "Logout successful", nil)
}

// LogoutAllDevices logs out user from all devices by revoking all tokens
func (h *AuthHandler) LogoutAllDevices(c *gin.Context) {
	// Get current user from context
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, domain.ErrInvalidToken)
		return
	}

	// Revoke all refresh tokens for this user from the database
	if err := h.tokenService.RevokeAllUserTokens(user.ID); err != nil {
		response.InternalError(c, err)
		return
	}

	// Also invalidate all sessions in Redis cache
	ctx := context.Background()
	if h.cacheService != nil && h.cacheService.IsAvailable() {
		_ = h.cacheService.InvalidateAllUserSessions(ctx, user.ID.String())
	}

	response.OK(c, "Logged out from all devices successfully", nil)
}

// GetActiveSessions returns the count of active sessions for the current user
func (h *AuthHandler) GetActiveSessions(c *gin.Context) {
	// Get current user from context
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, domain.ErrInvalidToken)
		return
	}

	// Get session count from cache if available
	var sessionCount int64
	ctx := context.Background()
	if h.cacheService != nil && h.cacheService.IsAvailable() {
		sessionCount, _ = h.cacheService.GetUserSessionCount(ctx, user.ID.String())
	}

	// Get token count from database as well
	tokenCount, err := h.tokenService.GetActiveTokenCount(user.ID)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	response.OK(c, "Active sessions retrieved", gin.H{
		"cache_sessions":    sessionCount,
		"database_sessions": tokenCount,
	})
}

// RefreshToken handles token refresh
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err)
		return
	}

	// Generate new access token using refresh token
	accessToken, err := h.authService.RefreshToken(req.RefreshToken)
	if err != nil {
		if err == domain.ErrTokenExpired || err == domain.ErrInvalidToken {
			response.Unauthorized(c, err)
			return
		}
		response.InternalError(c, err)
		return
	}

	response.OK(c, "Token refreshed successfully", gin.H{
		"access_token": accessToken,
		"token_type":   "Bearer",
	})
}

// VerifyEmail handles email verification
func (h *AuthHandler) VerifyEmail(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		response.BadRequest(c, domain.ErrInvalidToken)
		return
	}

	if err := h.authService.VerifyEmail(token); err != nil {
		if err == domain.ErrTokenExpired {
			response.Error(c, 410, err, nil)
			return
		}
		if err == domain.ErrInvalidToken || err == domain.ErrTokenAlreadyUsed {
			response.BadRequest(c, err)
			return
		}
		response.InternalError(c, err)
		return
	}

	response.OK(c, "Email verified successfully. You can now login.", nil)
}

// ResendVerificationRequest represents resend verification request
type ResendVerificationRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// ResendVerification resends verification email
func (h *AuthHandler) ResendVerification(c *gin.Context) {
	var req ResendVerificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err)
		return
	}

	if err := h.authService.ResendVerificationByEmail(req.Email); err != nil {
		if err == domain.ErrTooManyAttempts {
			response.Error(c, 429, err, nil)
			return
		}
		// Don't reveal if email exists or not - always return success
		// to prevent email enumeration attacks
	}

	response.OK(c, "If the email exists and is not verified, a verification link has been sent.", nil)
}

// ForgotPassword handles forgot password request
func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	var req ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err)
		return
	}

	if err := h.authService.ForgotPassword(req.Email); err != nil {
		response.InternalError(c, err)
		return
	}

	// Always return success to prevent email enumeration
	response.OK(c, "If the email exists, a password reset link has been sent.", nil)
}

// ResetPassword handles password reset
func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err)
		return
	}

	if err := h.authService.ResetPassword(req.Token, req.NewPassword); err != nil {
		switch err {
		case domain.ErrTokenExpired:
			response.Error(c, 410, err, nil)
		case domain.ErrInvalidToken, domain.ErrTokenAlreadyUsed:
			response.BadRequest(c, err)
		case domain.ErrWeakPassword:
			response.BadRequest(c, err)
		case domain.ErrPasswordReuse:
			response.BadRequest(c, err)
		default:
			response.InternalError(c, err)
		}
		return
	}

	response.OK(c, "Password reset successful. Please login with your new password.", nil)
}

// GetMe returns current authenticated user
func (h *AuthHandler) GetMe(c *gin.Context) {
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	// Get profile
	profile, _ := h.userService.GetProfile(user.ID)

	response.OK(c, "User retrieved successfully", gin.H{
		"user": gin.H{
			"id":             user.ID,
			"email":          user.Email,
			"first_name":     user.FirstName,
			"last_name":      user.LastName,
			"role":           user.Role,
			"status":         user.Status,
			"email_verified": user.EmailVerified,
			"auth_provider":  user.AuthProvider,
			"last_login_at":  user.LastLoginAt,
			"created_at":     user.CreatedAt,
		},
		"profile": profile,
	})
}

// ChangePassword handles password change
func (h *AuthHandler) ChangePassword(c *gin.Context) {
	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err)
		return
	}

	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	if err := h.authService.ChangePassword(userID, req.OldPassword, req.NewPassword); err != nil {
		switch err {
		case domain.ErrInvalidCredentials:
			response.Unauthorized(c, err)
		case domain.ErrWeakPassword:
			response.BadRequest(c, err)
		case domain.ErrPasswordReuse:
			response.BadRequest(c, err)
		default:
			response.InternalError(c, err)
		}
		return
	}

	response.OK(c, "Password changed successfully", nil)
}

// SetPassword handles setting password for OAuth users (who don't have a password yet)
func (h *AuthHandler) SetPassword(c *gin.Context) {
	var req SetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err)
		return
	}

	// Validate passwords match
	if req.NewPassword != req.ConfirmPassword {
		response.BadRequest(c, fmt.Errorf("passwords do not match"))
		return
	}

	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	if err := h.authService.SetPassword(userID, req.NewPassword); err != nil {
		switch err {
		case domain.ErrInvalidCredentials:
			response.BadRequest(c, fmt.Errorf("cannot set password - you may already have one or did not sign up with Google"))
		case domain.ErrWeakPassword:
			response.BadRequest(c, err)
		default:
			response.InternalError(c, err)
		}
		return
	}

	response.OK(c, "Password set successfully. You can now login with your email and password.", nil)
}

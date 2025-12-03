package handler

import (
	"job-platform/internal/domain"
	"job-platform/internal/middleware"
	"job-platform/internal/service"
	"job-platform/internal/util/response"

	"github.com/gin-gonic/gin"
)

// AdminAuthHandler handles admin authentication endpoints
type AdminAuthHandler struct {
	adminService *service.AdminService
	tokenService *service.TokenService
}

// NewAdminAuthHandler creates a new admin auth handler
func NewAdminAuthHandler(
	adminService *service.AdminService,
	tokenService *service.TokenService,
) *AdminAuthHandler {
	return &AdminAuthHandler{
		adminService: adminService,
		tokenService: tokenService,
	}
}

// AdminLoginRequest represents admin login request
type AdminLoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// Verify2FARequest represents 2FA verification request
type Verify2FARequest struct {
	Code string `json:"code" binding:"required,len=6"`
}

// Enable2FAResponse represents 2FA enable response
type Enable2FAResponse struct {
	Secret string `json:"secret"`
	QRCode string `json:"qr_code_url"`
}

// Disable2FARequest represents 2FA disable request
type Disable2FARequest struct {
	Code string `json:"code" binding:"required,len=6"`
}

// UpdateProfileRequest represents profile update request
type UpdateProfileRequest struct {
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Phone     string `json:"phone"`
}

// Login handles admin login
func (h *AdminAuthHandler) Login(c *gin.Context) {
	var req AdminLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err)
		return
	}

	// Get client info
	ipAddress := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")

	// Login
	loginResp, err := h.adminService.Login(req.Email, req.Password, ipAddress, userAgent)
	if err != nil {
		switch err {
		case domain.ErrInvalidCredentials:
			response.Unauthorized(c, err)
		case domain.ErrAccountSuspended:
			response.Error(c, 403, err, nil)
		case domain.ErrForbidden:
			response.Forbidden(c, err)
		default:
			response.InternalError(c, err)
		}
		return
	}

	// Check if 2FA is required
	if loginResp.TwoFactorRequired {
		response.OK(c, "2FA verification required", gin.H{
			"two_factor_required": true,
			"challenge":           loginResp.TwoFactorChallenge,
			"user_id":             loginResp.User.ID,
		})
		return
	}

	response.OK(c, "Admin login successful", gin.H{
		"user": gin.H{
			"id":         loginResp.User.ID,
			"email":      loginResp.User.Email,
			"first_name": loginResp.User.FirstName,
			"last_name":  loginResp.User.LastName,
			"role":       loginResp.User.Role,
		},
		"access_token":  loginResp.AccessToken,
		"refresh_token": loginResp.RefreshToken,
		"token_type":    "Bearer",
	})
}

// Verify2FA handles 2FA verification after login
func (h *AdminAuthHandler) Verify2FA(c *gin.Context) {
	var req Verify2FARequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err)
		return
	}

	// Get user ID from context or request
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	// Get client info
	ipAddress := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")

	// Verify 2FA
	loginResp, err := h.adminService.Verify2FA(userID, req.Code, ipAddress, userAgent)
	if err != nil {
		switch err {
		case domain.ErrInvalid2FACode:
			response.BadRequest(c, err)
		case domain.Err2FARequired:
			response.BadRequest(c, err)
		default:
			response.InternalError(c, err)
		}
		return
	}

	response.OK(c, "2FA verification successful", gin.H{
		"user": gin.H{
			"id":         loginResp.User.ID,
			"email":      loginResp.User.Email,
			"first_name": loginResp.User.FirstName,
			"last_name":  loginResp.User.LastName,
			"role":       loginResp.User.Role,
		},
		"access_token":  loginResp.AccessToken,
		"refresh_token": loginResp.RefreshToken,
		"token_type":    "Bearer",
	})
}

// GetMe returns current admin user info
func (h *AdminAuthHandler) GetMe(c *gin.Context) {
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	// Verify admin role
	if user.Role != domain.RoleAdmin {
		response.Forbidden(c, domain.ErrForbidden)
		return
	}

	response.OK(c, "Admin user retrieved successfully", gin.H{
		"user": gin.H{
			"id":                 user.ID,
			"email":              user.Email,
			"first_name":         user.FirstName,
			"last_name":          user.LastName,
			"role":               user.Role,
			"status":             user.Status,
			"two_factor_enabled": user.TwoFactorEnabled,
			"last_login_at":      user.LastLoginAt,
			"last_login_ip":      user.LastLoginIP,
			"created_at":         user.CreatedAt,
		},
	})
}

// Enable2FA enables two-factor authentication
func (h *AdminAuthHandler) Enable2FA(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	secret, qrCode, err := h.adminService.Enable2FA(userID)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	response.OK(c, "2FA enabled successfully. Scan QR code with your authenticator app.", gin.H{
		"secret":      secret,
		"qr_code_url": qrCode,
	})
}

// Disable2FA disables two-factor authentication
func (h *AdminAuthHandler) Disable2FA(c *gin.Context) {
	var req Disable2FARequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err)
		return
	}

	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	if err := h.adminService.Disable2FA(userID, req.Code); err != nil {
		if err == domain.ErrInvalid2FACode {
			response.BadRequest(c, err)
			return
		}
		response.InternalError(c, err)
		return
	}

	response.OK(c, "2FA disabled successfully", nil)
}

// Logout handles admin logout
func (h *AdminAuthHandler) Logout(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err)
		return
	}

	if err := h.tokenService.RevokeRefreshToken(req.RefreshToken); err != nil {
		response.InternalError(c, err)
		return
	}

	response.OK(c, "Admin logout successful", nil)
}

// RefreshToken handles token refresh for admin
func (h *AdminAuthHandler) RefreshToken(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err)
		return
	}

	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	accessToken, err := h.tokenService.RefreshAccessToken(req.RefreshToken, user)
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

// UpdateProfile handles admin profile update
func (h *AdminAuthHandler) UpdateProfile(c *gin.Context) {
	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err)
		return
	}

	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	user, err := h.adminService.UpdateAdminProfile(userID, req.FirstName, req.LastName, req.Phone)
	if err != nil {
		if err == domain.ErrUserNotFound {
			response.NotFound(c, err)
			return
		}
		if err == domain.ErrForbidden {
			response.Forbidden(c, err)
			return
		}
		response.InternalError(c, err)
		return
	}

	response.OK(c, "Profile updated successfully", gin.H{
		"user": gin.H{
			"id":                 user.ID,
			"email":              user.Email,
			"first_name":         user.FirstName,
			"last_name":          user.LastName,
			"role":               user.Role,
			"status":             user.Status,
			"two_factor_enabled": user.TwoFactorEnabled,
			"created_at":         user.CreatedAt,
		},
	})
}

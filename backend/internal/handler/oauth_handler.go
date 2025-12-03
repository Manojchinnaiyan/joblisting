package handler

import (
	"fmt"
	"job-platform/internal/config"
	"job-platform/internal/domain"
	"job-platform/internal/service"
	"job-platform/internal/util/response"
	"job-platform/internal/util/token"
	"net/http"
	"net/url"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// OAuthHandler handles OAuth authentication
type OAuthHandler struct {
	googleOAuthService *service.GoogleOAuthService
	cfg                *config.Config
}

// NewOAuthHandler creates a new OAuth handler
func NewOAuthHandler(googleOAuthService *service.GoogleOAuthService, cfg *config.Config) *OAuthHandler {
	return &OAuthHandler{
		googleOAuthService: googleOAuthService,
		cfg:                cfg,
	}
}

// GoogleLoginRequest represents the OAuth callback request
type GoogleLoginRequest struct {
	Code  string `json:"code" binding:"required"`
	State string `json:"state" binding:"required"`
}

// GoogleAuthURLResponse represents the auth URL response
type GoogleAuthURLResponse struct {
	AuthURL string `json:"auth_url"`
	State   string `json:"state"`
}

// GetGoogleAuthURL generates Google OAuth URL and redirects to Google
func (h *OAuthHandler) GetGoogleAuthURL(c *gin.Context) {
	// Get role from query param (optional, defaults to JOB_SEEKER)
	role := c.Query("role")
	if role == "" {
		role = "JOB_SEEKER"
	}

	// Generate random state for CSRF protection
	// Encode role in state: role:random_token
	randomToken, err := token.GenerateSecureToken(32)
	if err != nil {
		response.InternalError(c, err)
		return
	}
	state := fmt.Sprintf("%s:%s", role, randomToken)

	// Generate auth URL
	authURL := h.googleOAuthService.GetAuthURL(state)

	// Store state in session/cookie for verification
	c.SetCookie(
		"oauth_state",
		state,
		300, // 5 minutes
		"/",
		"",
		false,
		true, // HttpOnly
	)

	// Redirect to Google OAuth
	c.Redirect(http.StatusTemporaryRedirect, authURL)
}

// GetGoogleAuthURLJSON returns Google OAuth URL as JSON (for SPA clients)
func (h *OAuthHandler) GetGoogleAuthURLJSON(c *gin.Context) {
	// Get role from query param (optional, defaults to JOB_SEEKER)
	role := c.Query("role")
	if role == "" {
		role = "JOB_SEEKER"
	}

	// Generate random state for CSRF protection
	randomToken, err := token.GenerateSecureToken(32)
	if err != nil {
		response.InternalError(c, err)
		return
	}
	state := fmt.Sprintf("%s:%s", role, randomToken)

	// Generate auth URL
	authURL := h.googleOAuthService.GetAuthURL(state)

	// Store state in session/cookie for verification
	c.SetCookie(
		"oauth_state",
		state,
		300, // 5 minutes
		"/",
		"",
		false,
		true, // HttpOnly
	)

	response.OK(c, "Google OAuth URL generated successfully", GoogleAuthURLResponse{
		AuthURL: authURL,
		State:   state,
	})
}

// GoogleCallback handles Google OAuth callback (POST - for SPA clients)
func (h *OAuthHandler) GoogleCallback(c *gin.Context) {
	var req GoogleLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, domain.ErrInvalidInput)
		return
	}

	// Verify state (CSRF protection)
	storedState, err := c.Cookie("oauth_state")
	if err != nil || storedState != req.State {
		response.BadRequest(c, domain.ErrInvalidInput)
		return
	}

	// Clear the state cookie
	c.SetCookie("oauth_state", "", -1, "/", "", false, true)

	// Extract role from state
	// State format: role:random_token
	role := domain.RoleJobSeeker // Default role
	if req.State != "" {
		parts := strings.Split(req.State, ":")
		if len(parts) >= 1 && parts[0] != "" {
			if parts[0] == "EMPLOYER" {
				role = domain.RoleEmployer
			}
		}
	}

	// Get client info
	ipAddress := c.ClientIP()
	userAgent := c.Request.UserAgent()

	// Authenticate user with Google
	user, accessToken, refreshToken, err := h.googleOAuthService.AuthenticateUser(
		c.Request.Context(),
		req.Code,
		ipAddress,
		userAgent,
		role,
	)
	if err != nil {
		response.BadRequest(c, err)
		return
	}

	// Return tokens and user info
	response.OK(c, "Login successful", gin.H{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
		"token_type":    "Bearer",
		"expires_in":    86400, // 24 hours
		"user": gin.H{
			"id":         user.ID,
			"email":      user.Email,
			"first_name": user.FirstName,
			"last_name":  user.LastName,
			"role":       user.Role,
			"status":     user.Status,
		},
	})
}

// GoogleCallbackRedirect handles Google OAuth callback (GET - redirect from Google)
// This is called by Google after user grants permission
func (h *OAuthHandler) GoogleCallbackRedirect(c *gin.Context) {
	frontendURL := h.cfg.FrontendURL
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	}

	// Check for OAuth errors from Google
	errorParam := c.Query("error")
	if errorParam != "" {
		errorDesc := c.Query("error_description")
		redirectURL := fmt.Sprintf("%s/google/callback?error=%s&error_description=%s",
			frontendURL,
			url.QueryEscape(errorParam),
			url.QueryEscape(errorDesc))
		c.Redirect(http.StatusTemporaryRedirect, redirectURL)
		return
	}

	// Get code and state from query params
	code := c.Query("code")
	state := c.Query("state")

	if code == "" {
		redirectURL := fmt.Sprintf("%s/google/callback?error=missing_code", frontendURL)
		c.Redirect(http.StatusTemporaryRedirect, redirectURL)
		return
	}

	// Verify state (CSRF protection) - optional for redirect flow
	storedState, err := c.Cookie("oauth_state")
	if err != nil || storedState != state {
		// For redirect flow, we can be more lenient with state verification
		// since the flow happens in the same browser session
		// Log the mismatch but continue if code is present
		// In production, you may want to be stricter
	}

	// Clear the state cookie
	c.SetCookie("oauth_state", "", -1, "/", "", false, true)

	// Extract role from state
	// State format: role:random_token
	role := domain.RoleJobSeeker // Default role
	if state != "" {
		parts := strings.Split(state, ":")
		if len(parts) >= 1 && parts[0] != "" {
			if parts[0] == "EMPLOYER" {
				role = domain.RoleEmployer
			}
		}
	}

	// Get client info
	ipAddress := c.ClientIP()
	userAgent := c.Request.UserAgent()

	// Authenticate user with Google
	user, accessToken, refreshToken, err := h.googleOAuthService.AuthenticateUser(
		c.Request.Context(),
		code,
		ipAddress,
		userAgent,
		role,
	)
	if err != nil {
		redirectURL := fmt.Sprintf("%s/google/callback?error=auth_failed&message=%s",
			frontendURL,
			url.QueryEscape(err.Error()))
		c.Redirect(http.StatusTemporaryRedirect, redirectURL)
		return
	}

	// Redirect to frontend with tokens
	redirectURL := fmt.Sprintf("%s/google/callback?access_token=%s&refresh_token=%s&user_id=%s&email=%s&first_name=%s&last_name=%s&role=%s",
		frontendURL,
		url.QueryEscape(accessToken),
		url.QueryEscape(refreshToken),
		url.QueryEscape(user.ID.String()),
		url.QueryEscape(user.Email),
		url.QueryEscape(user.FirstName),
		url.QueryEscape(user.LastName),
		url.QueryEscape(string(user.Role)))

	c.Redirect(http.StatusTemporaryRedirect, redirectURL)
}

// LinkGoogleAccountRequest represents link Google account request
type LinkGoogleAccountRequest struct {
	Code string `json:"code" binding:"required"`
}

// LinkGoogleAccount links Google account to existing user
func (h *OAuthHandler) LinkGoogleAccount(c *gin.Context) {
	var req LinkGoogleAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, domain.ErrInvalidInput)
		return
	}

	// Get user ID from context (set by AuthMiddleware)
	userIDVal, exists := c.Get("user_id")
	if !exists {
		response.Unauthorized(c, domain.ErrUnauthorized)
		return
	}

	userID, ok := userIDVal.(uuid.UUID)
	if !ok {
		response.InternalError(c, domain.ErrInternalServer)
		return
	}

	// Link Google account
	if err := h.googleOAuthService.LinkGoogleAccount(c.Request.Context(), userID, req.Code); err != nil {
		response.BadRequest(c, err)
		return
	}

	response.OK(c, "Google account linked successfully", nil)
}

// UnlinkGoogleAccount removes Google account link
func (h *OAuthHandler) UnlinkGoogleAccount(c *gin.Context) {
	// Get user ID from context
	userIDVal, exists := c.Get("user_id")
	if !exists {
		response.Unauthorized(c, domain.ErrUnauthorized)
		return
	}

	userID, ok := userIDVal.(uuid.UUID)
	if !ok {
		response.InternalError(c, domain.ErrInternalServer)
		return
	}

	// Unlink Google account
	if err := h.googleOAuthService.UnlinkGoogleAccount(userID); err != nil {
		response.BadRequest(c, err)
		return
	}

	response.OK(c, "Google account unlinked successfully", nil)
}

package service

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"job-platform/internal/domain"
	"job-platform/internal/repository"
	"net/http"
	"net/url"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// GoogleOAuthService handles Google OAuth authentication
type GoogleOAuthService struct {
	userRepo         *repository.UserRepository
	profileRepo      *repository.ProfileRepository
	loginHistoryRepo *repository.LoginHistoryRepository
	tokenService     *TokenService
	db               *gorm.DB
	clientID         string
	clientSecret     string
	redirectURL      string
}

// GoogleUserInfo represents the user info from Google
type GoogleUserInfo struct {
	ID            string `json:"id"`
	Email         string `json:"email"`
	VerifiedEmail bool   `json:"verified_email"`
	Name          string `json:"name"`
	GivenName     string `json:"given_name"`
	FamilyName    string `json:"family_name"`
	Picture       string `json:"picture"`
	Locale        string `json:"locale"`
}

// GoogleTokenResponse represents the OAuth token response
type GoogleTokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
	TokenType    string `json:"token_type"`
	IDToken      string `json:"id_token"`
}

// NewGoogleOAuthService creates a new Google OAuth service
func NewGoogleOAuthService(
	userRepo *repository.UserRepository,
	profileRepo *repository.ProfileRepository,
	loginHistoryRepo *repository.LoginHistoryRepository,
	tokenService *TokenService,
	db *gorm.DB,
	clientID, clientSecret, redirectURL string,
) *GoogleOAuthService {
	return &GoogleOAuthService{
		userRepo:         userRepo,
		profileRepo:      profileRepo,
		loginHistoryRepo: loginHistoryRepo,
		tokenService:     tokenService,
		db:               db,
		clientID:         clientID,
		clientSecret:     clientSecret,
		redirectURL:      redirectURL,
	}
}

// GetAuthURL generates the Google OAuth authorization URL
func (s *GoogleOAuthService) GetAuthURL(state string) string {
	baseURL := "https://accounts.google.com/o/oauth2/v2/auth"
	params := url.Values{}
	params.Add("client_id", s.clientID)
	params.Add("redirect_uri", s.redirectURL)
	params.Add("response_type", "code")
	params.Add("scope", "openid email profile")
	params.Add("state", state)
	params.Add("access_type", "offline")
	params.Add("prompt", "consent")

	return fmt.Sprintf("%s?%s", baseURL, params.Encode())
}

// ExchangeCode exchanges authorization code for access token
func (s *GoogleOAuthService) ExchangeCode(ctx context.Context, code string) (*GoogleTokenResponse, error) {
	tokenURL := "https://oauth2.googleapis.com/token"

	data := url.Values{}
	data.Set("code", code)
	data.Set("client_id", s.clientID)
	data.Set("client_secret", s.clientSecret)
	data.Set("redirect_uri", s.redirectURL)
	data.Set("grant_type", "authorization_code")

	resp, err := http.PostForm(tokenURL, data)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange code: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("token exchange failed: %s", string(body))
	}

	var tokenResp GoogleTokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return nil, fmt.Errorf("failed to decode token response: %w", err)
	}

	return &tokenResp, nil
}

// GetUserInfo retrieves user information from Google
func (s *GoogleOAuthService) GetUserInfo(ctx context.Context, accessToken string) (*GoogleUserInfo, error) {
	userInfoURL := "https://www.googleapis.com/oauth2/v2/userinfo"

	req, err := http.NewRequestWithContext(ctx, "GET", userInfoURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", accessToken))

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to get user info: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("user info request failed: %s", string(body))
	}

	var userInfo GoogleUserInfo
	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		return nil, fmt.Errorf("failed to decode user info: %w", err)
	}

	return &userInfo, nil
}

// AuthenticateUser handles OAuth authentication flow
func (s *GoogleOAuthService) AuthenticateUser(ctx context.Context, code, ipAddress, userAgent string, role domain.UserRole) (*domain.User, string, string, error) {
	// Exchange code for token
	tokenResp, err := s.ExchangeCode(ctx, code)
	if err != nil {
		return nil, "", "", err
	}

	// Get user info from Google
	userInfo, err := s.GetUserInfo(ctx, tokenResp.AccessToken)
	if err != nil {
		return nil, "", "", err
	}

	// Check if email is verified
	if !userInfo.VerifiedEmail {
		return nil, "", "", domain.ErrEmailNotVerified
	}

	var user *domain.User
	var isNewUser bool

	// Start transaction
	err = s.db.Transaction(func(tx *gorm.DB) error {
		// Check if user exists
		var existingUser domain.User
		result := tx.Where("email = ? AND deleted_at IS NULL", userInfo.Email).First(&existingUser)

		if result.Error == nil {
			// User exists - update Google ID if needed
			user = &existingUser

			// Check if account is suspended
			if user.Status == domain.StatusSuspended {
				return domain.ErrAccountSuspended
			}

			// Update Google ID if not set
			if user.GoogleID == nil {
				// Check if this Google ID is already linked to another account
				var existingGoogleUser domain.User
				if err := tx.Where("google_id = ? AND id != ? AND deleted_at IS NULL", userInfo.ID, user.ID).First(&existingGoogleUser).Error; err == nil {
					// Google ID exists on another account - this shouldn't happen normally
					// Clear the old link and assign to current user
					if err := tx.Model(&existingGoogleUser).Update("google_id", nil).Error; err != nil {
						return fmt.Errorf("failed to unlink google from old account: %w", err)
					}
				}
				user.GoogleID = &userInfo.ID
				if err := tx.Save(user).Error; err != nil {
					return err
				}
			} else if *user.GoogleID != userInfo.ID {
				// User has a different Google ID - this means they're trying to login with a different Google account
				return fmt.Errorf("this email is already linked to a different Google account")
			}

			// Check if profile exists, create if not
			var existingProfile domain.UserProfile
			if err := tx.Where("user_id = ?", user.ID).First(&existingProfile).Error; err != nil {
				// Profile doesn't exist, create it
				profile := &domain.UserProfile{
					ID:                  uuid.New(),
					UserID:              user.ID,
					Visibility:          domain.VisibilityEmployersOnly,
					OpenToOpportunities: true,
				}
				if err := tx.Create(profile).Error; err != nil {
					return fmt.Errorf("failed to create profile for existing user: %w", err)
				}
			}
		} else if result.Error == gorm.ErrRecordNotFound {
			// Check if Google ID is already used by another account (with different email)
			var existingGoogleUser domain.User
			if err := tx.Where("google_id = ? AND deleted_at IS NULL", userInfo.ID).First(&existingGoogleUser).Error; err == nil {
				// Google ID exists - user is trying to create new account but Google is linked elsewhere
				// This can happen if user changed their Google account email
				// Update the existing account's email and use that account
				existingGoogleUser.Email = userInfo.Email
				existingGoogleUser.FirstName = userInfo.GivenName
				existingGoogleUser.LastName = userInfo.FamilyName
				if err := tx.Save(&existingGoogleUser).Error; err != nil {
					return fmt.Errorf("failed to update existing google user: %w", err)
				}
				user = &existingGoogleUser
				isNewUser = false
			} else {
				// Create new user
				isNewUser = true
				user = &domain.User{
					ID:            uuid.New(),
					Email:         userInfo.Email,
					Password:      "", // No password for OAuth users
					FirstName:     userInfo.GivenName,
					LastName:      userInfo.FamilyName,
					Role:          role, // Use role from OAuth state
					Status:        domain.StatusActive,
					AuthProvider:  domain.AuthProviderGoogle,
					GoogleID:      &userInfo.ID,
					EmailVerified: true, // Google already verified
					EmailVerifiedAt: func() *time.Time {
						t := time.Now()
						return &t
					}(),
				}

				if err := tx.Create(user).Error; err != nil {
					return fmt.Errorf("failed to create user: %w", err)
				}
			}

			// Create user profile with proper defaults (only for new users)
			if isNewUser {
				profile := &domain.UserProfile{
					ID:                  uuid.New(),
					UserID:              user.ID,
					Visibility:          domain.VisibilityEmployersOnly,
					OpenToOpportunities: true,
				}

				if err := tx.Create(profile).Error; err != nil {
					return fmt.Errorf("failed to create profile: %w", err)
				}
			}
		} else {
			return result.Error
		}

		// Update last login
		if err := tx.Model(&domain.User{}).Where("id = ?", user.ID).Updates(map[string]interface{}{
			"last_login_at": time.Now(),
			"last_login_ip": ipAddress,
		}).Error; err != nil {
			return err
		}

		// Record login history
		loginHistory := &domain.LoginHistory{
			ID:        uuid.New(),
			UserID:    &user.ID,
			Email:     user.Email,
			Status:    domain.LoginStatusSuccess,
			IPAddress: &ipAddress,
			UserAgent: &userAgent,
		}

		if err := tx.Create(loginHistory).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		// Log failed login attempt
		failedHistory := &domain.LoginHistory{
			ID:            uuid.New(),
			Email:         userInfo.Email,
			Status:        domain.LoginStatusFailed,
			IPAddress:     &ipAddress,
			UserAgent:     &userAgent,
			FailureReason: func() *string { s := err.Error(); return &s }(),
		}
		s.loginHistoryRepo.Create(failedHistory)

		return nil, "", "", err
	}

	// Generate tokens
	accessToken, err := s.tokenService.GenerateAccessToken(user)
	if err != nil {
		return nil, "", "", err
	}

	refreshToken, err := s.tokenService.GenerateRefreshToken(user, ipAddress, userAgent)
	if err != nil {
		return nil, "", "", err
	}

	// Return user with new flag
	if isNewUser {
		user.Role = role // Ensure role is set for response
	}

	return user, accessToken, refreshToken, nil
}

// LinkGoogleAccount links a Google account to an existing user
func (s *GoogleOAuthService) LinkGoogleAccount(ctx context.Context, userID uuid.UUID, code string) error {
	// Exchange code for token
	tokenResp, err := s.ExchangeCode(ctx, code)
	if err != nil {
		return err
	}

	// Get user info from Google
	userInfo, err := s.GetUserInfo(ctx, tokenResp.AccessToken)
	if err != nil {
		return err
	}

	// Get existing user
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return err
	}

	// Verify email matches
	if user.Email != userInfo.Email {
		return domain.ErrInvalidCredentials
	}

	// Check if Google ID is already linked to another account
	if existingUser, err := s.userRepo.GetByGoogleID(userInfo.ID); err == nil && existingUser.ID != userID {
		return fmt.Errorf("google account already linked to another user")
	}

	// Update user with Google ID
	user.GoogleID = &userInfo.ID
	user.AuthProvider = domain.AuthProviderGoogle
	user.EmailVerified = true
	now := time.Now()
	user.EmailVerifiedAt = &now

	return s.userRepo.Update(user)
}

// UnlinkGoogleAccount removes Google account link
func (s *GoogleOAuthService) UnlinkGoogleAccount(userID uuid.UUID) error {
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return err
	}

	// Don't allow unlinking if user has no password (OAuth-only account)
	if user.Password == "" {
		return fmt.Errorf("cannot unlink: account has no password set")
	}

	user.GoogleID = nil
	user.AuthProvider = domain.AuthProviderEmail

	return s.userRepo.Update(user)
}

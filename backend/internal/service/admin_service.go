package service

import (
	"fmt"
	"job-platform/internal/domain"
	"job-platform/internal/repository"
	"job-platform/internal/util/email"
	"job-platform/internal/util/password"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/pquerna/otp/totp"
	"gorm.io/gorm"
)

// AdminService handles admin-specific operations
type AdminService struct {
	userRepo         *repository.UserRepository
	profileRepo      *repository.ProfileRepository
	tokenRepo        *repository.TokenRepository
	loginHistoryRepo *repository.LoginHistoryRepository
	tokenService     *TokenService
	emailService email.EmailSender
	db               *gorm.DB
	config           *AdminConfig
}

// AdminConfig holds admin configuration
type AdminConfig struct {
	AdminEmailDomain string
	CompanyName      string
	SupportEmail     string
	BcryptCost       int
}

// NewAdminService creates a new admin service
func NewAdminService(
	userRepo *repository.UserRepository,
	profileRepo *repository.ProfileRepository,
	tokenRepo *repository.TokenRepository,
	loginHistoryRepo *repository.LoginHistoryRepository,
	tokenService *TokenService,
	emailService email.EmailSender,
	db *gorm.DB,
	config *AdminConfig,
) *AdminService {
	return &AdminService{
		userRepo:         userRepo,
		profileRepo:      profileRepo,
		tokenRepo:        tokenRepo,
		loginHistoryRepo: loginHistoryRepo,
		tokenService:     tokenService,
		emailService:     emailService,
		db:               db,
		config:           config,
	}
}

// AdminLoginRequest represents admin login data
type AdminLoginRequest struct {
	Email    string
	Password string
}

// AdminLoginResponse represents admin login response
type AdminLoginResponse struct {
	User               *domain.User
	AccessToken        string
	RefreshToken       string
	TwoFactorRequired  bool
	TwoFactorChallenge string
}

// Login authenticates an admin
func (s *AdminService) Login(email, pwd, ipAddress, userAgent string) (*AdminLoginResponse, error) {
	// Get user
	user, err := s.userRepo.GetByEmail(email)
	if err != nil {
		return nil, domain.ErrInvalidCredentials
	}

	// Verify admin role
	if user.Role != domain.RoleAdmin {
		return nil, domain.ErrForbidden
	}

	// Check if account is suspended
	if user.Status == domain.StatusSuspended {
		return nil, domain.ErrAccountSuspended
	}

	// Verify password
	if err := password.ComparePassword(user.Password, pwd); err != nil {
		return nil, domain.ErrInvalidCredentials
	}

	// Check if 2FA is enabled
	if user.TwoFactorEnabled {
		// Generate challenge token
		challengeToken, _ := uuid.NewRandom()
		return &AdminLoginResponse{
			User:               user,
			TwoFactorRequired:  true,
			TwoFactorChallenge: challengeToken.String(),
		}, nil
	}

	// Generate tokens
	accessToken, err := s.tokenService.GenerateAccessToken(user)
	if err != nil {
		return nil, err
	}

	refreshToken, err := s.tokenService.GenerateRefreshToken(user, ipAddress, userAgent)
	if err != nil {
		return nil, err
	}

	// Update last login
	s.userRepo.UpdateLastLogin(user.ID, ipAddress)

	// Log login
	s.logAdminLogin(user.ID, email, ipAddress, userAgent)

	// Send admin login alert
	go s.sendAdminLoginAlert(user, ipAddress)

	return &AdminLoginResponse{
		User:              user,
		AccessToken:       accessToken,
		RefreshToken:      refreshToken,
		TwoFactorRequired: false,
	}, nil
}

// Verify2FA verifies 2FA code and completes login
func (s *AdminService) Verify2FA(userID uuid.UUID, code, ipAddress, userAgent string) (*AdminLoginResponse, error) {
	// Get user
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, domain.ErrUserNotFound
	}

	// Verify 2FA code
	if !user.TwoFactorEnabled || user.TwoFactorSecret == nil {
		return nil, domain.Err2FARequired
	}

	valid := totp.Validate(code, *user.TwoFactorSecret)
	if !valid {
		return nil, domain.ErrInvalid2FACode
	}

	// Generate tokens
	accessToken, err := s.tokenService.GenerateAccessToken(user)
	if err != nil {
		return nil, err
	}

	refreshToken, err := s.tokenService.GenerateRefreshToken(user, ipAddress, userAgent)
	if err != nil {
		return nil, err
	}

	// Update last login
	s.userRepo.UpdateLastLogin(user.ID, ipAddress)

	// Log login
	s.logAdminLogin(user.ID, user.Email, ipAddress, userAgent)

	// Send admin login alert
	go s.sendAdminLoginAlert(user, ipAddress)

	return &AdminLoginResponse{
		User:              user,
		AccessToken:       accessToken,
		RefreshToken:      refreshToken,
		TwoFactorRequired: false,
	}, nil
}

// Enable2FA enables two-factor authentication
func (s *AdminService) Enable2FA(userID uuid.UUID) (string, string, error) {
	// Get user
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return "", "", domain.ErrUserNotFound
	}

	// Generate TOTP key
	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      s.config.CompanyName,
		AccountName: user.Email,
	})
	if err != nil {
		return "", "", err
	}

	// Save secret
	if err := s.userRepo.Enable2FA(userID, key.Secret()); err != nil {
		return "", "", err
	}

	// Return secret and QR code URL
	return key.Secret(), key.URL(), nil
}

// Disable2FA disables two-factor authentication
func (s *AdminService) Disable2FA(userID uuid.UUID, code string) error {
	// Get user
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return domain.ErrUserNotFound
	}

	// Verify current 2FA code
	if user.TwoFactorSecret == nil {
		return fmt.Errorf("2FA not enabled")
	}

	valid := totp.Validate(code, *user.TwoFactorSecret)
	if !valid {
		return domain.ErrInvalid2FACode
	}

	// Disable 2FA
	return s.userRepo.Disable2FA(userID)
}

// CreateAdmin creates a new admin user (super admin only)
func (s *AdminService) CreateAdmin(email, pwd, firstName, lastName string, createdBy uuid.UUID) (*domain.User, error) {
	// Validate email domain
	if s.config.AdminEmailDomain != "" && !strings.HasSuffix(email, s.config.AdminEmailDomain) {
		return nil, fmt.Errorf("invalid admin email domain")
	}

	// Check if email exists
	exists, err := s.userRepo.EmailExists(email)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, domain.ErrEmailAlreadyExists
	}

	// Validate password strength
	if !password.ValidatePasswordStrength(pwd) {
		return nil, domain.ErrWeakPassword
	}

	// Hash password
	hashedPassword, err := password.HashPassword(pwd, s.config.BcryptCost)
	if err != nil {
		return nil, err
	}

	// Create admin user
	admin := &domain.User{
		ID:            uuid.New(),
		Email:         email,
		Password:      hashedPassword,
		FirstName:     firstName,
		LastName:      lastName,
		Role:          domain.RoleAdmin,
		Status:        domain.StatusActive,
		AuthProvider:  domain.AuthProviderEmail,
		EmailVerified: true, // Admins are pre-verified
	}

	if err := s.userRepo.Create(admin); err != nil {
		return nil, err
	}

	return admin, nil
}

// GetAllUsers retrieves all users with pagination and filters
func (s *AdminService) GetAllUsers(filters map[string]interface{}, page, perPage int) ([]domain.User, int64, error) {
	return s.userRepo.List(filters, page, perPage)
}

// GetUserDetails retrieves detailed user information
func (s *AdminService) GetUserDetails(userID uuid.UUID) (*domain.User, *domain.UserProfile, error) {
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, nil, err
	}

	profile, err := s.profileRepo.GetByUserID(userID)
	if err != nil && err != gorm.ErrRecordNotFound {
		return nil, nil, err
	}

	return user, profile, nil
}

// GetLoginHistory retrieves login history for a user
func (s *AdminService) GetLoginHistory(userID uuid.UUID, limit int) ([]domain.LoginHistory, error) {
	return s.loginHistoryRepo.GetByUserID(userID, limit)
}

// RevokeSessions revokes all active sessions for a user
func (s *AdminService) RevokeSessions(userID uuid.UUID) error {
	return s.tokenRepo.RevokeAllUserTokens(userID)
}

// GetSecurityEvents retrieves recent security events
func (s *AdminService) GetSecurityEvents(since time.Time, limit int) ([]domain.LoginHistory, error) {
	return s.loginHistoryRepo.GetSecurityEvents(since, limit)
}

// GetLoginStats retrieves login statistics
func (s *AdminService) GetLoginStats(since time.Time) (map[string]int64, error) {
	return s.loginHistoryRepo.GetLoginStats(since)
}

// Helper methods

func (s *AdminService) logAdminLogin(userID uuid.UUID, email, ipAddress, userAgent string) {
	history := &domain.LoginHistory{
		ID:        uuid.New(),
		UserID:    &userID,
		Email:     email,
		Status:    domain.LoginStatusSuccess,
		IPAddress: &ipAddress,
		UserAgent: &userAgent,
	}
	s.loginHistoryRepo.Create(history)
}

func (s *AdminService) sendAdminLoginAlert(user *domain.User, ipAddress string) {
	emailData := email.EmailData{
		Name:         user.FirstName + " " + user.LastName,
		Email:        user.Email,
		LoginIP:      ipAddress,
		LoginTime:    time.Now().Format("January 2, 2006 at 3:04 PM"),
		CompanyName:  s.config.CompanyName,
		SupportEmail: s.config.SupportEmail,
		Year:         time.Now().Year(),
	}
	s.emailService.SendAdminLoginAlert(emailData)
}

// UpdateAdminProfile updates admin user's profile information
func (s *AdminService) UpdateAdminProfile(userID uuid.UUID, firstName, lastName, phone string) (*domain.User, error) {
	// Get user
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, domain.ErrUserNotFound
	}

	// Verify admin role
	if user.Role != domain.RoleAdmin {
		return nil, domain.ErrForbidden
	}

	// Update fields
	if firstName != "" {
		user.FirstName = firstName
	}
	if lastName != "" {
		user.LastName = lastName
	}

	// Save user
	if err := s.userRepo.Update(user); err != nil {
		return nil, err
	}

	// Update profile phone if exists
	if phone != "" {
		profile, err := s.profileRepo.GetByUserID(userID)
		if err == nil && profile != nil {
			profile.Phone = &phone
			s.profileRepo.Update(profile)
		}
	}

	return user, nil
}

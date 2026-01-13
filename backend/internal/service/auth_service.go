package service

import (
	"fmt"
	"job-platform/internal/domain"
	"job-platform/internal/repository"
	"job-platform/internal/util/email"
	"job-platform/internal/util/password"
	"job-platform/internal/util/token"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AuthService handles authentication business logic
type AuthService struct {
	userRepo         *repository.UserRepository
	tokenRepo        *repository.TokenRepository
	profileRepo      *repository.ProfileRepository
	loginHistoryRepo *repository.LoginHistoryRepository
	passwordHistRepo *repository.PasswordHistoryRepository
	tokenService     *TokenService
	emailService email.EmailSender
	db               *gorm.DB
	config           *AuthConfig
}

// AuthConfig holds auth configuration
type AuthConfig struct {
	BcryptCost              int
	MaxLoginAttempts        int
	AccountLockDuration     time.Duration
	EmailVerificationExpiry time.Duration
	PasswordResetExpiry     time.Duration
	PasswordMinLength       int
	EmailVerificationURL    string
	PasswordResetURL        string
	FrontendURL             string
	CompanyName             string
	SupportEmail            string
}

// NewAuthService creates a new auth service
func NewAuthService(
	userRepo *repository.UserRepository,
	tokenRepo *repository.TokenRepository,
	profileRepo *repository.ProfileRepository,
	loginHistoryRepo *repository.LoginHistoryRepository,
	passwordHistRepo *repository.PasswordHistoryRepository,
	tokenService *TokenService,
	emailService email.EmailSender,
	db *gorm.DB,
	config *AuthConfig,
) *AuthService {
	return &AuthService{
		userRepo:         userRepo,
		tokenRepo:        tokenRepo,
		profileRepo:      profileRepo,
		loginHistoryRepo: loginHistoryRepo,
		passwordHistRepo: passwordHistRepo,
		tokenService:     tokenService,
		emailService:     emailService,
		db:               db,
		config:           config,
	}
}

// RegisterRequest represents registration data
type RegisterRequest struct {
	Email     string
	Password  string
	FirstName string
	LastName  string
	Role      domain.UserRole
}

// Register registers a new user
func (s *AuthService) Register(req RegisterRequest) (*domain.User, error) {
	// Validate password strength
	if !password.ValidatePasswordStrength(req.Password) {
		return nil, domain.ErrWeakPassword
	}

	// Check if email exists
	exists, err := s.userRepo.EmailExists(req.Email)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, domain.ErrEmailAlreadyExists
	}

	// Hash password
	hashedPassword, err := password.HashPassword(req.Password, s.config.BcryptCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Start transaction
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Create user
	user := &domain.User{
		ID:           uuid.New(),
		Email:        req.Email,
		Password:     hashedPassword,
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		Role:         req.Role,
		Status:       domain.StatusActive,
		AuthProvider: domain.AuthProviderEmail,
	}

	userRepoTx := repository.NewUserRepository(tx)
	if err := userRepoTx.Create(user); err != nil {
		tx.Rollback()
		return nil, err
	}

	// Create user profile
	profile := &domain.UserProfile{
		ID:     uuid.New(),
		UserID: user.ID,
	}

	profileRepoTx := repository.NewProfileRepository(tx)
	if err := profileRepoTx.Create(profile); err != nil {
		tx.Rollback()
		return nil, err
	}

	// Create password history
	passwordHistory := &domain.PasswordHistory{
		ID:           uuid.New(),
		UserID:       user.ID,
		PasswordHash: hashedPassword,
	}

	passwordHistRepoTx := repository.NewPasswordHistoryRepository(tx)
	if err := passwordHistRepoTx.Create(passwordHistory); err != nil {
		tx.Rollback()
		return nil, err
	}

	// Generate verification token
	verificationToken, err := token.GenerateSecureToken(32)
	if err != nil {
		tx.Rollback()
		return nil, err
	}

	emailToken := &domain.EmailVerificationToken{
		ID:        uuid.New(),
		UserID:    user.ID,
		Token:     verificationToken,
		ExpiresAt: time.Now().Add(s.config.EmailVerificationExpiry),
	}

	tokenRepoTx := repository.NewTokenRepository(tx)
	if err := tokenRepoTx.CreateEmailVerificationToken(emailToken); err != nil {
		tx.Rollback()
		return nil, err
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return nil, err
	}

	// Send verification email (async - don't fail registration if email fails)
	go s.sendVerificationEmail(user, verificationToken)

	return user, nil
}

// Login authenticates a user
func (s *AuthService) Login(email, pwd, ipAddress, userAgent string) (*domain.User, string, string, error) {
	// Get user by email
	user, err := s.userRepo.GetByEmail(email)
	if err != nil {
		// Log failed attempt even if user doesn't exist
		s.logLoginAttempt(nil, email, domain.LoginStatusFailed, ipAddress, userAgent, "Invalid credentials")
		return nil, "", "", domain.ErrInvalidCredentials
	}

	// Check if account is locked
	if user.LockedUntil != nil && user.LockedUntil.After(time.Now()) {
		s.logLoginAttempt(&user.ID, email, domain.LoginStatusLocked, ipAddress, userAgent, "Account locked")
		return nil, "", "", domain.ErrAccountLocked
	}

	// Check if account is suspended
	if user.Status == domain.StatusSuspended {
		s.logLoginAttempt(&user.ID, email, domain.LoginStatusFailed, ipAddress, userAgent, "Account suspended")
		return nil, "", "", domain.ErrAccountSuspended
	}

	// Check if email is verified
	if !user.EmailVerified {
		s.logLoginAttempt(&user.ID, email, domain.LoginStatusFailed, ipAddress, userAgent, "Email not verified")
		return nil, "", "", domain.ErrEmailNotVerified
	}

	// Verify password
	if err := password.ComparePassword(user.Password, pwd); err != nil {
		// Increment failed attempts
		s.userRepo.IncrementFailedAttempts(user.ID)
		user.FailedLoginAttempts++

		// Lock account if max attempts reached
		if user.FailedLoginAttempts >= s.config.MaxLoginAttempts {
			lockUntil := time.Now().Add(s.config.AccountLockDuration)
			s.userRepo.LockAccount(user.ID, lockUntil)
			s.logLoginAttempt(&user.ID, email, domain.LoginStatusLocked, ipAddress, userAgent, "Max attempts reached")

			// Send account locked email
			go s.sendAccountLockedEmail(user, ipAddress)

			return nil, "", "", domain.ErrAccountLocked
		}

		s.logLoginAttempt(&user.ID, email, domain.LoginStatusFailed, ipAddress, userAgent, "Invalid password")
		return nil, "", "", domain.ErrInvalidCredentials
	}

	// Reset failed attempts
	s.userRepo.ResetFailedAttempts(user.ID)

	// Update last login
	s.userRepo.UpdateLastLogin(user.ID, ipAddress)

	// Generate tokens
	accessToken, err := s.tokenService.GenerateAccessToken(user)
	if err != nil {
		return nil, "", "", err
	}

	refreshToken, err := s.tokenService.GenerateRefreshToken(user, ipAddress, userAgent)
	if err != nil {
		return nil, "", "", err
	}

	// Log successful login
	s.logLoginAttempt(&user.ID, email, domain.LoginStatusSuccess, ipAddress, userAgent, "")

	return user, accessToken, refreshToken, nil
}

// VerifyEmail verifies user email with token
func (s *AuthService) VerifyEmail(tokenStr string) error {
	// Get token
	emailToken, err := s.tokenRepo.GetEmailVerificationToken(tokenStr)
	if err != nil {
		return domain.ErrInvalidToken
	}

	// Check if expired
	if emailToken.ExpiresAt.Before(time.Now()) {
		return domain.ErrTokenExpired
	}

	// Check if already used
	if emailToken.Used {
		return domain.ErrTokenAlreadyUsed
	}

	// Verify email
	if err := s.userRepo.VerifyEmail(emailToken.UserID); err != nil {
		return err
	}

	// Mark token as used
	if err := s.tokenRepo.MarkEmailTokenAsUsed(tokenStr); err != nil {
		return err
	}

	// Send welcome email
	go s.sendWelcomeEmail(&emailToken.User)

	return nil
}

// ResendVerification resends verification email
func (s *AuthService) ResendVerification(userID uuid.UUID) error {
	// Get user
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return domain.ErrUserNotFound
	}

	// Check if already verified
	if user.EmailVerified {
		return fmt.Errorf("email already verified")
	}

	// Check rate limiting (max 3 per hour)
	since := time.Now().Add(-1 * time.Hour)
	count, err := s.tokenRepo.CountRecentEmailTokens(userID, since)
	if err != nil {
		return err
	}
	if count >= 3 {
		return domain.ErrTooManyAttempts
	}

	// Generate new token
	verificationToken, err := token.GenerateSecureToken(32)
	if err != nil {
		return err
	}

	emailToken := &domain.EmailVerificationToken{
		ID:        uuid.New(),
		UserID:    user.ID,
		Token:     verificationToken,
		ExpiresAt: time.Now().Add(s.config.EmailVerificationExpiry),
	}

	if err := s.tokenRepo.CreateEmailVerificationToken(emailToken); err != nil {
		return err
	}

	// Send email
	go s.sendVerificationEmail(user, verificationToken)

	return nil
}

// ResendVerificationByEmail resends verification email by email address (for unauthenticated users)
func (s *AuthService) ResendVerificationByEmail(email string) error {
	// Get user by email
	user, err := s.userRepo.GetByEmail(email)
	if err != nil {
		// Don't reveal if email exists
		return nil
	}

	// Check if already verified
	if user.EmailVerified {
		// Don't reveal verification status
		return nil
	}

	// Check rate limiting (max 3 per hour)
	since := time.Now().Add(-1 * time.Hour)
	count, err := s.tokenRepo.CountRecentEmailTokens(user.ID, since)
	if err != nil {
		return err
	}
	if count >= 3 {
		return domain.ErrTooManyAttempts
	}

	// Generate new token
	verificationToken, err := token.GenerateSecureToken(32)
	if err != nil {
		return err
	}

	emailToken := &domain.EmailVerificationToken{
		ID:        uuid.New(),
		UserID:    user.ID,
		Token:     verificationToken,
		ExpiresAt: time.Now().Add(s.config.EmailVerificationExpiry),
	}

	if err := s.tokenRepo.CreateEmailVerificationToken(emailToken); err != nil {
		return err
	}

	// Send email
	go s.sendVerificationEmail(user, verificationToken)

	return nil
}

// ForgotPassword initiates password reset
func (s *AuthService) ForgotPassword(email string) error {
	// Get user
	user, err := s.userRepo.GetByEmail(email)
	if err != nil {
		// Don't reveal if email exists
		return nil
	}

	// Generate reset token
	resetToken, err := token.GenerateSecureToken(32)
	if err != nil {
		return err
	}

	passwordToken := &domain.PasswordResetToken{
		ID:        uuid.New(),
		UserID:    user.ID,
		Token:     resetToken,
		ExpiresAt: time.Now().Add(s.config.PasswordResetExpiry),
	}

	if err := s.tokenRepo.CreatePasswordResetToken(passwordToken); err != nil {
		return err
	}

	// Send reset email
	go s.sendPasswordResetEmail(user, resetToken)

	return nil
}

// ResetPassword resets password with token
func (s *AuthService) ResetPassword(tokenStr, newPassword string) error {
	// Validate password strength
	if !password.ValidatePasswordStrength(newPassword) {
		return domain.ErrWeakPassword
	}

	// Get token
	resetToken, err := s.tokenRepo.GetPasswordResetToken(tokenStr)
	if err != nil {
		return domain.ErrInvalidToken
	}

	// Check if expired
	if resetToken.ExpiresAt.Before(time.Now()) {
		return domain.ErrTokenExpired
	}

	// Check if already used
	if resetToken.Used {
		return domain.ErrTokenAlreadyUsed
	}

	// Check password history (prevent reuse of last 3 passwords)
	recentPasswords, err := s.passwordHistRepo.GetRecentPasswords(resetToken.UserID, 3)
	if err != nil {
		return err
	}

	for _, hist := range recentPasswords {
		if password.ComparePassword(hist.PasswordHash, newPassword) == nil {
			return domain.ErrPasswordReuse
		}
	}

	// Hash new password
	hashedPassword, err := password.HashPassword(newPassword, s.config.BcryptCost)
	if err != nil {
		return err
	}

	// Start transaction
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Update password
	userRepoTx := repository.NewUserRepository(tx)
	if err := userRepoTx.UpdatePassword(resetToken.UserID, hashedPassword); err != nil {
		tx.Rollback()
		return err
	}

	// Add to password history
	passwordHistory := &domain.PasswordHistory{
		ID:           uuid.New(),
		UserID:       resetToken.UserID,
		PasswordHash: hashedPassword,
	}

	passwordHistRepoTx := repository.NewPasswordHistoryRepository(tx)
	if err := passwordHistRepoTx.Create(passwordHistory); err != nil {
		tx.Rollback()
		return err
	}

	// Mark token as used
	tokenRepoTx := repository.NewTokenRepository(tx)
	if err := tokenRepoTx.MarkPasswordTokenAsUsed(tokenStr); err != nil {
		tx.Rollback()
		return err
	}

	// Invalidate all other reset tokens
	if err := tokenRepoTx.InvalidateAllPasswordTokens(resetToken.UserID); err != nil {
		tx.Rollback()
		return err
	}

	// Revoke all refresh tokens (force re-login)
	if err := tokenRepoTx.RevokeAllUserTokens(resetToken.UserID); err != nil {
		tx.Rollback()
		return err
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return err
	}

	// Send confirmation email
	go s.sendPasswordChangedEmail(&resetToken.User)

	return nil
}

// ChangePassword changes user password (requires old password)
func (s *AuthService) ChangePassword(userID uuid.UUID, oldPassword, newPassword string) error {
	// Validate new password strength
	if !password.ValidatePasswordStrength(newPassword) {
		return domain.ErrWeakPassword
	}

	// Get user
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return domain.ErrUserNotFound
	}

	// Verify old password
	if err := password.ComparePassword(user.Password, oldPassword); err != nil {
		return domain.ErrInvalidCredentials
	}

	// Check password history
	recentPasswords, err := s.passwordHistRepo.GetRecentPasswords(userID, 3)
	if err != nil {
		return err
	}

	for _, hist := range recentPasswords {
		if password.ComparePassword(hist.PasswordHash, newPassword) == nil {
			return domain.ErrPasswordReuse
		}
	}

	// Hash new password
	hashedPassword, err := password.HashPassword(newPassword, s.config.BcryptCost)
	if err != nil {
		return err
	}

	// Start transaction
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Update password
	userRepoTx := repository.NewUserRepository(tx)
	if err := userRepoTx.UpdatePassword(userID, hashedPassword); err != nil {
		tx.Rollback()
		return err
	}

	// Add to password history
	passwordHistory := &domain.PasswordHistory{
		ID:           uuid.New(),
		UserID:       userID,
		PasswordHash: hashedPassword,
	}

	passwordHistRepoTx := repository.NewPasswordHistoryRepository(tx)
	if err := passwordHistRepoTx.Create(passwordHistory); err != nil {
		tx.Rollback()
		return err
	}

	// Clean old password history (keep only last 3)
	if err := passwordHistRepoTx.DeleteOldPasswords(userID, 3); err != nil {
		tx.Rollback()
		return err
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return err
	}

	// Send confirmation email
	go s.sendPasswordChangedEmail(user)

	return nil
}

// SetPassword sets a password for users who signed up via OAuth (Google)
// This allows OAuth users to also login with email/password
func (s *AuthService) SetPassword(userID uuid.UUID, newPassword string) error {
	// Validate new password strength
	if !password.ValidatePasswordStrength(newPassword) {
		return domain.ErrWeakPassword
	}

	// Get user
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return domain.ErrUserNotFound
	}

	// Only allow setting password for OAuth users who don't have a password yet
	if user.AuthProvider != domain.AuthProviderGoogle {
		return domain.ErrInvalidCredentials // Use existing error - user should use change password instead
	}

	// Check if user already has a password set
	if user.Password != "" {
		return domain.ErrInvalidCredentials // User should use change password
	}

	// Hash new password
	hashedPassword, err := password.HashPassword(newPassword, s.config.BcryptCost)
	if err != nil {
		return err
	}

	// Start transaction
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Update password
	userRepoTx := repository.NewUserRepository(tx)
	if err := userRepoTx.UpdatePassword(userID, hashedPassword); err != nil {
		tx.Rollback()
		return err
	}

	// Add to password history
	passwordHistory := &domain.PasswordHistory{
		ID:           uuid.New(),
		UserID:       userID,
		PasswordHash: hashedPassword,
	}

	passwordHistRepoTx := repository.NewPasswordHistoryRepository(tx)
	if err := passwordHistRepoTx.Create(passwordHistory); err != nil {
		tx.Rollback()
		return err
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return err
	}

	// Send confirmation email
	go s.sendPasswordChangedEmail(user)

	return nil
}

// Logout logs out user by revoking refresh token
func (s *AuthService) Logout(refreshToken string) error {
	return s.tokenService.RevokeRefreshToken(refreshToken)
}

// RefreshToken generates a new access token using a refresh token
func (s *AuthService) RefreshToken(refreshTokenStr string) (string, error) {
	// Validate and get user ID from refresh token
	userID, err := s.tokenService.GetUserIDFromRefreshToken(refreshTokenStr)
	if err != nil {
		return "", err
	}

	// Get user
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return "", domain.ErrUserNotFound
	}

	// Check if account is suspended
	if user.Status == domain.StatusSuspended {
		return "", domain.ErrAccountSuspended
	}

	// Generate new access token
	return s.tokenService.RefreshAccessToken(refreshTokenStr, user)
}

// Helper methods

func (s *AuthService) logLoginAttempt(userID *uuid.UUID, email string, status domain.LoginStatus, ip, userAgent, reason string) {
	history := &domain.LoginHistory{
		ID:            uuid.New(),
		UserID:        userID,
		Email:         email,
		Status:        status,
		IPAddress:     &ip,
		UserAgent:     &userAgent,
		FailureReason: nil,
	}

	if reason != "" {
		history.FailureReason = &reason
	}

	s.loginHistoryRepo.Create(history)
}

func (s *AuthService) sendVerificationEmail(user *domain.User, token string) {
	emailData := email.EmailData{
		Name:            user.FirstName + " " + user.LastName,
		Email:           user.Email,
		Token:           token,
		VerificationURL: s.config.EmailVerificationURL,
		CompanyName:     s.config.CompanyName,
		SupportEmail:    s.config.SupportEmail,
		Year:            time.Now().Year(),
	}
	if err := s.emailService.SendVerificationEmail(emailData); err != nil {
		fmt.Printf("Failed to send verification email to %s: %v\n", user.Email, err)
	} else {
		fmt.Printf("Verification email sent successfully to %s\n", user.Email)
	}
}

func (s *AuthService) sendWelcomeEmail(user *domain.User) {
	emailData := email.EmailData{
		Name:         user.FirstName + " " + user.LastName,
		Email:        user.Email,
		CompanyName:  s.config.CompanyName,
		SupportEmail: s.config.SupportEmail,
		Year:         time.Now().Year(),
	}
	s.emailService.SendWelcomeEmail(emailData)
}

func (s *AuthService) sendPasswordResetEmail(user *domain.User, token string) {
	emailData := email.EmailData{
		Name:         user.FirstName + " " + user.LastName,
		Email:        user.Email,
		Token:        token,
		ResetURL:     s.config.PasswordResetURL,
		CompanyName:  s.config.CompanyName,
		SupportEmail: s.config.SupportEmail,
		Year:         time.Now().Year(),
	}
	s.emailService.SendPasswordResetEmail(emailData)
}

func (s *AuthService) sendPasswordChangedEmail(user *domain.User) {
	emailData := email.EmailData{
		Name:         user.FirstName + " " + user.LastName,
		Email:        user.Email,
		LoginTime:    time.Now().Format("January 2, 2006 at 3:04 PM"),
		CompanyName:  s.config.CompanyName,
		SupportEmail: s.config.SupportEmail,
		Year:         time.Now().Year(),
	}
	s.emailService.SendPasswordChangedEmail(emailData)
}

func (s *AuthService) sendAccountLockedEmail(user *domain.User, ip string) {
	emailData := email.EmailData{
		Name:         user.FirstName + " " + user.LastName,
		Email:        user.Email,
		LoginIP:      ip,
		LoginTime:    time.Now().Format("January 2, 2006 at 3:04 PM"),
		CompanyName:  s.config.CompanyName,
		SupportEmail: s.config.SupportEmail,
		Year:         time.Now().Year(),
	}
	s.emailService.SendAccountLockedEmail(emailData)
}

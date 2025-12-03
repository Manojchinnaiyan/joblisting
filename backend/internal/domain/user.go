package domain

import (
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

// UserRole represents the role of a user in the system
type UserRole string

const (
	RoleJobSeeker UserRole = "JOB_SEEKER"
	RoleEmployer  UserRole = "EMPLOYER"
	RoleAdmin     UserRole = "ADMIN"
)

// UserStatus represents the status of a user account
type UserStatus string

const (
	StatusActive    UserStatus = "ACTIVE"
	StatusSuspended UserStatus = "SUSPENDED"
	StatusDeleted   UserStatus = "DELETED"
)

// AuthProvider represents the authentication provider
type AuthProvider string

const (
	AuthProviderEmail  AuthProvider = "EMAIL"
	AuthProviderGoogle AuthProvider = "GOOGLE"
)

// LoginStatus represents the status of a login attempt
type LoginStatus string

const (
	LoginStatusSuccess LoginStatus = "SUCCESS"
	LoginStatusFailed  LoginStatus = "FAILED"
	LoginStatusLocked  LoginStatus = "LOCKED"
)

// User represents a user in the system
type User struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Email     string    `gorm:"uniqueIndex;not null" json:"email"`
	Password  string    `gorm:"not null" json:"-"` // Hashed password - never expose
	FirstName string    `gorm:"not null" json:"first_name"`
	LastName  string    `gorm:"not null" json:"last_name"`

	Role         UserRole     `gorm:"type:varchar(20);not null;default:'JOB_SEEKER'" json:"role"`
	Status       UserStatus   `gorm:"type:varchar(20);not null;default:'ACTIVE'" json:"status"`
	AuthProvider AuthProvider `gorm:"type:varchar(20);not null;default:'EMAIL'" json:"auth_provider"`

	GoogleID *string `gorm:"uniqueIndex" json:"-"`

	EmailVerified   bool       `gorm:"default:false" json:"email_verified"`
	EmailVerifiedAt *time.Time `json:"email_verified_at,omitempty"`

	TwoFactorEnabled bool    `json:"is_2fa_enabled"`
	TwoFactorSecret  *string `json:"-"` // Never expose secret

	FailedLoginAttempts int        `json:"failed_login_attempts"`
	LockedUntil         *time.Time `json:"locked_until,omitempty"`

	LastLoginAt *time.Time `json:"last_login_at,omitempty"`
	LastLoginIP *string    `json:"-"` // Privacy - don't expose IP

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Associations
	Profile *UserProfile `gorm:"foreignKey:UserID" json:"profile,omitempty"`
}

// TableName specifies the table name for User model
func (User) TableName() string {
	return "users"
}

// EmailVerificationToken represents a token for email verification
type EmailVerificationToken struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index"`
	User      User      `gorm:"foreignKey:UserID"`
	Token     string    `gorm:"uniqueIndex;not null"`
	ExpiresAt time.Time `gorm:"not null"`
	Used      bool      `gorm:"default:false"`
	UsedAt    *time.Time
	CreatedAt time.Time
}

// TableName specifies the table name
func (EmailVerificationToken) TableName() string {
	return "email_verification_tokens"
}

// PasswordResetToken represents a token for password reset
type PasswordResetToken struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index"`
	User      User      `gorm:"foreignKey:UserID"`
	Token     string    `gorm:"uniqueIndex;not null"`
	ExpiresAt time.Time `gorm:"not null"`
	Used      bool      `gorm:"default:false"`
	UsedAt    *time.Time
	CreatedAt time.Time
}

// TableName specifies the table name
func (PasswordResetToken) TableName() string {
	return "password_reset_tokens"
}

// RefreshToken represents a refresh token for JWT authentication
type RefreshToken struct {
	ID         uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID     uuid.UUID `gorm:"type:uuid;not null;index"`
	User       User      `gorm:"foreignKey:UserID"`
	TokenHash  string    `gorm:"uniqueIndex;not null"`
	ExpiresAt  time.Time `gorm:"not null"`
	DeviceInfo *string
	IPAddress  *string
	UserAgent  *string
	Revoked    bool `gorm:"default:false"`
	RevokedAt  *time.Time
	CreatedAt  time.Time
}

// TableName specifies the table name
func (RefreshToken) TableName() string {
	return "refresh_tokens"
}

// PasswordHistory stores password history to prevent reuse
type PasswordHistory struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID       uuid.UUID `gorm:"type:uuid;not null;index"`
	User         User      `gorm:"foreignKey:UserID"`
	PasswordHash string    `gorm:"not null"`
	CreatedAt    time.Time
}

// TableName specifies the table name
func (PasswordHistory) TableName() string {
	return "password_history"
}

// LoginHistory tracks login attempts and history
type LoginHistory struct {
	ID            uuid.UUID   `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID        *uuid.UUID  `gorm:"type:uuid;index"`
	User          *User       `gorm:"foreignKey:UserID"`
	Email         string      `gorm:"not null"`
	Status        LoginStatus `gorm:"type:varchar(20);not null"`
	IPAddress     *string
	UserAgent     *string
	FailureReason *string
	CreatedAt     time.Time
}

// TableName specifies the table name
func (LoginHistory) TableName() string {
	return "login_history"
}

// ProfileVisibility represents profile visibility settings
type ProfileVisibility string

const (
	VisibilityPublic        ProfileVisibility = "PUBLIC"
	VisibilityEmployersOnly ProfileVisibility = "EMPLOYERS_ONLY"
	VisibilityPrivate       ProfileVisibility = "PRIVATE"
	VisibilityAppliedOnly   ProfileVisibility = "APPLIED_ONLY"
)

// UserProfile stores comprehensive job seeker profile information
type UserProfile struct {
	ID     uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	UserID uuid.UUID `gorm:"type:uuid;uniqueIndex;not null" json:"user_id"`
	User   *User     `gorm:"foreignKey:UserID" json:"-"`

	// Basic Information
	Headline  *string `gorm:"type:varchar(255)" json:"headline,omitempty"`
	Bio       *string `gorm:"type:text" json:"bio,omitempty"`
	AvatarURL *string `gorm:"type:varchar(500)" json:"avatar_url,omitempty"`
	Phone     *string `gorm:"type:varchar(20)" json:"phone,omitempty"`

	// Date of Birth
	DateOfBirth *time.Time `gorm:"type:date" json:"date_of_birth,omitempty"`

	// Location Information
	City       *string `gorm:"type:varchar(100)" json:"city,omitempty"`
	State      *string `gorm:"type:varchar(100)" json:"state,omitempty"`
	Country    *string `gorm:"type:varchar(100)" json:"country,omitempty"`
	PostalCode *string `gorm:"type:varchar(20)" json:"postal_code,omitempty"`

	// Career Information
	WillingToRelocate    bool     `gorm:"default:false" json:"willing_to_relocate"`
	CurrentTitle         *string  `gorm:"type:varchar(255)" json:"current_title,omitempty"`
	CurrentCompany       *string  `gorm:"type:varchar(255)" json:"current_company,omitempty"`
	TotalExperienceYears *float32 `gorm:"type:decimal(5,2)" json:"total_experience_years,omitempty"`

	// Salary Expectations
	ExpectedSalaryMin      *int    `gorm:"type:integer" json:"expected_salary_min,omitempty"`
	ExpectedSalaryMax      *int    `gorm:"type:integer" json:"expected_salary_max,omitempty"`
	ExpectedSalaryCurrency *string `gorm:"type:varchar(3);default:'USD'" json:"expected_salary_currency,omitempty"`

	// Availability
	NoticePeriodDays        *int           `gorm:"type:integer" json:"notice_period_days,omitempty"`
	AvailableFrom           *time.Time     `gorm:"type:date" json:"available_from,omitempty"`
	OpenToOpportunities     bool           `gorm:"default:true" json:"open_to_opportunities"`
	PreferredJobTypes       pq.StringArray `gorm:"type:text[]" json:"preferred_job_types,omitempty"`
	PreferredWorkplaceTypes pq.StringArray `gorm:"type:text[]" json:"preferred_workplace_types,omitempty"`

	// Social Links
	LinkedInURL  *string `gorm:"column:linkedin_url;type:varchar(500)" json:"linkedin_url,omitempty"`
	GithubURL    *string `gorm:"column:github_url;type:varchar(500)" json:"github_url,omitempty"`
	PortfolioURL *string `gorm:"column:portfolio_url;type:varchar(500)" json:"portfolio_url,omitempty"`
	WebsiteURL   *string `gorm:"column:website_url;type:varchar(500)" json:"website_url,omitempty"`

	// Profile Metrics
	CompletenessScore int               `gorm:"type:integer;default:0;check:completeness_score >= 0 AND completeness_score <= 100" json:"completeness_score"`
	Visibility        ProfileVisibility `gorm:"type:profile_visibility;default:'EMPLOYERS_ONLY'" json:"visibility"`
	LastActive        *time.Time        `gorm:"type:timestamp" json:"last_active,omitempty"`
	ProfileViews      int               `gorm:"type:integer;default:0" json:"profile_views"`

	// Privacy Settings
	ShowEmail bool `gorm:"default:false" json:"show_email"`
	ShowPhone bool `gorm:"default:false" json:"show_phone"`

	CreatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"updated_at"`
}

// TableName specifies the table name
func (UserProfile) TableName() string {
	return "user_profiles"
}

// IsComplete checks if profile completeness is >= 80%
func (p *UserProfile) IsComplete() bool {
	return p.CompletenessScore >= 80
}

// HasLocation checks if user has set location
func (p *UserProfile) HasLocation() bool {
	return p.City != nil || p.Country != nil
}

// HasSocialLinks checks if user has any social links
func (p *UserProfile) HasSocialLinks() bool {
	return p.LinkedInURL != nil || p.GithubURL != nil ||
		p.PortfolioURL != nil || p.WebsiteURL != nil
}

// CanViewProfile checks if viewer can view this profile based on visibility settings
func (p *UserProfile) CanViewProfile(viewerID *uuid.UUID, viewerRole string, hasApplied bool) bool {
	switch p.Visibility {
	case VisibilityPublic:
		return true
	case VisibilityEmployersOnly:
		return viewerRole == string(RoleEmployer) || viewerRole == string(RoleAdmin)
	case VisibilityPrivate:
		return viewerID != nil && *viewerID == p.UserID
	case VisibilityAppliedOnly:
		return hasApplied || (viewerID != nil && *viewerID == p.UserID)
	default:
		return false
	}
}

// IsPubliclyVisible checks if profile is publicly visible
func (p *UserProfile) IsPubliclyVisible() bool {
	return p.Visibility == VisibilityPublic
}

// Validate validates profile data
func (p *UserProfile) Validate() error {
	if p.UserID == uuid.Nil {
		return ErrInvalidInput
	}

	// Validate completeness score
	if p.CompletenessScore < 0 || p.CompletenessScore > 100 {
		return ErrInvalidProfileCompleteness
	}

	// Validate visibility
	validVisibility := map[ProfileVisibility]bool{
		VisibilityPublic:        true,
		VisibilityEmployersOnly: true,
		VisibilityPrivate:       true,
		VisibilityAppliedOnly:   true,
	}
	if !validVisibility[p.Visibility] {
		return ErrInvalidProfileVisibility
	}

	// Validate salary range
	if p.ExpectedSalaryMin != nil && p.ExpectedSalaryMax != nil {
		if *p.ExpectedSalaryMin > *p.ExpectedSalaryMax {
			return ErrInvalidSalaryRange
		}
	}

	return nil
}

// AdminSetting represents CMS settings for admin
type AdminSetting struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Key         string    `gorm:"uniqueIndex;not null"`
	Value       string    `gorm:"type:jsonb"`
	Description *string
	UpdatedBy   *uuid.UUID `gorm:"type:uuid"`
	UpdatedUser *User      `gorm:"foreignKey:UpdatedBy"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

// TableName specifies the table name
func (AdminSetting) TableName() string {
	return "admin_settings"
}

// ParseUUID is a helper to parse UUID strings
func ParseUUID(s string) (uuid.UUID, error) {
	return uuid.Parse(s)
}

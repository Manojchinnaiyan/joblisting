package validator

import (
	"fmt"
	"regexp"
	"strings"
	"unicode"
)

var (
	// Email regex pattern
	emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

	// Phone number regex (international format)
	phoneRegex = regexp.MustCompile(`^\+?[1-9]\d{1,14}$`)

	// URL regex
	urlRegex = regexp.MustCompile(`^https?://[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]+$`)

	// Admin email domains
	adminEmailDomains = []string{"admin.jobplatform.com"}
)

// ValidationError represents a validation error
type ValidationError struct {
	Field   string
	Message string
}

func (e *ValidationError) Error() string {
	return fmt.Sprintf("%s: %s", e.Field, e.Message)
}

// NewValidationError creates a new validation error
func NewValidationError(field, message string) *ValidationError {
	return &ValidationError{
		Field:   field,
		Message: message,
	}
}

// ValidateEmail validates email format
func ValidateEmail(email string) error {
	if email == "" {
		return NewValidationError("email", "email is required")
	}

	if !emailRegex.MatchString(email) {
		return NewValidationError("email", "invalid email format")
	}

	return nil
}

// ValidateAdminEmail validates admin email domain
func ValidateAdminEmail(email string) error {
	if err := ValidateEmail(email); err != nil {
		return err
	}

	for _, domain := range adminEmailDomains {
		if strings.HasSuffix(email, "@"+domain) {
			return nil
		}
	}

	return NewValidationError("email", fmt.Sprintf("admin email must be from allowed domains: %s", strings.Join(adminEmailDomains, ", ")))
}

// ValidatePassword validates password strength
func ValidatePassword(password string) error {
	if password == "" {
		return NewValidationError("password", "password is required")
	}

	if len(password) < 8 {
		return NewValidationError("password", "password must be at least 8 characters long")
	}

	if len(password) > 128 {
		return NewValidationError("password", "password must not exceed 128 characters")
	}

	var (
		hasUpper   bool
		hasLower   bool
		hasNumber  bool
		hasSpecial bool
	)

	for _, char := range password {
		switch {
		case unicode.IsUpper(char):
			hasUpper = true
		case unicode.IsLower(char):
			hasLower = true
		case unicode.IsNumber(char):
			hasNumber = true
		case unicode.IsPunct(char) || unicode.IsSymbol(char):
			hasSpecial = true
		}
	}

	if !hasUpper {
		return NewValidationError("password", "password must contain at least one uppercase letter")
	}

	if !hasLower {
		return NewValidationError("password", "password must contain at least one lowercase letter")
	}

	if !hasNumber {
		return NewValidationError("password", "password must contain at least one number")
	}

	if !hasSpecial {
		return NewValidationError("password", "password must contain at least one special character")
	}

	return nil
}

// ValidatePhone validates phone number format
func ValidatePhone(phone string) error {
	if phone == "" {
		return nil // Phone is optional
	}

	if !phoneRegex.MatchString(phone) {
		return NewValidationError("phone", "invalid phone number format (use international format)")
	}

	return nil
}

// ValidateURL validates URL format
func ValidateURL(urlStr string) error {
	if urlStr == "" {
		return nil // URL is optional
	}

	if !urlRegex.MatchString(urlStr) {
		return NewValidationError("url", "invalid URL format")
	}

	return nil
}

// ValidateName validates first/last name
func ValidateName(name, field string) error {
	if name == "" {
		return NewValidationError(field, fmt.Sprintf("%s is required", field))
	}

	if len(name) < 2 {
		return NewValidationError(field, fmt.Sprintf("%s must be at least 2 characters", field))
	}

	if len(name) > 50 {
		return NewValidationError(field, fmt.Sprintf("%s must not exceed 50 characters", field))
	}

	// Check if name contains only letters, spaces, and hyphens
	for _, char := range name {
		if !unicode.IsLetter(char) && char != ' ' && char != '-' && char != '\'' {
			return NewValidationError(field, fmt.Sprintf("%s can only contain letters, spaces, hyphens, and apostrophes", field))
		}
	}

	return nil
}

// ValidateCompanyName validates company name
func ValidateCompanyName(name string) error {
	if name == "" {
		return NewValidationError("company_name", "company name is required")
	}

	if len(name) < 2 {
		return NewValidationError("company_name", "company name must be at least 2 characters")
	}

	if len(name) > 255 {
		return NewValidationError("company_name", "company name must not exceed 255 characters")
	}

	return nil
}

// ValidateExperienceYears validates years of experience
func ValidateExperienceYears(years int) error {
	if years < 0 {
		return NewValidationError("experience_years", "experience years cannot be negative")
	}

	if years > 70 {
		return NewValidationError("experience_years", "experience years cannot exceed 70")
	}

	return nil
}

// ValidateBio validates user bio
func ValidateBio(bio string) error {
	if bio == "" {
		return nil // Bio is optional
	}

	if len(bio) > 1000 {
		return NewValidationError("bio", "bio must not exceed 1000 characters")
	}

	return nil
}

// ValidateDescription validates company description
func ValidateDescription(description string) error {
	if description == "" {
		return nil // Description is optional
	}

	if len(description) > 5000 {
		return NewValidationError("description", "description must not exceed 5000 characters")
	}

	return nil
}

// ValidateLocation validates location
func ValidateLocation(location string) error {
	if location == "" {
		return nil // Location is optional
	}

	if len(location) > 255 {
		return NewValidationError("location", "location must not exceed 255 characters")
	}

	return nil
}

// ValidateSkills validates skills array
func ValidateSkills(skills []string) error {
	if len(skills) == 0 {
		return nil // Skills are optional
	}

	if len(skills) > 50 {
		return NewValidationError("skills", "cannot have more than 50 skills")
	}

	for i, skill := range skills {
		if skill == "" {
			return NewValidationError("skills", fmt.Sprintf("skill at index %d is empty", i))
		}

		if len(skill) > 100 {
			return NewValidationError("skills", fmt.Sprintf("skill at index %d exceeds 100 characters", i))
		}
	}

	return nil
}

// ValidateIndustry validates industry
func ValidateIndustry(industry string) error {
	if industry == "" {
		return nil // Industry is optional
	}

	if len(industry) > 100 {
		return NewValidationError("industry", "industry must not exceed 100 characters")
	}

	return nil
}

// ValidateCompanySize validates company size
func ValidateCompanySize(size string) error {
	if size == "" {
		return nil // Size is optional
	}

	validSizes := []string{
		"1-10",
		"11-50",
		"51-200",
		"201-500",
		"501-1000",
		"1001-5000",
		"5001+",
	}

	for _, validSize := range validSizes {
		if size == validSize {
			return nil
		}
	}

	return NewValidationError("size", fmt.Sprintf("invalid company size. Valid values: %s", strings.Join(validSizes, ", ")))
}

// ValidatePaginationParams validates pagination parameters
func ValidatePaginationParams(page, limit int) error {
	if page < 1 {
		return NewValidationError("page", "page must be at least 1")
	}

	if limit < 1 {
		return NewValidationError("limit", "limit must be at least 1")
	}

	if limit > 100 {
		return NewValidationError("limit", "limit cannot exceed 100")
	}

	return nil
}

// ValidateUUID validates UUID format
func ValidateUUID(id, field string) error {
	if id == "" {
		return NewValidationError(field, fmt.Sprintf("%s is required", field))
	}

	// Simple UUID v4 pattern check
	uuidPattern := regexp.MustCompile(`^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$`)
	if !uuidPattern.MatchString(strings.ToLower(id)) {
		return NewValidationError(field, fmt.Sprintf("invalid %s format", field))
	}

	return nil
}

// ValidateToken validates token format
func ValidateToken(token, field string) error {
	if token == "" {
		return NewValidationError(field, fmt.Sprintf("%s is required", field))
	}

	if len(token) < 32 {
		return NewValidationError(field, fmt.Sprintf("%s is too short", field))
	}

	if len(token) > 512 {
		return NewValidationError(field, fmt.Sprintf("%s is too long", field))
	}

	return nil
}

// ValidateTOTPCode validates TOTP code
func ValidateTOTPCode(code string) error {
	if code == "" {
		return NewValidationError("code", "2FA code is required")
	}

	if len(code) != 6 {
		return NewValidationError("code", "2FA code must be 6 digits")
	}

	// Check if all characters are digits
	for _, char := range code {
		if !unicode.IsDigit(char) {
			return NewValidationError("code", "2FA code must contain only digits")
		}
	}

	return nil
}

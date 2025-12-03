package domain

import (
	"time"

	"github.com/google/uuid"
)

// Certification represents a professional certification
type Certification struct {
	ID     uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	UserID uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`

	// Certificate Info
	Name                string `gorm:"type:varchar(255);not null" json:"name"`
	IssuingOrganization string `gorm:"type:varchar(255);not null" json:"issuing_organization"`

	// Dates
	IssueDate  time.Time  `gorm:"type:date;not null" json:"issue_date"`
	ExpiryDate *time.Time `gorm:"type:date" json:"expiry_date"`
	NoExpiry   bool       `gorm:"default:false" json:"no_expiry"`

	// Verification
	CredentialID       *string `gorm:"type:varchar(255)" json:"credential_id"`
	CredentialURL      *string `gorm:"type:varchar(500)" json:"credential_url"`
	CertificateFileURL *string `gorm:"type:text" json:"certificate_file_url"`

	// Relationships
	User *User `gorm:"foreignKey:UserID" json:"user,omitempty"`

	// Timestamps
	CreatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`
}

// TableName specifies the table name for Certification
func (Certification) TableName() string {
	return "certifications"
}

// Validate performs basic validation
func (c *Certification) Validate() error {
	if c.Name == "" {
		return ErrInvalidInput
	}
	if c.IssuingOrganization == "" {
		return ErrInvalidInput
	}
	if !c.NoExpiry && c.ExpiryDate != nil && c.ExpiryDate.Before(c.IssueDate) {
		return ErrInvalidInput
	}
	return nil
}

// IsExpired checks if certification has expired
func (c *Certification) IsExpired() bool {
	if c.NoExpiry {
		return false
	}
	if c.ExpiryDate == nil {
		return false
	}
	return c.ExpiryDate.Before(time.Now())
}

// IsActive checks if certification is currently valid
func (c *Certification) IsActive() bool {
	return !c.IsExpired()
}

// DaysUntilExpiry returns days until expiration (negative if expired)
func (c *Certification) DaysUntilExpiry() int {
	if c.NoExpiry || c.ExpiryDate == nil {
		return -1 // No expiry
	}
	duration := time.Until(*c.ExpiryDate)
	return int(duration.Hours() / 24)
}

// IsExpiringSoon checks if certification expires within given days
func (c *Certification) IsExpiringSoon(days int) bool {
	if c.NoExpiry || c.ExpiryDate == nil {
		return false
	}
	daysUntil := c.DaysUntilExpiry()
	return daysUntil >= 0 && daysUntil <= days
}

// HasVerification checks if certification has verification details
func (c *Certification) HasVerification() bool {
	return c.CredentialID != nil || c.CredentialURL != nil
}

package dto

import (
	"job-platform/internal/domain"
	"time"

	"github.com/google/uuid"
)

// CreateCertificationRequest contains fields for creating a certification
type CreateCertificationRequest struct {
	Name                string  `json:"name" binding:"required"`
	IssuingOrganization string  `json:"issuing_organization" binding:"required"`
	IssueDate           string  `json:"issue_date" binding:"required"` // YYYY-MM-DD
	ExpiryDate          *string `json:"expiry_date"`                   // YYYY-MM-DD or null
	NoExpiry            bool    `json:"no_expiry"`
	CredentialID        *string `json:"credential_id"`
	CredentialURL       *string `json:"credential_url"`
}

// UpdateCertificationRequest contains fields for updating a certification
type UpdateCertificationRequest struct {
	Name                *string `json:"name"`
	IssuingOrganization *string `json:"issuing_organization"`
	IssueDate           *string `json:"issue_date"` // YYYY-MM-DD
	ExpiryDate          *string `json:"expiry_date"` // YYYY-MM-DD
	NoExpiry            *bool   `json:"no_expiry"`
	CredentialID        *string `json:"credential_id"`
	CredentialURL       *string `json:"credential_url"`
}

// CertificationResponse represents a certification response
type CertificationResponse struct {
	ID                   uuid.UUID  `json:"id"`
	UserID               uuid.UUID  `json:"user_id"`
	Name                 string     `json:"name"`
	IssuingOrganization  string     `json:"issuing_organization"`
	IssueDate            time.Time  `json:"issue_date"`
	ExpiryDate           *time.Time `json:"expiry_date"`
	NoExpiry             bool       `json:"no_expiry"`
	CredentialID         *string    `json:"credential_id"`
	CredentialURL        *string    `json:"credential_url"`
	CertificateFileURL   *string    `json:"certificate_file_url"`
	IsExpired            bool       `json:"is_expired"`
	HasVerification      bool       `json:"has_verification"`
	DaysUntilExpiry      *int       `json:"days_until_expiry"`
	CreatedAt            time.Time  `json:"created_at"`
	UpdatedAt            time.Time  `json:"updated_at"`
}

// CertificationListResponse contains list of certifications
type CertificationListResponse struct {
	Certifications []CertificationResponse `json:"certifications"`
	Total          int                     `json:"total"`
	Active         int                     `json:"active"`
	Expired        int                     `json:"expired"`
	ExpiringSoon   int                     `json:"expiring_soon"` // Within 30 days
}

// ToCertificationResponse converts domain.Certification to CertificationResponse
func ToCertificationResponse(cert *domain.Certification) *CertificationResponse {
	isExpired := cert.IsExpired()
	hasVerification := cert.HasVerification()
	var daysUntilExpiry *int

	if !cert.NoExpiry && cert.ExpiryDate != nil {
		days := int(time.Until(*cert.ExpiryDate).Hours() / 24)
		if days > 0 {
			daysUntilExpiry = &days
		}
	}

	return &CertificationResponse{
		ID:                   cert.ID,
		UserID:               cert.UserID,
		Name:                 cert.Name,
		IssuingOrganization:  cert.IssuingOrganization,
		IssueDate:            cert.IssueDate,
		ExpiryDate:           cert.ExpiryDate,
		NoExpiry:             cert.NoExpiry,
		CredentialID:         cert.CredentialID,
		CredentialURL:        cert.CredentialURL,
		CertificateFileURL:   cert.CertificateFileURL,
		IsExpired:            isExpired,
		HasVerification:      hasVerification,
		DaysUntilExpiry:      daysUntilExpiry,
		CreatedAt:            cert.CreatedAt,
		UpdatedAt:            cert.UpdatedAt,
	}
}

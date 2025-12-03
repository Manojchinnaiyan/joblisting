package service

import (
	"job-platform/internal/domain"
	"job-platform/internal/repository"
	"time"

	"github.com/google/uuid"
)

// CertificationService handles certification business logic
type CertificationService struct {
	certRepo       *repository.CertificationRepository
	profileService *ProfileService
}

// NewCertificationService creates a new certification service
func NewCertificationService(
	certRepo *repository.CertificationRepository,
	profileService *ProfileService,
) *CertificationService {
	return &CertificationService{
		certRepo:       certRepo,
		profileService: profileService,
	}
}

// CreateCertificationInput contains fields for creating a certification
type CreateCertificationInput struct {
	Name                string
	IssuingOrganization string
	IssueDate           time.Time
	ExpiryDate          *time.Time
	NoExpiry            bool
	CredentialID        *string
	CredentialURL       *string
	CertificateFileURL  *string
}

// UpdateCertificationInput contains fields for updating a certification
type UpdateCertificationInput struct {
	Name                *string
	IssuingOrganization *string
	IssueDate           *time.Time
	ExpiryDate          *time.Time
	NoExpiry            *bool
	CredentialID        *string
	CredentialURL       *string
	CertificateFileURL  *string
}

// GetUserCertifications retrieves all certifications for a user
func (s *CertificationService) GetUserCertifications(userID uuid.UUID) ([]domain.Certification, error) {
	return s.certRepo.GetUserCertifications(userID)
}

// GetCertificationByID retrieves a certification by ID
func (s *CertificationService) GetCertificationByID(certID, userID uuid.UUID) (*domain.Certification, error) {
	return s.certRepo.GetByIDAndUserID(certID, userID)
}

// CreateCertification creates a new certification
func (s *CertificationService) CreateCertification(userID uuid.UUID, input CreateCertificationInput) (*domain.Certification, error) {
	certification := &domain.Certification{
		UserID:              userID,
		Name:                input.Name,
		IssuingOrganization: input.IssuingOrganization,
		IssueDate:           input.IssueDate,
		ExpiryDate:          input.ExpiryDate,
		NoExpiry:            input.NoExpiry,
		CredentialID:        input.CredentialID,
		CredentialURL:       input.CredentialURL,
		CertificateFileURL:  input.CertificateFileURL,
	}

	// Validate
	if err := certification.Validate(); err != nil {
		return nil, err
	}

	if err := s.certRepo.Create(certification); err != nil {
		return nil, err
	}

	return certification, nil
}

// UpdateCertification updates a certification
func (s *CertificationService) UpdateCertification(certID, userID uuid.UUID, input UpdateCertificationInput) (*domain.Certification, error) {
	certification, err := s.certRepo.GetByIDAndUserID(certID, userID)
	if err != nil {
		return nil, err
	}

	// Update fields if provided
	if input.Name != nil {
		certification.Name = *input.Name
	}
	if input.IssuingOrganization != nil {
		certification.IssuingOrganization = *input.IssuingOrganization
	}
	if input.IssueDate != nil {
		certification.IssueDate = *input.IssueDate
	}
	if input.ExpiryDate != nil {
		certification.ExpiryDate = input.ExpiryDate
	}
	if input.NoExpiry != nil {
		certification.NoExpiry = *input.NoExpiry
	}
	if input.CredentialID != nil {
		certification.CredentialID = input.CredentialID
	}
	if input.CredentialURL != nil {
		certification.CredentialURL = input.CredentialURL
	}
	if input.CertificateFileURL != nil {
		certification.CertificateFileURL = input.CertificateFileURL
	}

	// Validate
	if err := certification.Validate(); err != nil {
		return nil, err
	}

	if err := s.certRepo.Update(certification); err != nil {
		return nil, err
	}

	return certification, nil
}

// DeleteCertification deletes a certification
func (s *CertificationService) DeleteCertification(certID, userID uuid.UUID) error {
	// Verify ownership
	_, err := s.certRepo.GetByIDAndUserID(certID, userID)
	if err != nil {
		return err
	}

	return s.certRepo.Delete(certID)
}

// GetActiveCertifications retrieves active certifications for a user
func (s *CertificationService) GetActiveCertifications(userID uuid.UUID) ([]domain.Certification, error) {
	return s.certRepo.GetActiveCertifications(userID)
}

// GetExpiredCertifications retrieves expired certifications for a user
func (s *CertificationService) GetExpiredCertifications(userID uuid.UUID) ([]domain.Certification, error) {
	return s.certRepo.GetExpiredCertifications(userID)
}

// GetExpiringSoon retrieves certifications expiring within specified days
func (s *CertificationService) GetExpiringSoon(userID uuid.UUID, days int) ([]domain.Certification, error) {
	return s.certRepo.GetExpiringSoon(userID, days)
}

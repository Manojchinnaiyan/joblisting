package repository

import (
	"job-platform/internal/domain"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// CertificationRepository handles certification data access
type CertificationRepository struct {
	db *gorm.DB
}

// NewCertificationRepository creates a new certification repository
func NewCertificationRepository(db *gorm.DB) *CertificationRepository {
	return &CertificationRepository{db: db}
}

// Create creates a new certification
func (r *CertificationRepository) Create(cert *domain.Certification) error {
	return r.db.Create(cert).Error
}

// GetByID retrieves a certification by ID
func (r *CertificationRepository) GetByID(id uuid.UUID) (*domain.Certification, error) {
	var cert domain.Certification
	err := r.db.Where("id = ?", id).First(&cert).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, domain.ErrCertificationNotFound
		}
		return nil, err
	}
	return &cert, nil
}

// GetByIDAndUserID retrieves a certification by ID and user ID
func (r *CertificationRepository) GetByIDAndUserID(id, userID uuid.UUID) (*domain.Certification, error) {
	var cert domain.Certification
	err := r.db.Where("id = ? AND user_id = ?", id, userID).First(&cert).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, domain.ErrCertificationNotFound
		}
		return nil, err
	}
	return &cert, nil
}

// GetUserCertifications retrieves all certifications for a user
func (r *CertificationRepository) GetUserCertifications(userID uuid.UUID) ([]domain.Certification, error) {
	var certifications []domain.Certification
	err := r.db.Where("user_id = ?", userID).
		Order("issue_date DESC").
		Find(&certifications).Error
	return certifications, err
}

// Update updates a certification
func (r *CertificationRepository) Update(cert *domain.Certification) error {
	return r.db.Save(cert).Error
}

// Delete deletes a certification
func (r *CertificationRepository) Delete(id uuid.UUID) error {
	return r.db.Where("id = ?", id).Delete(&domain.Certification{}).Error
}

// GetActiveCertifications retrieves active (non-expired) certifications for a user
func (r *CertificationRepository) GetActiveCertifications(userID uuid.UUID) ([]domain.Certification, error) {
	var certifications []domain.Certification
	now := time.Now()

	err := r.db.Where("user_id = ?", userID).
		Where("(no_expiry = ? OR expiry_date > ?)", true, now).
		Order("issue_date DESC").
		Find(&certifications).Error
	return certifications, err
}

// GetExpiredCertifications retrieves expired certifications for a user
func (r *CertificationRepository) GetExpiredCertifications(userID uuid.UUID) ([]domain.Certification, error) {
	var certifications []domain.Certification
	now := time.Now()

	err := r.db.Where("user_id = ?", userID).
		Where("no_expiry = ? AND expiry_date <= ?", false, now).
		Order("expiry_date DESC").
		Find(&certifications).Error
	return certifications, err
}

// GetExpiringSoon retrieves certifications expiring within specified days
func (r *CertificationRepository) GetExpiringSoon(userID uuid.UUID, days int) ([]domain.Certification, error) {
	var certifications []domain.Certification
	now := time.Now()
	futureDate := now.AddDate(0, 0, days)

	err := r.db.Where("user_id = ?", userID).
		Where("no_expiry = ? AND expiry_date > ? AND expiry_date <= ?", false, now, futureDate).
		Order("expiry_date ASC").
		Find(&certifications).Error
	return certifications, err
}

// CountUserCertifications counts certifications for a user
func (r *CertificationRepository) CountUserCertifications(userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&domain.Certification{}).
		Where("user_id = ?", userID).
		Count(&count).Error
	return count, err
}

// CountActiveCertifications counts active certifications for a user
func (r *CertificationRepository) CountActiveCertifications(userID uuid.UUID) (int64, error) {
	var count int64
	now := time.Now()

	err := r.db.Model(&domain.Certification{}).
		Where("user_id = ?", userID).
		Where("(no_expiry = ? OR expiry_date > ?)", true, now).
		Count(&count).Error
	return count, err
}

// GetByOrganization retrieves certifications by issuing organization
func (r *CertificationRepository) GetByOrganization(userID uuid.UUID, organization string) ([]domain.Certification, error) {
	var certifications []domain.Certification
	err := r.db.Where("user_id = ? AND issuing_organization ILIKE ?", userID, "%"+organization+"%").
		Order("issue_date DESC").
		Find(&certifications).Error
	return certifications, err
}

// HasVerification checks if a certification has verification details
func (r *CertificationRepository) HasVerification(id uuid.UUID) (bool, error) {
	var cert domain.Certification
	err := r.db.Where("id = ?", id).First(&cert).Error
	if err != nil {
		return false, err
	}
	return cert.HasVerification(), nil
}

// ExistsByID checks if a certification exists
func (r *CertificationRepository) ExistsByID(id uuid.UUID) (bool, error) {
	var count int64
	err := r.db.Model(&domain.Certification{}).
		Where("id = ?", id).
		Count(&count).Error
	return count > 0, err
}

// DeleteUserCertifications deletes all certifications for a user
func (r *CertificationRepository) DeleteUserCertifications(userID uuid.UUID) error {
	return r.db.Where("user_id = ?", userID).Delete(&domain.Certification{}).Error
}

// GetUpcomingExpirations retrieves all certifications expiring within days across all users (admin)
func (r *CertificationRepository) GetUpcomingExpirations(days int, limit int) ([]domain.Certification, error) {
	var certifications []domain.Certification
	now := time.Now()
	futureDate := now.AddDate(0, 0, days)

	err := r.db.Preload("User").
		Where("no_expiry = ? AND expiry_date > ? AND expiry_date <= ?", false, now, futureDate).
		Order("expiry_date ASC").
		Limit(limit).
		Find(&certifications).Error
	return certifications, err
}

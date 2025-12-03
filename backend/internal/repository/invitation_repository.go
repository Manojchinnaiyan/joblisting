package repository

import (
	"job-platform/internal/domain"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// InvitationRepository handles company invitation data operations
type InvitationRepository struct {
	db *gorm.DB
}

// NewInvitationRepository creates a new invitation repository
func NewInvitationRepository(db *gorm.DB) *InvitationRepository {
	return &InvitationRepository{db: db}
}

// Create creates a new invitation
func (r *InvitationRepository) Create(invitation *domain.CompanyInvitation) error {
	return r.db.Create(invitation).Error
}

// GetByID retrieves an invitation by ID
func (r *InvitationRepository) GetByID(id uuid.UUID) (*domain.CompanyInvitation, error) {
	var invitation domain.CompanyInvitation
	err := r.db.Preload("Company").Preload("Inviter").
		Where("id = ?", id).First(&invitation).Error
	if err != nil {
		return nil, err
	}
	return &invitation, nil
}

// GetByToken retrieves an invitation by token
func (r *InvitationRepository) GetByToken(token string) (*domain.CompanyInvitation, error) {
	var invitation domain.CompanyInvitation
	err := r.db.Preload("Company").
		Where("token = ?", token).First(&invitation).Error
	if err != nil {
		return nil, err
	}
	return &invitation, nil
}

// GetByEmail retrieves pending invitations for an email
func (r *InvitationRepository) GetByEmail(email string) ([]*domain.CompanyInvitation, error) {
	var invitations []*domain.CompanyInvitation
	err := r.db.Preload("Company").Preload("Inviter").
		Where("email = ? AND status = ?", email, domain.InvitationStatusPending).
		Where("expires_at > ?", time.Now()).
		Order("created_at DESC").
		Find(&invitations).Error
	return invitations, err
}

// GetCompanyInvitations retrieves all invitations for a company
func (r *InvitationRepository) GetCompanyInvitations(companyID uuid.UUID, status *domain.InvitationStatus) ([]*domain.CompanyInvitation, error) {
	var invitations []*domain.CompanyInvitation
	query := r.db.Preload("Inviter").Where("company_id = ?", companyID)

	if status != nil {
		query = query.Where("status = ?", *status)
	}

	err := query.Order("created_at DESC").Find(&invitations).Error
	return invitations, err
}

// Update updates an invitation
func (r *InvitationRepository) Update(invitation *domain.CompanyInvitation) error {
	return r.db.Save(invitation).Error
}

// UpdateStatus updates an invitation's status
func (r *InvitationRepository) UpdateStatus(id uuid.UUID, status domain.InvitationStatus) error {
	updates := map[string]interface{}{
		"status": status,
	}

	if status == domain.InvitationStatusAccepted {
		updates["accepted_at"] = time.Now()
	}

	return r.db.Model(&domain.CompanyInvitation{}).
		Where("id = ?", id).
		Updates(updates).Error
}

// Delete deletes an invitation
func (r *InvitationRepository) Delete(id uuid.UUID) error {
	return r.db.Where("id = ?", id).Delete(&domain.CompanyInvitation{}).Error
}

// DeleteByToken deletes an invitation by token
func (r *InvitationRepository) DeleteByToken(token string) error {
	return r.db.Where("token = ?", token).Delete(&domain.CompanyInvitation{}).Error
}

// ExistsByEmailAndCompany checks if a pending invitation exists for email and company
func (r *InvitationRepository) ExistsByEmailAndCompany(email string, companyID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.Model(&domain.CompanyInvitation{}).
		Where("email = ? AND company_id = ? AND status = ?", email, companyID, domain.InvitationStatusPending).
		Where("expires_at > ?", time.Now()).
		Count(&count).Error
	return count > 0, err
}

// ExpireOldInvitations marks expired invitations as expired
func (r *InvitationRepository) ExpireOldInvitations() error {
	return r.db.Model(&domain.CompanyInvitation{}).
		Where("status = ? AND expires_at <= ?", domain.InvitationStatusPending, time.Now()).
		Update("status", domain.InvitationStatusExpired).Error
}

// CancelPendingInvitations cancels all pending invitations for an email and company
func (r *InvitationRepository) CancelPendingInvitations(email string, companyID uuid.UUID) error {
	return r.db.Model(&domain.CompanyInvitation{}).
		Where("email = ? AND company_id = ? AND status = ?", email, companyID, domain.InvitationStatusPending).
		Update("status", domain.InvitationStatusCancelled).Error
}

// CountPendingByCompany counts pending invitations for a company
func (r *InvitationRepository) CountPendingByCompany(companyID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&domain.CompanyInvitation{}).
		Where("company_id = ? AND status = ?", companyID, domain.InvitationStatusPending).
		Where("expires_at > ?", time.Now()).
		Count(&count).Error
	return count, err
}

// GetExpiringSoon retrieves invitations expiring within specified duration
func (r *InvitationRepository) GetExpiringSoon(duration time.Duration) ([]*domain.CompanyInvitation, error) {
	var invitations []*domain.CompanyInvitation
	expiryTime := time.Now().Add(duration)
	err := r.db.Preload("Company").
		Where("status = ? AND expires_at > ? AND expires_at <= ?",
			domain.InvitationStatusPending, time.Now(), expiryTime).
		Find(&invitations).Error
	return invitations, err
}

// ResendInvitation updates the expiration time for a pending invitation
func (r *InvitationRepository) ResendInvitation(id uuid.UUID, expiresAt time.Time) error {
	return r.db.Model(&domain.CompanyInvitation{}).
		Where("id = ? AND status = ?", id, domain.InvitationStatusPending).
		Update("expires_at", expiresAt).Error
}

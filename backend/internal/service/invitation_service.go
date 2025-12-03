package service

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"job-platform/internal/domain"
	"job-platform/internal/repository"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// InvitationService handles company invitation business logic
type InvitationService struct {
	invitationRepo *repository.InvitationRepository
	teamRepo       *repository.TeamRepository
	companyRepo    *repository.CompanyRepository
}

// NewInvitationService creates a new invitation service
func NewInvitationService(
	invitationRepo *repository.InvitationRepository,
	teamRepo *repository.TeamRepository,
	companyRepo *repository.CompanyRepository,
) *InvitationService {
	return &InvitationService{
		invitationRepo: invitationRepo,
		teamRepo:       teamRepo,
		companyRepo:    companyRepo,
	}
}

// generateToken generates a random invitation token
func (s *InvitationService) generateToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// CreateInvitation creates a new team invitation
func (s *InvitationService) CreateInvitation(companyID uuid.UUID, email string, role domain.TeamRole, invitedBy uuid.UUID, expiresIn time.Duration) (*domain.CompanyInvitation, error) {
	// Check if company exists
	_, err := s.companyRepo.GetByID(companyID)
	if err != nil {
		return nil, domain.ErrCompanyNotFound
	}

	// Check if invitation already exists
	exists, err := s.invitationRepo.ExistsByEmailAndCompany(email, companyID)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, domain.ErrInvitationAlreadyExists
	}

	// Generate token
	token, err := s.generateToken()
	if err != nil {
		return nil, err
	}

	// Create invitation
	now := time.Now()
	expiresAt := now.Add(expiresIn)

	invitation := &domain.CompanyInvitation{
		ID:         uuid.New(),
		CompanyID:  companyID,
		Email:      email,
		Role:       role,
		Token:      token,
		Status:     domain.InvitationStatusPending,
		InvitedBy:  invitedBy,
		ExpiresAt:  expiresAt,
		CreatedAt:  now,
		UpdatedAt:  now,
	}

	if err := s.invitationRepo.Create(invitation); err != nil {
		return nil, err
	}

	return invitation, nil
}

// GetInvitationByID retrieves an invitation by ID
func (s *InvitationService) GetInvitationByID(id uuid.UUID) (*domain.CompanyInvitation, error) {
	return s.invitationRepo.GetByID(id)
}

// GetInvitationByToken retrieves an invitation by token
func (s *InvitationService) GetInvitationByToken(token string) (*domain.CompanyInvitation, error) {
	invitation, err := s.invitationRepo.GetByToken(token)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, domain.ErrInvitationNotFound
		}
		return nil, err
	}
	return invitation, nil
}

// GetInvitationsByEmail retrieves pending invitations for an email
func (s *InvitationService) GetInvitationsByEmail(email string) ([]*domain.CompanyInvitation, error) {
	return s.invitationRepo.GetByEmail(email)
}

// GetCompanyInvitations retrieves invitations for a company
func (s *InvitationService) GetCompanyInvitations(companyID uuid.UUID, status *domain.InvitationStatus) ([]*domain.CompanyInvitation, error) {
	return s.invitationRepo.GetCompanyInvitations(companyID, status)
}

// AcceptInvitation accepts an invitation
func (s *InvitationService) AcceptInvitation(token string, userID uuid.UUID) (*domain.CompanyTeamMember, error) {
	invitation, err := s.invitationRepo.GetByToken(token)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, domain.ErrInvitationNotFound
		}
		return nil, err
	}

	// Check if expired
	if invitation.IsExpired() {
		return nil, domain.ErrInvitationExpired
	}

	// Check if pending
	if !invitation.IsPending() {
		return nil, domain.ErrInvitationNotPending
	}

	// Check if user is already a member
	exists, err := s.teamRepo.ExistsByCompanyAndUser(invitation.CompanyID, userID)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, domain.ErrTeamMemberAlreadyExists
	}

	// Create team member
	now := time.Now()
	member := &domain.CompanyTeamMember{
		ID:         uuid.New(),
		CompanyID:  invitation.CompanyID,
		UserID:     userID,
		Role:       invitation.Role,
		Status:     domain.TeamMemberStatusActive,
		InvitedBy:  &invitation.InvitedBy,
		InvitedAt:  &invitation.CreatedAt,
		JoinedAt:   &now,
		CreatedAt:  now,
		UpdatedAt:  now,
	}

	if err := s.teamRepo.Create(member); err != nil {
		return nil, err
	}

	// Update invitation status
	if err := s.invitationRepo.UpdateStatus(invitation.ID, domain.InvitationStatusAccepted); err != nil {
		return nil, err
	}

	return member, nil
}

// DeclineInvitation declines an invitation
func (s *InvitationService) DeclineInvitation(token string) error {
	invitation, err := s.invitationRepo.GetByToken(token)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return domain.ErrInvitationNotFound
		}
		return err
	}

	// Check if pending
	if !invitation.IsPending() {
		return domain.ErrInvitationNotPending
	}

	return s.invitationRepo.UpdateStatus(invitation.ID, domain.InvitationStatusDeclined)
}

// CancelInvitation cancels an invitation
func (s *InvitationService) CancelInvitation(id uuid.UUID) error {
	invitation, err := s.invitationRepo.GetByID(id)
	if err != nil {
		return domain.ErrInvitationNotFound
	}

	// Check if pending
	if !invitation.IsPending() {
		return domain.ErrInvitationNotPending
	}

	return s.invitationRepo.UpdateStatus(id, domain.InvitationStatusCancelled)
}

// DeleteInvitation deletes an invitation
func (s *InvitationService) DeleteInvitation(id uuid.UUID) error {
	return s.invitationRepo.Delete(id)
}

// ResendInvitation resends an invitation by extending expiration
func (s *InvitationService) ResendInvitation(id uuid.UUID, expiresIn time.Duration) error {
	invitation, err := s.invitationRepo.GetByID(id)
	if err != nil {
		return domain.ErrInvitationNotFound
	}

	// Check if pending
	if !invitation.IsPending() {
		return domain.ErrInvitationNotPending
	}

	expiresAt := time.Now().Add(expiresIn)
	return s.invitationRepo.ResendInvitation(id, expiresAt)
}

// ExpireOldInvitations marks expired invitations as expired
func (s *InvitationService) ExpireOldInvitations() error {
	return s.invitationRepo.ExpireOldInvitations()
}

// GetExpiringSoon retrieves invitations expiring soon
func (s *InvitationService) GetExpiringSoon(duration time.Duration) ([]*domain.CompanyInvitation, error) {
	return s.invitationRepo.GetExpiringSoon(duration)
}

// CountPendingByCompany counts pending invitations for a company
func (s *InvitationService) CountPendingByCompany(companyID uuid.UUID) (int64, error) {
	return s.invitationRepo.CountPendingByCompany(companyID)
}

// ValidateInvitation validates an invitation token
func (s *InvitationService) ValidateInvitation(token string) (*domain.CompanyInvitation, error) {
	invitation, err := s.invitationRepo.GetByToken(token)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, domain.ErrInvitationNotFound
		}
		return nil, err
	}

	if invitation.IsExpired() {
		return nil, domain.ErrInvitationExpired
	}

	if !invitation.IsPending() {
		return nil, domain.ErrInvitationNotPending
	}

	return invitation, nil
}

// GetInvitationURL generates an invitation URL
func (s *InvitationService) GetInvitationURL(token string, baseURL string) string {
	return fmt.Sprintf("%s/invitations/accept/%s", baseURL, token)
}

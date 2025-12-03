package service

import (
	"job-platform/internal/domain"
	"job-platform/internal/repository"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// TeamService handles company team business logic
type TeamService struct {
	teamRepo    *repository.TeamRepository
	companyRepo *repository.CompanyRepository
}

// NewTeamService creates a new team service
func NewTeamService(
	teamRepo *repository.TeamRepository,
	companyRepo *repository.CompanyRepository,
) *TeamService {
	return &TeamService{
		teamRepo:    teamRepo,
		companyRepo: companyRepo,
	}
}

// AddTeamMember adds a team member to a company
func (s *TeamService) AddTeamMember(companyID, userID uuid.UUID, role domain.TeamRole, invitedBy uuid.UUID) (*domain.CompanyTeamMember, error) {
	// Check if company exists
	_, err := s.companyRepo.GetByID(companyID)
	if err != nil {
		return nil, domain.ErrCompanyNotFound
	}

	// Check if user is already a member
	exists, err := s.teamRepo.ExistsByCompanyAndUser(companyID, userID)
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
		CompanyID:  companyID,
		UserID:     userID,
		Role:       role,
		Status:     domain.TeamMemberStatusActive,
		InvitedBy:  &invitedBy,
		InvitedAt:  &now,
		JoinedAt:   &now,
		CreatedAt:  now,
		UpdatedAt:  now,
	}

	if err := s.teamRepo.Create(member); err != nil {
		return nil, err
	}

	return member, nil
}

// GetTeamMember retrieves a team member by ID
func (s *TeamService) GetTeamMember(memberID uuid.UUID) (*domain.CompanyTeamMember, error) {
	return s.teamRepo.GetByID(memberID)
}

// GetTeamMemberByCompanyAndUser retrieves a team member by company and user
func (s *TeamService) GetTeamMemberByCompanyAndUser(companyID, userID uuid.UUID) (*domain.CompanyTeamMember, error) {
	member, err := s.teamRepo.GetByCompanyAndUser(companyID, userID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, domain.ErrTeamMemberNotFound
		}
		return nil, err
	}
	return member, nil
}

// GetCompanyMembers retrieves all team members for a company
func (s *TeamService) GetCompanyMembers(companyID uuid.UUID) ([]*domain.CompanyTeamMember, error) {
	return s.teamRepo.GetCompanyMembers(companyID)
}

// GetUserCompanies retrieves all companies where user is a member
func (s *TeamService) GetUserCompanies(userID uuid.UUID) ([]*domain.CompanyTeamMember, error) {
	return s.teamRepo.GetUserCompanies(userID)
}

// UpdateTeamMember updates a team member
func (s *TeamService) UpdateTeamMember(member *domain.CompanyTeamMember) error {
	return s.teamRepo.Update(member)
}

// UpdateRole updates a team member's role
func (s *TeamService) UpdateRole(memberID uuid.UUID, role domain.TeamRole, updatedBy uuid.UUID) error {
	member, err := s.teamRepo.GetByID(memberID)
	if err != nil {
		return domain.ErrTeamMemberNotFound
	}

	// Cannot change owner role
	if member.Role == domain.TeamRoleOwner {
		return domain.ErrCannotChangeOwnerRole
	}

	// Cannot promote to owner
	if role == domain.TeamRoleOwner {
		return domain.ErrCannotChangeOwnerRole
	}

	return s.teamRepo.UpdateRole(memberID, role)
}

// UpdateStatus updates a team member's status
func (s *TeamService) UpdateStatus(memberID uuid.UUID, status domain.TeamMemberStatus) error {
	member, err := s.teamRepo.GetByID(memberID)
	if err != nil {
		return domain.ErrTeamMemberNotFound
	}

	// Cannot deactivate owner
	if member.Role == domain.TeamRoleOwner && status != domain.TeamMemberStatusActive {
		return domain.ErrCannotRemoveOwner
	}

	return s.teamRepo.UpdateStatus(memberID, status)
}

// RemoveTeamMember removes a team member from a company
func (s *TeamService) RemoveTeamMember(memberID uuid.UUID, removedBy uuid.UUID) error {
	member, err := s.teamRepo.GetByID(memberID)
	if err != nil {
		return domain.ErrTeamMemberNotFound
	}

	// Cannot remove owner
	if member.Role == domain.TeamRoleOwner {
		return domain.ErrCannotRemoveOwner
	}

	return s.teamRepo.Delete(memberID)
}

// RemoveTeamMemberByCompanyAndUser removes a team member by company and user
func (s *TeamService) RemoveTeamMemberByCompanyAndUser(companyID, userID uuid.UUID) error {
	member, err := s.teamRepo.GetByCompanyAndUser(companyID, userID)
	if err != nil {
		return domain.ErrTeamMemberNotFound
	}

	// Cannot remove owner
	if member.Role == domain.TeamRoleOwner {
		return domain.ErrCannotRemoveOwner
	}

	return s.teamRepo.DeleteByCompanyAndUser(companyID, userID)
}

// GetOwner retrieves the owner of a company
func (s *TeamService) GetOwner(companyID uuid.UUID) (*domain.CompanyTeamMember, error) {
	owner, err := s.teamRepo.GetOwner(companyID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, domain.ErrOwnerNotFound
		}
		return nil, err
	}
	return owner, nil
}

// IsOwner checks if a user is the owner of a company
func (s *TeamService) IsOwner(companyID, userID uuid.UUID) (bool, error) {
	return s.teamRepo.IsOwner(companyID, userID)
}

// IsTeamMember checks if a user is a team member of a company
func (s *TeamService) IsTeamMember(companyID, userID uuid.UUID) (bool, error) {
	return s.teamRepo.ExistsByCompanyAndUser(companyID, userID)
}

// GetUserRole retrieves the role of a user in a company
func (s *TeamService) GetUserRole(companyID, userID uuid.UUID) (domain.TeamRole, error) {
	role, err := s.teamRepo.GetUserRole(companyID, userID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return "", domain.ErrTeamMemberNotFound
		}
		return "", err
	}
	return role, nil
}

// CountMembers counts the number of team members in a company
func (s *TeamService) CountMembers(companyID uuid.UUID) (int64, error) {
	return s.teamRepo.CountMembers(companyID)
}

// TransferOwnership transfers ownership from one user to another
func (s *TeamService) TransferOwnership(companyID, fromUserID, toUserID uuid.UUID) error {
	// Check if fromUser is the current owner
	isOwner, err := s.teamRepo.IsOwner(companyID, fromUserID)
	if err != nil {
		return err
	}
	if !isOwner {
		return domain.ErrNotCompanyOwner
	}

	// Check if toUser is a team member
	isMember, err := s.teamRepo.ExistsByCompanyAndUser(companyID, toUserID)
	if err != nil {
		return err
	}
	if !isMember {
		return domain.ErrTeamMemberNotFound
	}

	// Transfer ownership
	return s.teamRepo.TransferOwnership(companyID, fromUserID, toUserID)
}

// CheckPermission checks if a user has a specific permission
func (s *TeamService) CheckPermission(companyID, userID uuid.UUID, permission string) (bool, error) {
	member, err := s.teamRepo.GetByCompanyAndUser(companyID, userID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return false, nil
		}
		return false, err
	}

	// Check role-based permissions
	switch permission {
	case "manage_team":
		return member.CanManageTeam(), nil
	case "post_jobs":
		return member.CanPostJobs(), nil
	case "edit_company":
		return member.CanEditCompany(), nil
	case "owner":
		return member.IsOwner(), nil
	case "admin":
		return member.IsAdmin(), nil
	default:
		return false, nil
	}
}

// CanManageTeam checks if a user can manage team members
func (s *TeamService) CanManageTeam(companyID, userID uuid.UUID) (bool, error) {
	return s.CheckPermission(companyID, userID, "manage_team")
}

// CanPostJobs checks if a user can post jobs
func (s *TeamService) CanPostJobs(companyID, userID uuid.UUID) (bool, error) {
	return s.CheckPermission(companyID, userID, "post_jobs")
}

// CanEditCompany checks if a user can edit company profile
func (s *TeamService) CanEditCompany(companyID, userID uuid.UUID) (bool, error) {
	return s.CheckPermission(companyID, userID, "edit_company")
}

// LeaveCompany allows a user to leave a company
func (s *TeamService) LeaveCompany(companyID, userID uuid.UUID) error {
	member, err := s.teamRepo.GetByCompanyAndUser(companyID, userID)
	if err != nil {
		return domain.ErrTeamMemberNotFound
	}

	// Cannot leave if owner
	if member.Role == domain.TeamRoleOwner {
		return domain.ErrCannotRemoveOwner
	}

	return s.teamRepo.DeleteByCompanyAndUser(companyID, userID)
}

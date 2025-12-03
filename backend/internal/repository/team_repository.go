package repository

import (
	"job-platform/internal/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// TeamRepository handles company team member data operations
type TeamRepository struct {
	db *gorm.DB
}

// NewTeamRepository creates a new team repository
func NewTeamRepository(db *gorm.DB) *TeamRepository {
	return &TeamRepository{db: db}
}

// Create adds a team member
func (r *TeamRepository) Create(member *domain.CompanyTeamMember) error {
	return r.db.Create(member).Error
}

// GetByID retrieves a team member by ID
func (r *TeamRepository) GetByID(id uuid.UUID) (*domain.CompanyTeamMember, error) {
	var member domain.CompanyTeamMember
	err := r.db.Preload("User").Preload("Company").Where("id = ?", id).First(&member).Error
	if err != nil {
		return nil, err
	}
	return &member, nil
}

// GetByCompanyAndUser retrieves a team member by company and user
func (r *TeamRepository) GetByCompanyAndUser(companyID, userID uuid.UUID) (*domain.CompanyTeamMember, error) {
	var member domain.CompanyTeamMember
	err := r.db.Preload("User").
		Where("company_id = ? AND user_id = ?", companyID, userID).
		First(&member).Error
	if err != nil {
		return nil, err
	}
	return &member, nil
}

// GetCompanyMembers retrieves all team members for a company
func (r *TeamRepository) GetCompanyMembers(companyID uuid.UUID) ([]*domain.CompanyTeamMember, error) {
	var members []*domain.CompanyTeamMember
	err := r.db.Preload("User").
		Where("company_id = ? AND status = ?", companyID, domain.TeamMemberStatusActive).
		Order("role ASC, joined_at DESC").
		Find(&members).Error
	return members, err
}

// GetUserCompanies retrieves all companies where user is a member
func (r *TeamRepository) GetUserCompanies(userID uuid.UUID) ([]*domain.CompanyTeamMember, error) {
	var members []*domain.CompanyTeamMember
	err := r.db.Preload("Company").
		Where("user_id = ? AND status = ?", userID, domain.TeamMemberStatusActive).
		Find(&members).Error
	return members, err
}

// Update updates a team member
func (r *TeamRepository) Update(member *domain.CompanyTeamMember) error {
	return r.db.Save(member).Error
}

// UpdateRole updates a member's role
func (r *TeamRepository) UpdateRole(id uuid.UUID, role domain.TeamRole) error {
	return r.db.Model(&domain.CompanyTeamMember{}).
		Where("id = ?", id).
		Update("role", role).Error
}

// UpdateStatus updates a member's status
func (r *TeamRepository) UpdateStatus(id uuid.UUID, status domain.TeamMemberStatus) error {
	return r.db.Model(&domain.CompanyTeamMember{}).
		Where("id = ?", id).
		Update("status", status).Error
}

// Delete deletes a team member
func (r *TeamRepository) Delete(id uuid.UUID) error {
	return r.db.Where("id = ?", id).Delete(&domain.CompanyTeamMember{}).Error
}

// DeleteByCompanyAndUser deletes a team member by company and user
func (r *TeamRepository) DeleteByCompanyAndUser(companyID, userID uuid.UUID) error {
	return r.db.Where("company_id = ? AND user_id = ?", companyID, userID).
		Delete(&domain.CompanyTeamMember{}).Error
}

// ExistsByCompanyAndUser checks if a user is a member of a company
func (r *TeamRepository) ExistsByCompanyAndUser(companyID, userID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.Model(&domain.CompanyTeamMember{}).
		Where("company_id = ? AND user_id = ?", companyID, userID).
		Count(&count).Error
	return count > 0, err
}

// GetOwner retrieves the owner of a company
func (r *TeamRepository) GetOwner(companyID uuid.UUID) (*domain.CompanyTeamMember, error) {
	var member domain.CompanyTeamMember
	err := r.db.Preload("User").
		Where("company_id = ? AND role = ?", companyID, domain.TeamRoleOwner).
		First(&member).Error
	if err != nil {
		return nil, err
	}
	return &member, nil
}

// IsOwner checks if a user is the owner of a company
func (r *TeamRepository) IsOwner(companyID, userID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.Model(&domain.CompanyTeamMember{}).
		Where("company_id = ? AND user_id = ? AND role = ?", companyID, userID, domain.TeamRoleOwner).
		Count(&count).Error
	return count > 0, err
}

// GetUserRole retrieves the role of a user in a company
func (r *TeamRepository) GetUserRole(companyID, userID uuid.UUID) (domain.TeamRole, error) {
	var member domain.CompanyTeamMember
	err := r.db.Select("role").
		Where("company_id = ? AND user_id = ?", companyID, userID).
		First(&member).Error
	if err != nil {
		return "", err
	}
	return member.Role, nil
}

// CountMembers counts the number of members in a company
func (r *TeamRepository) CountMembers(companyID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&domain.CompanyTeamMember{}).
		Where("company_id = ? AND status = ?", companyID, domain.TeamMemberStatusActive).
		Count(&count).Error
	return count, err
}

// TransferOwnership transfers ownership from one user to another
func (r *TeamRepository) TransferOwnership(companyID, fromUserID, toUserID uuid.UUID) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Update old owner to admin
		if err := tx.Model(&domain.CompanyTeamMember{}).
			Where("company_id = ? AND user_id = ?", companyID, fromUserID).
			Update("role", domain.TeamRoleAdmin).Error; err != nil {
			return err
		}

		// Update new owner
		if err := tx.Model(&domain.CompanyTeamMember{}).
			Where("company_id = ? AND user_id = ?", companyID, toUserID).
			Update("role", domain.TeamRoleOwner).Error; err != nil {
			return err
		}

		return nil
	})
}

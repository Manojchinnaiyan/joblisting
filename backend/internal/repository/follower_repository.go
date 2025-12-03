package repository

import (
	"job-platform/internal/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// FollowerRepository handles company follower data operations
type FollowerRepository struct {
	db *gorm.DB
}

// NewFollowerRepository creates a new follower repository
func NewFollowerRepository(db *gorm.DB) *FollowerRepository {
	return &FollowerRepository{db: db}
}

// Create creates a new follower relationship
func (r *FollowerRepository) Create(follower *domain.CompanyFollower) error {
	return r.db.Create(follower).Error
}

// GetByID retrieves a follower relationship by ID
func (r *FollowerRepository) GetByID(id uuid.UUID) (*domain.CompanyFollower, error) {
	var follower domain.CompanyFollower
	err := r.db.Where("id = ?", id).First(&follower).Error
	if err != nil {
		return nil, err
	}
	return &follower, nil
}

// GetByCompanyAndUser retrieves a follower relationship by company and user
func (r *FollowerRepository) GetByCompanyAndUser(companyID, userID uuid.UUID) (*domain.CompanyFollower, error) {
	var follower domain.CompanyFollower
	err := r.db.Where("company_id = ? AND user_id = ?", companyID, userID).
		First(&follower).Error
	if err != nil {
		return nil, err
	}
	return &follower, nil
}

// GetCompanyFollowers retrieves all followers for a company
func (r *FollowerRepository) GetCompanyFollowers(companyID uuid.UUID, limit, offset int) ([]*domain.CompanyFollower, int64, error) {
	var followers []*domain.CompanyFollower
	var total int64

	query := r.db.Model(&domain.CompanyFollower{}).Where("company_id = ?", companyID)

	// Count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get results
	err := query.
		Preload("User").
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&followers).Error

	return followers, total, err
}

// GetUserFollowing retrieves all companies a user is following
func (r *FollowerRepository) GetUserFollowing(userID uuid.UUID, limit, offset int) ([]*domain.CompanyFollower, int64, error) {
	var followers []*domain.CompanyFollower
	var total int64

	query := r.db.Model(&domain.CompanyFollower{}).Where("user_id = ?", userID)

	// Count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get results
	err := query.
		Preload("Company").
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&followers).Error

	return followers, total, err
}

// Update updates a follower relationship
func (r *FollowerRepository) Update(follower *domain.CompanyFollower) error {
	return r.db.Save(follower).Error
}

// UpdateNotifications updates notification preferences for a follower
func (r *FollowerRepository) UpdateNotifications(companyID, userID uuid.UUID, notifyNewJobs bool) error {
	return r.db.Model(&domain.CompanyFollower{}).
		Where("company_id = ? AND user_id = ?", companyID, userID).
		Update("notify_new_jobs", notifyNewJobs).Error
}

// Delete deletes a follower relationship
func (r *FollowerRepository) Delete(companyID, userID uuid.UUID) error {
	return r.db.Where("company_id = ? AND user_id = ?", companyID, userID).
		Delete(&domain.CompanyFollower{}).Error
}

// DeleteByID deletes a follower relationship by ID
func (r *FollowerRepository) DeleteByID(id uuid.UUID) error {
	return r.db.Where("id = ?", id).Delete(&domain.CompanyFollower{}).Error
}

// IsFollowing checks if a user is following a company
func (r *FollowerRepository) IsFollowing(companyID, userID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.Model(&domain.CompanyFollower{}).
		Where("company_id = ? AND user_id = ?", companyID, userID).
		Count(&count).Error
	return count > 0, err
}

// CountFollowers counts followers for a company
func (r *FollowerRepository) CountFollowers(companyID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&domain.CompanyFollower{}).
		Where("company_id = ?", companyID).
		Count(&count).Error
	return count, err
}

// CountFollowing counts companies a user is following
func (r *FollowerRepository) CountFollowing(userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&domain.CompanyFollower{}).
		Where("user_id = ?", userID).
		Count(&count).Error
	return count, err
}

// GetFollowersWithNotifications retrieves followers who have notifications enabled for a company
func (r *FollowerRepository) GetFollowersWithNotifications(companyID uuid.UUID) ([]*domain.CompanyFollower, error) {
	var followers []*domain.CompanyFollower
	err := r.db.Preload("User").
		Where("company_id = ? AND notify_new_jobs = ?", companyID, true).
		Find(&followers).Error
	return followers, err
}

// GetMostFollowedCompanies retrieves companies with most followers
func (r *FollowerRepository) GetMostFollowedCompanies(limit int) ([]*domain.Company, error) {
	var companies []*domain.Company
	err := r.db.Table("companies").
		Select("companies.*, COUNT(company_followers.id) as follower_count").
		Joins("LEFT JOIN company_followers ON companies.id = company_followers.company_id").
		Where("companies.deleted_at IS NULL AND companies.status IN ?",
			[]domain.CompanyStatus{domain.CompanyStatusActive, domain.CompanyStatusVerified}).
		Group("companies.id").
		Order("follower_count DESC").
		Limit(limit).
		Find(&companies).Error
	return companies, err
}

// BulkFollow creates multiple follower relationships
func (r *FollowerRepository) BulkFollow(followers []*domain.CompanyFollower) error {
	return r.db.Create(&followers).Error
}

// BulkUnfollow deletes multiple follower relationships
func (r *FollowerRepository) BulkUnfollow(userID uuid.UUID, companyIDs []uuid.UUID) error {
	return r.db.Where("user_id = ? AND company_id IN ?", userID, companyIDs).
		Delete(&domain.CompanyFollower{}).Error
}

// GetRecentFollowers retrieves recent followers for a company
func (r *FollowerRepository) GetRecentFollowers(companyID uuid.UUID, limit int) ([]*domain.CompanyFollower, error) {
	var followers []*domain.CompanyFollower
	err := r.db.Preload("User").
		Where("company_id = ?", companyID).
		Order("created_at DESC").
		Limit(limit).
		Find(&followers).Error
	return followers, err
}

package service

import (
	"job-platform/internal/domain"
	"job-platform/internal/repository"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// FollowerService handles company follower business logic
type FollowerService struct {
	followerRepo *repository.FollowerRepository
	companyRepo  *repository.CompanyRepository
}

// NewFollowerService creates a new follower service
func NewFollowerService(
	followerRepo *repository.FollowerRepository,
	companyRepo *repository.CompanyRepository,
) *FollowerService {
	return &FollowerService{
		followerRepo: followerRepo,
		companyRepo:  companyRepo,
	}
}

// FollowCompany follows a company
func (s *FollowerService) FollowCompany(companyID, userID uuid.UUID, notifyNewJobs bool) (*domain.CompanyFollower, error) {
	// Check if company exists
	_, err := s.companyRepo.GetByID(companyID)
	if err != nil {
		return nil, domain.ErrCompanyNotFound
	}

	// Check if already following
	isFollowing, err := s.followerRepo.IsFollowing(companyID, userID)
	if err != nil {
		return nil, err
	}
	if isFollowing {
		return nil, domain.ErrAlreadyFollowing
	}

	// Create follower
	now := time.Now()
	follower := &domain.CompanyFollower{
		ID:            uuid.New(),
		CompanyID:     companyID,
		UserID:        userID,
		NotifyNewJobs: notifyNewJobs,
		CreatedAt:     now,
	}

	if err := s.followerRepo.Create(follower); err != nil {
		return nil, err
	}

	// Increment company followers count
	if err := s.companyRepo.IncrementFollowers(companyID, 1); err != nil {
		return nil, err
	}

	return follower, nil
}

// UnfollowCompany unfollows a company
func (s *FollowerService) UnfollowCompany(companyID, userID uuid.UUID) error {
	// Check if following
	isFollowing, err := s.followerRepo.IsFollowing(companyID, userID)
	if err != nil {
		return err
	}
	if !isFollowing {
		return domain.ErrNotFollowing
	}

	// Delete follower
	if err := s.followerRepo.Delete(companyID, userID); err != nil {
		return err
	}

	// Decrement company followers count
	if err := s.companyRepo.IncrementFollowers(companyID, -1); err != nil {
		return err
	}

	return nil
}

// IsFollowing checks if a user is following a company
func (s *FollowerService) IsFollowing(companyID, userID uuid.UUID) (bool, error) {
	return s.followerRepo.IsFollowing(companyID, userID)
}

// GetFollower retrieves a follower relationship
func (s *FollowerService) GetFollower(companyID, userID uuid.UUID) (*domain.CompanyFollower, error) {
	follower, err := s.followerRepo.GetByCompanyAndUser(companyID, userID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, domain.ErrFollowerNotFound
		}
		return nil, err
	}
	return follower, nil
}

// GetCompanyFollowers retrieves followers for a company
func (s *FollowerService) GetCompanyFollowers(companyID uuid.UUID, limit, offset int) ([]*domain.CompanyFollower, int64, error) {
	return s.followerRepo.GetCompanyFollowers(companyID, limit, offset)
}

// GetUserFollowing retrieves companies a user is following
func (s *FollowerService) GetUserFollowing(userID uuid.UUID, limit, offset int) ([]*domain.CompanyFollower, int64, error) {
	return s.followerRepo.GetUserFollowing(userID, limit, offset)
}

// UpdateNotifications updates notification preferences for a follower
func (s *FollowerService) UpdateNotifications(companyID, userID uuid.UUID, notifyNewJobs bool) error {
	// Check if following
	isFollowing, err := s.followerRepo.IsFollowing(companyID, userID)
	if err != nil {
		return err
	}
	if !isFollowing {
		return domain.ErrNotFollowing
	}

	return s.followerRepo.UpdateNotifications(companyID, userID, notifyNewJobs)
}

// CountFollowers counts followers for a company
func (s *FollowerService) CountFollowers(companyID uuid.UUID) (int64, error) {
	return s.followerRepo.CountFollowers(companyID)
}

// CountFollowing counts companies a user is following
func (s *FollowerService) CountFollowing(userID uuid.UUID) (int64, error) {
	return s.followerRepo.CountFollowing(userID)
}

// GetFollowersWithNotifications retrieves followers who have notifications enabled
func (s *FollowerService) GetFollowersWithNotifications(companyID uuid.UUID) ([]*domain.CompanyFollower, error) {
	return s.followerRepo.GetFollowersWithNotifications(companyID)
}

// GetMostFollowedCompanies retrieves companies with most followers
func (s *FollowerService) GetMostFollowedCompanies(limit int) ([]*domain.Company, error) {
	return s.followerRepo.GetMostFollowedCompanies(limit)
}

// GetRecentFollowers retrieves recent followers for a company
func (s *FollowerService) GetRecentFollowers(companyID uuid.UUID, limit int) ([]*domain.CompanyFollower, error) {
	return s.followerRepo.GetRecentFollowers(companyID, limit)
}

// BulkFollow follows multiple companies
func (s *FollowerService) BulkFollow(userID uuid.UUID, companyIDs []uuid.UUID, notifyNewJobs bool) error {
	var followers []*domain.CompanyFollower
	now := time.Now()

	for _, companyID := range companyIDs {
		// Check if company exists
		_, err := s.companyRepo.GetByID(companyID)
		if err != nil {
			continue
		}

		// Check if already following
		isFollowing, err := s.followerRepo.IsFollowing(companyID, userID)
		if err != nil || isFollowing {
			continue
		}

		follower := &domain.CompanyFollower{
			ID:            uuid.New(),
			CompanyID:     companyID,
			UserID:        userID,
			NotifyNewJobs: notifyNewJobs,
			CreatedAt:     now,
		}
		followers = append(followers, follower)
	}

	if len(followers) == 0 {
		return nil
	}

	if err := s.followerRepo.BulkFollow(followers); err != nil {
		return err
	}

	// Increment followers count for each company
	for _, follower := range followers {
		if err := s.companyRepo.IncrementFollowers(follower.CompanyID, 1); err != nil {
			// Log error but continue
			continue
		}
	}

	return nil
}

// BulkUnfollow unfollows multiple companies
func (s *FollowerService) BulkUnfollow(userID uuid.UUID, companyIDs []uuid.UUID) error {
	if err := s.followerRepo.BulkUnfollow(userID, companyIDs); err != nil {
		return err
	}

	// Decrement followers count for each company
	for _, companyID := range companyIDs {
		if err := s.companyRepo.IncrementFollowers(companyID, -1); err != nil {
			// Log error but continue
			continue
		}
	}

	return nil
}

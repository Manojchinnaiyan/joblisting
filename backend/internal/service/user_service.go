package service

import (
	"job-platform/internal/domain"
	"job-platform/internal/repository"

	"github.com/google/uuid"
)

// UserService handles user management operations
type UserService struct {
	userRepo    *repository.UserRepository
	profileRepo *repository.ProfileRepository
}

// NewUserService creates a new user service
func NewUserService(
	userRepo *repository.UserRepository,
	profileRepo *repository.ProfileRepository,
) *UserService {
	return &UserService{
		userRepo:    userRepo,
		profileRepo: profileRepo,
	}
}

// GetByID retrieves a user by ID
func (s *UserService) GetByID(id uuid.UUID) (*domain.User, error) {
	return s.userRepo.GetByID(id)
}

// GetByEmail retrieves a user by email
func (s *UserService) GetByEmail(email string) (*domain.User, error) {
	return s.userRepo.GetByEmail(email)
}

// Update updates user information
func (s *UserService) Update(user *domain.User) error {
	return s.userRepo.Update(user)
}

// UpdateUserName updates user's first name and/or last name
func (s *UserService) UpdateUserName(userID uuid.UUID, firstName, lastName *string) error {
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return err
	}

	if firstName != nil {
		user.FirstName = *firstName
	}
	if lastName != nil {
		user.LastName = *lastName
	}

	return s.userRepo.Update(user)
}

// Delete soft deletes a user
func (s *UserService) Delete(id uuid.UUID) error {
	return s.userRepo.Delete(id)
}

// Suspend suspends a user account
func (s *UserService) Suspend(id uuid.UUID) error {
	return s.userRepo.Suspend(id)
}

// Activate activates a suspended user account
func (s *UserService) Activate(id uuid.UUID) error {
	return s.userRepo.Activate(id)
}

// UnlockUser unlocks a user account by resetting failed attempts and lock time
func (s *UserService) UnlockUser(id uuid.UUID) error {
	return s.userRepo.ResetFailedAttempts(id)
}

// GetProfile retrieves user profile
func (s *UserService) GetProfile(userID uuid.UUID) (*domain.UserProfile, error) {
	return s.profileRepo.GetByUserID(userID)
}

// UpdateProfile updates user profile
func (s *UserService) UpdateProfile(profile *domain.UserProfile) error {
	return s.profileRepo.Update(profile)
}

// List retrieves paginated list of users
func (s *UserService) List(filters map[string]interface{}, page, perPage int) ([]domain.User, int64, error) {
	return s.userRepo.List(filters, page, perPage)
}

// GetStats retrieves user statistics
func (s *UserService) GetStats() (map[string]int64, error) {
	stats := make(map[string]int64)

	// Count by role
	jobSeekers, err := s.userRepo.CountByRole(domain.RoleJobSeeker)
	if err != nil {
		return nil, err
	}
	stats["job_seekers"] = jobSeekers

	employers, err := s.userRepo.CountByRole(domain.RoleEmployer)
	if err != nil {
		return nil, err
	}
	stats["employers"] = employers

	admins, err := s.userRepo.CountByRole(domain.RoleAdmin)
	if err != nil {
		return nil, err
	}
	stats["admins"] = admins

	// Count by status
	active, err := s.userRepo.CountByStatus(domain.StatusActive)
	if err != nil {
		return nil, err
	}
	stats["active"] = active

	suspended, err := s.userRepo.CountByStatus(domain.StatusSuspended)
	if err != nil {
		return nil, err
	}
	stats["suspended"] = suspended

	return stats, nil
}

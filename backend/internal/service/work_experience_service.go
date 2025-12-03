package service

import (
	"job-platform/internal/domain"
	"job-platform/internal/repository"
	"time"

	"github.com/google/uuid"
)

// WorkExperienceService handles work experience business logic
type WorkExperienceService struct {
	experienceRepo *repository.WorkExperienceRepository
	profileService *ProfileService
}

// NewWorkExperienceService creates a new work experience service
func NewWorkExperienceService(
	experienceRepo *repository.WorkExperienceRepository,
	profileService *ProfileService,
) *WorkExperienceService {
	return &WorkExperienceService{
		experienceRepo: experienceRepo,
		profileService: profileService,
	}
}

// CreateExperienceInput contains fields for creating work experience
type CreateExperienceInput struct {
	CompanyName    string
	CompanyLogoURL *string
	Title          string
	EmploymentType domain.EmploymentType
	Location       *string
	IsRemote       bool
	StartDate      time.Time
	EndDate        *time.Time
	IsCurrent      bool
	Description    *string
	Achievements   []string
	SkillsUsed     []string
}

// UpdateExperienceInput contains fields for updating work experience
type UpdateExperienceInput struct {
	CompanyName    *string
	CompanyLogoURL *string
	Title          *string
	EmploymentType *domain.EmploymentType
	Location       *string
	IsRemote       *bool
	StartDate      *time.Time
	EndDate        *time.Time
	IsCurrent      *bool
	Description    *string
	Achievements   []string
	SkillsUsed     []string
}

// GetUserExperiences retrieves all work experiences for a user
func (s *WorkExperienceService) GetUserExperiences(userID uuid.UUID) ([]domain.WorkExperience, error) {
	return s.experienceRepo.GetUserExperiences(userID)
}

// GetExperienceByID retrieves a work experience by ID
func (s *WorkExperienceService) GetExperienceByID(expID, userID uuid.UUID) (*domain.WorkExperience, error) {
	return s.experienceRepo.GetByIDAndUserID(expID, userID)
}

// CreateExperience creates a new work experience
func (s *WorkExperienceService) CreateExperience(userID uuid.UUID, input CreateExperienceInput) (*domain.WorkExperience, error) {
	// If this is marked as current, unset other current experiences
	if input.IsCurrent {
		_ = s.experienceRepo.UnsetCurrentStatus(userID)
	}

	experience := &domain.WorkExperience{
		UserID:         userID,
		CompanyName:    input.CompanyName,
		CompanyLogoURL: input.CompanyLogoURL,
		Title:          input.Title,
		EmploymentType: input.EmploymentType,
		Location:       input.Location,
		IsRemote:       input.IsRemote,
		StartDate:      input.StartDate,
		EndDate:        input.EndDate,
		IsCurrent:      input.IsCurrent,
		Description:    input.Description,
		Achievements:   input.Achievements,
		SkillsUsed:     input.SkillsUsed,
	}

	// Validate
	if err := experience.Validate(); err != nil {
		return nil, err
	}

	if err := s.experienceRepo.Create(experience); err != nil {
		return nil, err
	}

	// Update profile completeness and total experience
	_ = s.updateProfileExperience(userID)

	return experience, nil
}

// UpdateExperience updates a work experience
func (s *WorkExperienceService) UpdateExperience(expID, userID uuid.UUID, input UpdateExperienceInput) (*domain.WorkExperience, error) {
	experience, err := s.experienceRepo.GetByIDAndUserID(expID, userID)
	if err != nil {
		return nil, err
	}

	// Update fields if provided
	if input.CompanyName != nil {
		experience.CompanyName = *input.CompanyName
	}
	if input.CompanyLogoURL != nil {
		experience.CompanyLogoURL = input.CompanyLogoURL
	}
	if input.Title != nil {
		experience.Title = *input.Title
	}
	if input.EmploymentType != nil {
		experience.EmploymentType = *input.EmploymentType
	}
	if input.Location != nil {
		experience.Location = input.Location
	}
	if input.IsRemote != nil {
		experience.IsRemote = *input.IsRemote
	}
	if input.StartDate != nil {
		experience.StartDate = *input.StartDate
	}
	if input.EndDate != nil {
		experience.EndDate = input.EndDate
	}
	if input.IsCurrent != nil {
		// If setting as current, unset other current experiences
		if *input.IsCurrent {
			_ = s.experienceRepo.UnsetCurrentStatus(userID)
		}
		experience.IsCurrent = *input.IsCurrent
	}
	if input.Description != nil {
		experience.Description = input.Description
	}
	if len(input.Achievements) > 0 {
		experience.Achievements = input.Achievements
	}
	if len(input.SkillsUsed) > 0 {
		experience.SkillsUsed = input.SkillsUsed
	}

	// Validate
	if err := experience.Validate(); err != nil {
		return nil, err
	}

	if err := s.experienceRepo.Update(experience); err != nil {
		return nil, err
	}

	// Update profile total experience
	_ = s.updateProfileExperience(userID)

	return experience, nil
}

// DeleteExperience deletes a work experience
func (s *WorkExperienceService) DeleteExperience(expID, userID uuid.UUID) error {
	// Verify ownership
	_, err := s.experienceRepo.GetByIDAndUserID(expID, userID)
	if err != nil {
		return err
	}

	if err := s.experienceRepo.Delete(expID); err != nil {
		return err
	}

	// Update profile completeness and total experience
	_ = s.updateProfileExperience(userID)

	return nil
}

// GetCurrentExperience retrieves current work experience for a user
func (s *WorkExperienceService) GetCurrentExperience(userID uuid.UUID) (*domain.WorkExperience, error) {
	return s.experienceRepo.GetCurrentExperience(userID)
}

// CalculateTotalExperience calculates total years of experience
func (s *WorkExperienceService) CalculateTotalExperience(userID uuid.UUID) (float32, error) {
	return s.experienceRepo.CalculateTotalExperience(userID)
}

// updateProfileExperience updates profile completeness and total experience
func (s *WorkExperienceService) updateProfileExperience(userID uuid.UUID) error {
	// Calculate total experience
	totalExp, err := s.experienceRepo.CalculateTotalExperience(userID)
	if err == nil {
		// Update profile total experience years
		profile, err := s.profileService.GetProfileByUserID(userID)
		if err == nil {
			profile.TotalExperienceYears = &totalExp
			_ = s.profileService.profileRepo.Update(profile)
		}
	}

	// Update profile completeness
	return s.profileService.UpdateCompletenessScore(userID)
}

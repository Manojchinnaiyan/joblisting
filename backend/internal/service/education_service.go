package service

import (
	"job-platform/internal/domain"
	"job-platform/internal/repository"
	"time"

	"github.com/google/uuid"
)

// EducationService handles education business logic
type EducationService struct {
	educationRepo  *repository.EducationRepository
	profileService *ProfileService
}

// NewEducationService creates a new education service
func NewEducationService(
	educationRepo *repository.EducationRepository,
	profileService *ProfileService,
) *EducationService {
	return &EducationService{
		educationRepo:  educationRepo,
		profileService: profileService,
	}
}

// CreateEducationInput contains fields for creating education
type CreateEducationInput struct {
	Institution        string
	InstitutionLogoURL *string
	Degree             domain.DegreeType
	FieldOfStudy       string
	StartDate          time.Time
	EndDate            *time.Time
	IsCurrent          bool
	Grade              *string
	Description        *string
	Activities         []string
}

// UpdateEducationInput contains fields for updating education
type UpdateEducationInput struct {
	Institution        *string
	InstitutionLogoURL *string
	Degree             *domain.DegreeType
	FieldOfStudy       *string
	StartDate          *time.Time
	EndDate            *time.Time
	IsCurrent          *bool
	Grade              *string
	Description        *string
	Activities         []string
}

// GetUserEducation retrieves all education entries for a user
func (s *EducationService) GetUserEducation(userID uuid.UUID) ([]domain.Education, error) {
	return s.educationRepo.GetUserEducation(userID)
}

// GetEducationByID retrieves an education entry by ID
func (s *EducationService) GetEducationByID(eduID, userID uuid.UUID) (*domain.Education, error) {
	return s.educationRepo.GetByIDAndUserID(eduID, userID)
}

// CreateEducation creates a new education entry
func (s *EducationService) CreateEducation(userID uuid.UUID, input CreateEducationInput) (*domain.Education, error) {
	// If this is marked as current, unset other current education
	if input.IsCurrent {
		_ = s.educationRepo.UnsetCurrentStatus(userID)
	}

	education := &domain.Education{
		UserID:             userID,
		Institution:        input.Institution,
		InstitutionLogoURL: input.InstitutionLogoURL,
		Degree:             input.Degree,
		FieldOfStudy:       input.FieldOfStudy,
		StartDate:          input.StartDate,
		EndDate:            input.EndDate,
		IsCurrent:          input.IsCurrent,
		Grade:              input.Grade,
		Description:        input.Description,
		Activities:         input.Activities,
	}

	// Validate
	if err := education.Validate(); err != nil {
		return nil, err
	}

	if err := s.educationRepo.Create(education); err != nil {
		return nil, err
	}

	// Update profile completeness
	_ = s.profileService.UpdateCompletenessScore(userID)

	return education, nil
}

// UpdateEducation updates an education entry
func (s *EducationService) UpdateEducation(eduID, userID uuid.UUID, input UpdateEducationInput) (*domain.Education, error) {
	education, err := s.educationRepo.GetByIDAndUserID(eduID, userID)
	if err != nil {
		return nil, err
	}

	// Update fields if provided
	if input.Institution != nil {
		education.Institution = *input.Institution
	}
	if input.InstitutionLogoURL != nil {
		education.InstitutionLogoURL = input.InstitutionLogoURL
	}
	if input.Degree != nil {
		education.Degree = *input.Degree
	}
	if input.FieldOfStudy != nil {
		education.FieldOfStudy = *input.FieldOfStudy
	}
	if input.StartDate != nil {
		education.StartDate = *input.StartDate
	}
	if input.EndDate != nil {
		education.EndDate = input.EndDate
	}
	if input.IsCurrent != nil {
		// If setting as current, unset other current education
		if *input.IsCurrent {
			_ = s.educationRepo.UnsetCurrentStatus(userID)
		}
		education.IsCurrent = *input.IsCurrent
	}
	if input.Grade != nil {
		education.Grade = input.Grade
	}
	if input.Description != nil {
		education.Description = input.Description
	}
	if len(input.Activities) > 0 {
		education.Activities = input.Activities
	}

	// Validate
	if err := education.Validate(); err != nil {
		return nil, err
	}

	if err := s.educationRepo.Update(education); err != nil {
		return nil, err
	}

	return education, nil
}

// DeleteEducation deletes an education entry
func (s *EducationService) DeleteEducation(eduID, userID uuid.UUID) error {
	// Verify ownership
	_, err := s.educationRepo.GetByIDAndUserID(eduID, userID)
	if err != nil {
		return err
	}

	if err := s.educationRepo.Delete(eduID); err != nil {
		return err
	}

	// Update profile completeness
	_ = s.profileService.UpdateCompletenessScore(userID)

	return nil
}

// GetCurrentEducation retrieves current education for a user
func (s *EducationService) GetCurrentEducation(userID uuid.UUID) (*domain.Education, error) {
	return s.educationRepo.GetCurrentEducation(userID)
}

// GetHighestDegree retrieves the highest degree for a user
func (s *EducationService) GetHighestDegree(userID uuid.UUID) (*domain.Education, error) {
	return s.educationRepo.GetHighestDegree(userID)
}

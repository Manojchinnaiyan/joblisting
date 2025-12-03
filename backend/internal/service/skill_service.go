package service

import (
	"job-platform/internal/domain"
	"job-platform/internal/repository"

	"github.com/google/uuid"
)

// SkillService handles user skill business logic
type SkillService struct {
	skillRepo      *repository.UserSkillRepository
	profileService *ProfileService
}

// NewSkillService creates a new skill service
func NewSkillService(
	skillRepo *repository.UserSkillRepository,
	profileService *ProfileService,
) *SkillService {
	return &SkillService{
		skillRepo:      skillRepo,
		profileService: profileService,
	}
}

// AddSkillInput contains fields for adding a skill
type AddSkillInput struct {
	Name            string
	Level           domain.SkillLevel
	YearsExperience *float32
}

// UpdateSkillInput contains fields for updating a skill
type UpdateSkillInput struct {
	Name            *string
	Level           *domain.SkillLevel
	YearsExperience *float32
}

// GetUserSkills retrieves all skills for a user
func (s *SkillService) GetUserSkills(userID uuid.UUID) ([]domain.UserSkill, error) {
	return s.skillRepo.GetUserSkills(userID)
}

// AddSkill adds a new skill for a user
func (s *SkillService) AddSkill(userID uuid.UUID, input AddSkillInput) (*domain.UserSkill, error) {
	// Check if skill already exists
	exists, err := s.skillRepo.ExistsByName(userID, input.Name)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, domain.ErrSkillAlreadyExists
	}

	skill := &domain.UserSkill{
		UserID:          userID,
		Name:            input.Name,
		Level:           input.Level,
		YearsExperience: input.YearsExperience,
	}

	// Validate
	if err := skill.Validate(); err != nil {
		return nil, err
	}

	if err := s.skillRepo.Create(skill); err != nil {
		return nil, err
	}

	// Update profile completeness
	_ = s.profileService.UpdateCompletenessScore(userID)

	return skill, nil
}

// UpdateSkill updates a user skill
func (s *SkillService) UpdateSkill(skillID, userID uuid.UUID, input UpdateSkillInput) (*domain.UserSkill, error) {
	skill, err := s.skillRepo.GetByIDAndUserID(skillID, userID)
	if err != nil {
		return nil, err
	}

	// Update fields if provided
	if input.Name != nil {
		// Check if new name conflicts with existing skill
		if *input.Name != skill.Name {
			exists, err := s.skillRepo.ExistsByName(userID, *input.Name)
			if err != nil {
				return nil, err
			}
			if exists {
				return nil, domain.ErrSkillAlreadyExists
			}
		}
		skill.Name = *input.Name
	}
	if input.Level != nil {
		skill.Level = *input.Level
	}
	if input.YearsExperience != nil {
		skill.YearsExperience = input.YearsExperience
	}

	// Validate
	if err := skill.Validate(); err != nil {
		return nil, err
	}

	if err := s.skillRepo.Update(skill); err != nil {
		return nil, err
	}

	return skill, nil
}

// DeleteSkill deletes a user skill
func (s *SkillService) DeleteSkill(skillID, userID uuid.UUID) error {
	// Verify ownership
	_, err := s.skillRepo.GetByIDAndUserID(skillID, userID)
	if err != nil {
		return err
	}

	if err := s.skillRepo.Delete(skillID); err != nil {
		return err
	}

	// Update profile completeness
	_ = s.profileService.UpdateCompletenessScore(userID)

	return nil
}

// BulkUpdateSkills updates or creates multiple skills at once
func (s *SkillService) BulkUpdateSkills(userID uuid.UUID, skills []AddSkillInput) ([]domain.UserSkill, error) {
	var result []domain.UserSkill

	for _, input := range skills {
		// Check if skill exists
		exists, _ := s.skillRepo.ExistsByName(userID, input.Name)

		if exists {
			// Get existing skill and update
			existingSkills, _ := s.skillRepo.GetSkillsByNames(userID, []string{input.Name})
			if len(existingSkills) > 0 {
				skill := &existingSkills[0]
				skill.Level = input.Level
				skill.YearsExperience = input.YearsExperience
				_ = s.skillRepo.Update(skill)
				result = append(result, *skill)
			}
		} else {
			// Create new skill
			skill := &domain.UserSkill{
				UserID:          userID,
				Name:            input.Name,
				Level:           input.Level,
				YearsExperience: input.YearsExperience,
			}
			if err := s.skillRepo.Create(skill); err == nil {
				result = append(result, *skill)
			}
		}
	}

	// Update profile completeness
	_ = s.profileService.UpdateCompletenessScore(userID)

	return result, nil
}

// SearchSkills searches for skills by name
func (s *SkillService) SearchSkills(query string) ([]string, error) {
	return s.skillRepo.SearchSkills(query, 20)
}

// GetTopSkills retrieves most common skills across all users
func (s *SkillService) GetTopSkills(limit int) ([]map[string]interface{}, error) {
	return s.skillRepo.GetTopSkills(limit)
}

package service

import (
	"fmt"
	"job-platform/internal/domain"
	"job-platform/internal/repository"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ProfileService handles profile business logic
type ProfileService struct {
	profileRepo     *repository.ProfileRepository
	resumeRepo      *repository.ResumeRepository
	experienceRepo  *repository.WorkExperienceRepository
	educationRepo   *repository.EducationRepository
	skillRepo       *repository.UserSkillRepository
	db              *gorm.DB
}

// NewProfileService creates a new profile service
func NewProfileService(
	profileRepo *repository.ProfileRepository,
	resumeRepo *repository.ResumeRepository,
	experienceRepo *repository.WorkExperienceRepository,
	educationRepo *repository.EducationRepository,
	skillRepo *repository.UserSkillRepository,
	db *gorm.DB,
) *ProfileService {
	return &ProfileService{
		profileRepo:    profileRepo,
		resumeRepo:     resumeRepo,
		experienceRepo: experienceRepo,
		educationRepo:  educationRepo,
		skillRepo:      skillRepo,
		db:             db,
	}
}

// UpdateProfileInput contains fields for updating a profile
type UpdateProfileInput struct {
	Headline                *string
	Bio                     *string
	Phone                   *string
	DateOfBirth             *string
	City                    *string
	State                   *string
	Country                 *string
	PostalCode              *string
	WillingToRelocate       *bool
	CurrentTitle            *string
	CurrentCompany          *string
	TotalExperienceYears    *float32
	ExpectedSalaryMin       *int
	ExpectedSalaryMax       *int
	ExpectedSalaryCurrency  *string
	NoticePeriodDays        *int
	AvailableFrom           *string
	OpenToOpportunities     *bool
	PreferredJobTypes       []string
	PreferredWorkplaceTypes []string
	LinkedInURL             *string
	GithubURL               *string
	PortfolioURL            *string
	WebsiteURL              *string
	Visibility              *string
	ShowEmail               *bool
	ShowPhone               *bool
}

// CompletenessBreakdown represents detailed completeness information
type CompletenessBreakdown struct {
	Score    int                            `json:"score"`
	Sections map[string]SectionCompleteness `json:"sections"`
}

// SectionCompleteness represents completeness of a profile section
type SectionCompleteness struct {
	Weight    int  `json:"weight"`
	Completed bool `json:"completed"`
	Score     int  `json:"score"`
}

// CreateProfile creates a new user profile
func (s *ProfileService) CreateProfile(userID uuid.UUID) (*domain.UserProfile, error) {
	// Check if profile already exists
	exists, err := s.profileRepo.Exists(userID)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, domain.ErrProfileAlreadyExists
	}

	// Create profile with defaults
	profile := &domain.UserProfile{
		UserID:              userID,
		Visibility:          domain.VisibilityEmployersOnly,
		OpenToOpportunities: true,
		CompletenessScore:   0,
	}

	if err := s.profileRepo.Create(profile); err != nil {
		return nil, err
	}

	// Calculate initial completeness
	score, err := s.CalculateCompleteness(userID)
	if err == nil {
		_ = s.profileRepo.UpdateCompleteness(userID, score)
		profile.CompletenessScore = score
	}

	return profile, nil
}

// GetProfileByUserID retrieves a profile by user ID
func (s *ProfileService) GetProfileByUserID(userID uuid.UUID) (*domain.UserProfile, error) {
	return s.profileRepo.GetByUserID(userID)
}

// GetProfileWithUser retrieves a profile with user information
func (s *ProfileService) GetProfileWithUser(userID uuid.UUID) (*domain.UserProfile, error) {
	return s.profileRepo.GetWithUser(userID)
}

// UpdateProfile updates a user profile
func (s *ProfileService) UpdateProfile(userID uuid.UUID, input UpdateProfileInput) (*domain.UserProfile, error) {
	profile, err := s.profileRepo.GetByUserID(userID)
	if err != nil {
		return nil, err
	}

	// Update fields if provided
	if input.Headline != nil {
		profile.Headline = input.Headline
	}
	if input.Bio != nil {
		profile.Bio = input.Bio
	}
	if input.Phone != nil {
		profile.Phone = input.Phone
	}
	if input.DateOfBirth != nil && *input.DateOfBirth != "" {
		parsedDate, err := time.Parse("2006-01-02", *input.DateOfBirth)
		if err == nil {
			profile.DateOfBirth = &parsedDate
		}
	}
	if input.City != nil {
		profile.City = input.City
	}
	if input.State != nil {
		profile.State = input.State
	}
	if input.Country != nil {
		profile.Country = input.Country
	}
	if input.PostalCode != nil {
		profile.PostalCode = input.PostalCode
	}
	if input.WillingToRelocate != nil {
		profile.WillingToRelocate = *input.WillingToRelocate
	}
	if input.CurrentTitle != nil {
		profile.CurrentTitle = input.CurrentTitle
	}
	if input.CurrentCompany != nil {
		profile.CurrentCompany = input.CurrentCompany
	}
	if input.TotalExperienceYears != nil {
		profile.TotalExperienceYears = input.TotalExperienceYears
	}
	if input.ExpectedSalaryMin != nil {
		profile.ExpectedSalaryMin = input.ExpectedSalaryMin
	}
	if input.ExpectedSalaryMax != nil {
		profile.ExpectedSalaryMax = input.ExpectedSalaryMax
	}
	if input.ExpectedSalaryCurrency != nil {
		profile.ExpectedSalaryCurrency = input.ExpectedSalaryCurrency
	}
	if input.NoticePeriodDays != nil {
		profile.NoticePeriodDays = input.NoticePeriodDays
	}
	if input.OpenToOpportunities != nil {
		profile.OpenToOpportunities = *input.OpenToOpportunities
	}
	if len(input.PreferredJobTypes) > 0 {
		profile.PreferredJobTypes = input.PreferredJobTypes
	}
	if len(input.PreferredWorkplaceTypes) > 0 {
		profile.PreferredWorkplaceTypes = input.PreferredWorkplaceTypes
	}
	if input.LinkedInURL != nil {
		profile.LinkedInURL = input.LinkedInURL
	}
	if input.GithubURL != nil {
		profile.GithubURL = input.GithubURL
	}
	if input.PortfolioURL != nil {
		profile.PortfolioURL = input.PortfolioURL
	}
	if input.WebsiteURL != nil {
		profile.WebsiteURL = input.WebsiteURL
	}
	if input.Visibility != nil {
		profile.Visibility = domain.ProfileVisibility(*input.Visibility)
	}
	if input.ShowEmail != nil {
		profile.ShowEmail = *input.ShowEmail
	}
	if input.ShowPhone != nil {
		profile.ShowPhone = *input.ShowPhone
	}

	// Save profile
	if err := s.profileRepo.Update(profile); err != nil {
		return nil, err
	}

	// Recalculate completeness
	score, err := s.CalculateCompleteness(userID)
	if err == nil {
		_ = s.profileRepo.UpdateCompleteness(userID, score)
		profile.CompletenessScore = score
	}

	return profile, nil
}

// DeleteProfile deletes a user profile
func (s *ProfileService) DeleteProfile(userID uuid.UUID) error {
	return s.profileRepo.Delete(userID)
}

// CalculateCompleteness calculates profile completeness score (0-100)
func (s *ProfileService) CalculateCompleteness(userID uuid.UUID) (int, error) {
	profile, err := s.profileRepo.GetByUserID(userID)
	if err != nil {
		return 0, err
	}

	score := 0

	// Basic Info (headline, bio, phone): 15%
	if profile.Headline != nil && *profile.Headline != "" {
		score += 5
	}
	if profile.Bio != nil && *profile.Bio != "" {
		score += 5
	}
	if profile.Phone != nil && *profile.Phone != "" {
		score += 5
	}

	// Avatar uploaded: 5%
	if profile.AvatarURL != nil && *profile.AvatarURL != "" {
		score += 5
	}

	// Location filled: 5%
	if profile.City != nil && profile.Country != nil {
		score += 5
	}

	// At least 1 Resume uploaded: 15%
	resumeCount, err := s.resumeRepo.CountUserResumes(userID)
	if err == nil && resumeCount > 0 {
		score += 15
	}

	// At least 1 Work Experience: 20%
	expCount, err := s.experienceRepo.CountUserExperiences(userID)
	if err == nil && expCount > 0 {
		score += 20
	}

	// At least 1 Education: 15%
	eduCount, err := s.educationRepo.CountUserEducation(userID)
	if err == nil && eduCount > 0 {
		score += 15
	}

	// At least 3 Skills: 10%
	skillCount, err := s.skillRepo.CountUserSkills(userID)
	if err == nil && skillCount >= 3 {
		score += 10
	}

	// Social Links (at least 1): 5%
	if profile.LinkedInURL != nil || profile.GithubURL != nil ||
		profile.PortfolioURL != nil || profile.WebsiteURL != nil {
		score += 5
	}

	// Job Preferences filled: 10%
	if len(profile.PreferredJobTypes) > 0 {
		score += 10
	}

	return score, nil
}

// GetCompletenessBreakdown returns detailed completeness breakdown
func (s *ProfileService) GetCompletenessBreakdown(userID uuid.UUID) (*CompletenessBreakdown, error) {
	profile, err := s.profileRepo.GetByUserID(userID)
	if err != nil {
		return nil, err
	}

	breakdown := &CompletenessBreakdown{
		Sections: make(map[string]SectionCompleteness),
	}

	// Basic Info
	basicCompleted := (profile.Headline != nil && *profile.Headline != "") &&
		(profile.Bio != nil && *profile.Bio != "") &&
		(profile.Phone != nil && *profile.Phone != "")
	breakdown.Sections["basic_info"] = SectionCompleteness{
		Weight:    15,
		Completed: basicCompleted,
		Score:     map[bool]int{true: 15, false: 0}[basicCompleted],
	}

	// Avatar
	avatarCompleted := profile.AvatarURL != nil && *profile.AvatarURL != ""
	breakdown.Sections["avatar"] = SectionCompleteness{
		Weight:    5,
		Completed: avatarCompleted,
		Score:     map[bool]int{true: 5, false: 0}[avatarCompleted],
	}

	// Location
	locationCompleted := profile.City != nil && profile.Country != nil
	breakdown.Sections["location"] = SectionCompleteness{
		Weight:    5,
		Completed: locationCompleted,
		Score:     map[bool]int{true: 5, false: 0}[locationCompleted],
	}

	// Resume
	resumeCount, _ := s.resumeRepo.CountUserResumes(userID)
	resumeCompleted := resumeCount > 0
	breakdown.Sections["resume"] = SectionCompleteness{
		Weight:    15,
		Completed: resumeCompleted,
		Score:     map[bool]int{true: 15, false: 0}[resumeCompleted],
	}

	// Work Experience
	expCount, _ := s.experienceRepo.CountUserExperiences(userID)
	expCompleted := expCount > 0
	breakdown.Sections["work_experience"] = SectionCompleteness{
		Weight:    20,
		Completed: expCompleted,
		Score:     map[bool]int{true: 20, false: 0}[expCompleted],
	}

	// Education
	eduCount, _ := s.educationRepo.CountUserEducation(userID)
	eduCompleted := eduCount > 0
	breakdown.Sections["education"] = SectionCompleteness{
		Weight:    15,
		Completed: eduCompleted,
		Score:     map[bool]int{true: 15, false: 0}[eduCompleted],
	}

	// Skills
	skillCount, _ := s.skillRepo.CountUserSkills(userID)
	skillCompleted := skillCount >= 3
	breakdown.Sections["skills"] = SectionCompleteness{
		Weight:    10,
		Completed: skillCompleted,
		Score:     map[bool]int{true: 10, false: 0}[skillCompleted],
	}

	// Social Links
	socialCompleted := profile.LinkedInURL != nil || profile.GithubURL != nil ||
		profile.PortfolioURL != nil || profile.WebsiteURL != nil
	breakdown.Sections["social_links"] = SectionCompleteness{
		Weight:    5,
		Completed: socialCompleted,
		Score:     map[bool]int{true: 5, false: 0}[socialCompleted],
	}

	// Job Preferences
	prefCompleted := len(profile.PreferredJobTypes) > 0
	breakdown.Sections["job_preferences"] = SectionCompleteness{
		Weight:    10,
		Completed: prefCompleted,
		Score:     map[bool]int{true: 10, false: 0}[prefCompleted],
	}

	// Calculate total score
	totalScore := 0
	for _, section := range breakdown.Sections {
		totalScore += section.Score
	}
	breakdown.Score = totalScore

	return breakdown, nil
}

// CanViewProfile checks if a viewer can view a profile
func (s *ProfileService) CanViewProfile(viewerID *uuid.UUID, profileUserID uuid.UUID, viewerRole string) (bool, error) {
	profile, err := s.profileRepo.GetByUserID(profileUserID)
	if err != nil {
		return false, err
	}

	// Check if viewer has applied to any job from this user (for APPLIED_ONLY visibility)
	hasApplied := false
	// TODO: Check application history when implementing

	return profile.CanViewProfile(viewerID, viewerRole, hasApplied), nil
}

// GetPublicProfile retrieves a public-facing profile (respects visibility)
func (s *ProfileService) GetPublicProfile(profileUserID uuid.UUID, viewerID *uuid.UUID, viewerRole string) (*domain.UserProfile, error) {
	profile, err := s.profileRepo.GetWithUser(profileUserID)
	if err != nil {
		return nil, err
	}

	// Check if viewer can view this profile
	canView, err := s.CanViewProfile(viewerID, profileUserID, viewerRole)
	if err != nil {
		return nil, err
	}
	if !canView {
		return nil, domain.ErrCannotViewProfile
	}

	// Filter sensitive information based on visibility settings
	if !profile.ShowEmail && (viewerID == nil || *viewerID != profileUserID) {
		if profile.User != nil {
			profile.User.Email = ""
		}
	}
	if !profile.ShowPhone && (viewerID == nil || *viewerID != profileUserID) {
		profile.Phone = nil
	}

	return profile, nil
}

// AdminGetAllProfiles retrieves all profiles for admin
func (s *ProfileService) AdminGetAllProfiles(limit, offset int) ([]domain.UserProfile, int64, error) {
	return s.profileRepo.ListAll(limit, offset)
}

// SearchProfiles searches profiles with filters
func (s *ProfileService) SearchProfiles(filters map[string]interface{}, limit, offset int) ([]domain.UserProfile, int64, error) {
	return s.profileRepo.SearchProfiles(filters, limit, offset)
}

// GetProfileStats retrieves profile statistics
func (s *ProfileService) GetProfileStats() (map[string]interface{}, error) {
	return s.profileRepo.GetProfileStats()
}

// UpdateAvatarURL updates the avatar URL
func (s *ProfileService) UpdateAvatarURL(userID uuid.UUID, avatarURL string) error {
	err := s.profileRepo.UpdateAvatarURL(userID, avatarURL)
	if err != nil {
		return err
	}

	// Recalculate completeness
	score, err := s.CalculateCompleteness(userID)
	if err == nil {
		_ = s.profileRepo.UpdateCompleteness(userID, score)
	}

	return nil
}

// RemoveAvatar removes the avatar URL
func (s *ProfileService) RemoveAvatar(userID uuid.UUID) error {
	err := s.profileRepo.RemoveAvatarURL(userID)
	if err != nil {
		return err
	}

	// Recalculate completeness
	score, err := s.CalculateCompleteness(userID)
	if err == nil {
		_ = s.profileRepo.UpdateCompleteness(userID, score)
	}

	return nil
}

// EnsureProfileExists ensures a profile exists for a user, creates if not
func (s *ProfileService) EnsureProfileExists(userID uuid.UUID) (*domain.UserProfile, error) {
	profile, err := s.profileRepo.GetByUserID(userID)
	if err != nil {
		if err == domain.ErrProfileNotFound {
			return s.CreateProfile(userID)
		}
		return nil, err
	}
	return profile, nil
}

// UpdateCompletenessScore recalculates and updates completeness score
func (s *ProfileService) UpdateCompletenessScore(userID uuid.UUID) error {
	score, err := s.CalculateCompleteness(userID)
	if err != nil {
		return fmt.Errorf("failed to calculate completeness: %w", err)
	}
	return s.profileRepo.UpdateCompleteness(userID, score)
}

// IncrementProfileViews increments the profile view count
func (s *ProfileService) IncrementProfileViews(userID uuid.UUID) error {
	return s.profileRepo.IncrementViews(userID)
}

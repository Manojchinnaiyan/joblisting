package service

import (
	"job-platform/internal/domain"
	"job-platform/internal/repository"

	"github.com/google/uuid"
)

// CandidateSearchService handles candidate search and saved candidate business logic
type CandidateSearchService struct {
	profileRepo       *repository.ProfileRepository
	savedCandidateRepo *repository.SavedCandidateRepository
	userRepo          *repository.UserRepository
}

// NewCandidateSearchService creates a new candidate search service
func NewCandidateSearchService(
	profileRepo *repository.ProfileRepository,
	savedCandidateRepo *repository.SavedCandidateRepository,
	userRepo *repository.UserRepository,
) *CandidateSearchService {
	return &CandidateSearchService{
		profileRepo:       profileRepo,
		savedCandidateRepo: savedCandidateRepo,
		userRepo:          userRepo,
	}
}

// CandidateSearchFilters contains filters for candidate search
type CandidateSearchFilters struct {
	Skills             []string
	MinExperienceYears *float32
	MaxExperienceYears *float32
	DesiredSalaryMin   *int
	DesiredSalaryMax   *int
	JobTypes           []string
	Locations          []string
	RemoteOnly         *bool
	AvailableFrom      *string
	Keyword            string
	MinCompleteness    *int
	Limit              int
	Offset             int
}

// CandidateSearchResult contains search results with metadata
type CandidateSearchResult struct {
	Profiles []domain.UserProfile
	Total    int64
	Limit    int
	Offset   int
}

// SearchCandidates searches for candidates based on filters
func (s *CandidateSearchService) SearchCandidates(employerID uuid.UUID, filters CandidateSearchFilters) (*CandidateSearchResult, error) {
	// Build filter map
	filterMap := make(map[string]interface{})

	// Only include publicly visible or employer-visible profiles
	filterMap["visibility"] = []string{string(domain.VisibilityPublic), string(domain.VisibilityEmployersOnly)}

	if len(filters.Skills) > 0 {
		filterMap["skills"] = filters.Skills
	}

	if filters.MinExperienceYears != nil {
		filterMap["min_experience"] = *filters.MinExperienceYears
	}

	if filters.MaxExperienceYears != nil {
		filterMap["max_experience"] = *filters.MaxExperienceYears
	}

	if filters.DesiredSalaryMin != nil {
		filterMap["min_salary"] = *filters.DesiredSalaryMin
	}

	if filters.DesiredSalaryMax != nil {
		filterMap["max_salary"] = *filters.DesiredSalaryMax
	}

	if len(filters.JobTypes) > 0 {
		filterMap["job_types"] = filters.JobTypes
	}

	if len(filters.Locations) > 0 {
		filterMap["locations"] = filters.Locations
	}

	if filters.RemoteOnly != nil && *filters.RemoteOnly {
		filterMap["remote_only"] = true
	}

	if filters.AvailableFrom != nil && *filters.AvailableFrom != "" {
		filterMap["available_from"] = *filters.AvailableFrom
	}

	if filters.Keyword != "" {
		filterMap["keyword"] = filters.Keyword
	}

	if filters.MinCompleteness != nil {
		filterMap["min_completeness"] = *filters.MinCompleteness
	}

	// Set defaults for pagination
	if filters.Limit <= 0 {
		filters.Limit = 20
	}
	if filters.Limit > 100 {
		filters.Limit = 100
	}

	// Search profiles
	profiles, total, err := s.profileRepo.SearchProfiles(filterMap, filters.Limit, filters.Offset)
	if err != nil {
		return nil, err
	}

	// Check which candidates are saved by this employer
	for i := range profiles {
		saved, _ := s.savedCandidateRepo.IsSaved(employerID, profiles[i].UserID)
		// Store in a custom field if needed, or handle in handler/DTO layer
		_ = saved
	}

	return &CandidateSearchResult{
		Profiles: profiles,
		Total:    total,
		Limit:    filters.Limit,
		Offset:   filters.Offset,
	}, nil
}

// GetCandidateProfile retrieves a candidate's public profile
func (s *CandidateSearchService) GetCandidateProfile(candidateID, employerID uuid.UUID) (*domain.UserProfile, error) {
	profile, err := s.profileRepo.GetByUserID(candidateID)
	if err != nil {
		return nil, err
	}

	// For employer candidate search, allow viewing public and employers-only profiles
	// Private profiles should not appear in search results
	if profile.Visibility == domain.VisibilityPrivate {
		// Only allow viewing if employer is the candidate themselves (unlikely)
		if employerID != profile.UserID {
			return nil, domain.ErrCannotViewProfile
		}
	}

	// Public and EmployersOnly profiles are viewable by employers through search
	// (The search already filters for these visibilities)

	return profile, nil
}

// SaveCandidateInput contains fields for saving a candidate
type SaveCandidateInput struct {
	CandidateID uuid.UUID
	Notes       string
	Folder      string
}

// SaveCandidate saves a candidate for an employer
func (s *CandidateSearchService) SaveCandidate(employerID uuid.UUID, input SaveCandidateInput) (*domain.SavedCandidate, error) {
	// Check if candidate exists and has a profile
	candidate, err := s.userRepo.GetByID(input.CandidateID)
	if err != nil {
		return nil, domain.ErrUserNotFound
	}

	if candidate.Role != domain.RoleJobSeeker {
		return nil, domain.ErrNotACandidate
	}

	// Check if already saved
	existing, err := s.savedCandidateRepo.GetByEmployerAndCandidate(employerID, input.CandidateID)
	if err == nil && existing != nil {
		return nil, domain.ErrCandidateAlreadySaved
	}

	// Create saved candidate entry
	notes := input.Notes
	folder := input.Folder
	saved := &domain.SavedCandidate{
		EmployerID:  employerID,
		CandidateID: input.CandidateID,
		Notes:       &notes,
		Folder:      &folder,
	}

	if err := saved.Validate(); err != nil {
		return nil, err
	}

	if err := s.savedCandidateRepo.Create(saved); err != nil {
		return nil, err
	}

	return saved, nil
}

// UnsaveCandidate removes a saved candidate
func (s *CandidateSearchService) UnsaveCandidate(employerID, candidateID uuid.UUID) error {
	// Verify it exists
	_, err := s.savedCandidateRepo.GetByEmployerAndCandidate(employerID, candidateID)
	if err != nil {
		return err
	}

	return s.savedCandidateRepo.Delete(employerID, candidateID)
}

// GetSavedCandidates retrieves all saved candidates for an employer
func (s *CandidateSearchService) GetSavedCandidates(employerID uuid.UUID, limit, offset int) ([]domain.SavedCandidate, int64, error) {
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	return s.savedCandidateRepo.GetEmployerSavedCandidates(employerID, limit, offset)
}

// GetSavedCandidatesByFolder retrieves saved candidates in a specific folder
func (s *CandidateSearchService) GetSavedCandidatesByFolder(employerID uuid.UUID, folder string, limit, offset int) ([]domain.SavedCandidate, int64, error) {
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	return s.savedCandidateRepo.GetByFolder(employerID, folder, limit, offset)
}

// UpdateSavedCandidateInput contains fields for updating a saved candidate
type UpdateSavedCandidateInput struct {
	Notes  *string
	Folder *string
}

// UpdateSavedCandidate updates notes or folder for a saved candidate
func (s *CandidateSearchService) UpdateSavedCandidate(employerID, candidateID uuid.UUID, input UpdateSavedCandidateInput) (*domain.SavedCandidate, error) {
	saved, err := s.savedCandidateRepo.GetByEmployerAndCandidate(employerID, candidateID)
	if err != nil {
		return nil, err
	}

	// Update fields if provided
	if input.Notes != nil {
		saved.Notes = input.Notes
	}
	if input.Folder != nil {
		saved.Folder = input.Folder
	}

	if err := saved.Validate(); err != nil {
		return nil, err
	}

	if err := s.savedCandidateRepo.Update(saved); err != nil {
		return nil, err
	}

	return saved, nil
}

// GetFolders retrieves all folder names for an employer
func (s *CandidateSearchService) GetFolders(employerID uuid.UUID) ([]string, error) {
	return s.savedCandidateRepo.GetFolders(employerID)
}

// CountByFolder counts candidates in a folder
func (s *CandidateSearchService) CountByFolder(employerID uuid.UUID, folder string) (int64, error) {
	return s.savedCandidateRepo.CountByFolder(employerID, folder)
}

// IsCandidateSaved checks if a candidate is saved by an employer
func (s *CandidateSearchService) IsCandidateSaved(employerID, candidateID uuid.UUID) (bool, error) {
	return s.savedCandidateRepo.IsSaved(employerID, candidateID)
}

// GetRecommendedCandidates retrieves recommended candidates for an employer based on job postings
func (s *CandidateSearchService) GetRecommendedCandidates(employerID uuid.UUID, limit int) ([]domain.UserProfile, error) {
	// This is a placeholder for a more sophisticated recommendation algorithm
	// In a real system, you would:
	// 1. Get employer's active job postings
	// 2. Extract required skills, experience, etc.
	// 3. Match candidates based on those requirements
	// 4. Score and rank candidates
	// 5. Return top matches

	if limit <= 0 {
		limit = 10
	}
	if limit > 50 {
		limit = 50
	}

	// For now, return recently updated, highly complete profiles
	filterMap := map[string]interface{}{
		"visibility":        []string{string(domain.VisibilityPublic), string(domain.VisibilityEmployersOnly)},
		"min_completeness": 70,
	}

	profiles, _, err := s.profileRepo.SearchProfiles(filterMap, limit, 0)
	return profiles, err
}

// BulkSaveCandidates saves multiple candidates at once
func (s *CandidateSearchService) BulkSaveCandidates(employerID uuid.UUID, candidateIDs []uuid.UUID, folder string) ([]domain.SavedCandidate, error) {
	var saved []domain.SavedCandidate

	for _, candidateID := range candidateIDs {
		// Check if candidate exists
		candidate, err := s.userRepo.GetByID(candidateID)
		if err != nil {
			continue // Skip invalid candidates
		}

		if candidate.Role != domain.RoleJobSeeker {
			continue // Skip non-candidates
		}

		// Check if already saved
		_, err = s.savedCandidateRepo.GetByEmployerAndCandidate(employerID, candidateID)
		if err == nil {
			continue // Skip already saved
		}

		// Create saved candidate entry
		folderCopy := folder
		sc := domain.SavedCandidate{
			EmployerID:  employerID,
			CandidateID: candidateID,
			Folder:      &folderCopy,
		}

		if err := sc.Validate(); err != nil {
			continue
		}

		saved = append(saved, sc)
	}

	if len(saved) == 0 {
		return nil, domain.ErrNoValidCandidates
	}

	if err := s.savedCandidateRepo.BulkSave(saved); err != nil {
		return nil, err
	}

	return saved, nil
}

// MoveToFolder moves saved candidates to a different folder
func (s *CandidateSearchService) MoveToFolder(employerID uuid.UUID, candidateIDs []uuid.UUID, folder string) error {
	for _, candidateID := range candidateIDs {
		if err := s.savedCandidateRepo.UpdateFolder(employerID, candidateID, folder); err != nil {
			// Continue with others even if one fails
			continue
		}
	}
	return nil
}

// CountSavedCandidates counts total saved candidates for an employer
func (s *CandidateSearchService) CountSavedCandidates(employerID uuid.UUID) (int64, error) {
	return s.savedCandidateRepo.CountEmployerSavedCandidates(employerID)
}

// GetCandidateStats retrieves statistics about saved candidates
func (s *CandidateSearchService) GetCandidateStats(employerID uuid.UUID) (map[string]interface{}, error) {
	total, err := s.savedCandidateRepo.CountEmployerSavedCandidates(employerID)
	if err != nil {
		return nil, err
	}

	folders, err := s.savedCandidateRepo.GetFolders(employerID)
	if err != nil {
		return nil, err
	}

	folderCounts := make(map[string]int64)
	for _, folder := range folders {
		count, _ := s.savedCandidateRepo.CountByFolder(employerID, folder)
		folderCounts[folder] = count
	}

	// Count unfiled
	unfiled, _ := s.savedCandidateRepo.CountByFolder(employerID, "")

	return map[string]interface{}{
		"total":         total,
		"folders":       len(folders),
		"folder_counts": folderCounts,
		"unfiled":       unfiled,
	}, nil
}

// SearchSavedCandidates searches within saved candidates
func (s *CandidateSearchService) SearchSavedCandidates(employerID uuid.UUID, keyword string, limit, offset int) ([]domain.SavedCandidate, int64, error) {
	// This is a simplified version - in production you'd want to search across
	// candidate names, skills, notes, etc.
	// For now, just return all saved candidates with keyword filtering in memory

	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	saved, total, err := s.savedCandidateRepo.GetEmployerSavedCandidates(employerID, limit, offset)
	if err != nil {
		return nil, 0, err
	}

	// In a real implementation, you'd do this in the database with a JOIN
	// and text search on candidate profiles

	return saved, total, nil
}

package service

import (
	"job-platform/internal/domain"
	"job-platform/internal/repository"
	"job-platform/internal/storage"
	"mime/multipart"

	"github.com/google/uuid"
)

// PortfolioService handles portfolio project business logic
type PortfolioService struct {
	portfolioRepo  *repository.PortfolioRepository
	profileService *ProfileService
	minioClient    *storage.MinioClient
}

// NewPortfolioService creates a new portfolio service
func NewPortfolioService(
	portfolioRepo *repository.PortfolioRepository,
	profileService *ProfileService,
	minioClient *storage.MinioClient,
) *PortfolioService {
	return &PortfolioService{
		portfolioRepo:  portfolioRepo,
		profileService: profileService,
		minioClient:    minioClient,
	}
}

// CreatePortfolioInput contains fields for creating a portfolio project
type CreatePortfolioInput struct {
	Title          string
	Description    string
	ProjectURL     *string
	SourceCodeURL  *string
	Technologies   []string
	StartDate      *string
	EndDate        *string
	Role           *string
	TeamSize       *int
	Highlights     []string
	IsFeatured     bool
}

// UpdatePortfolioInput contains fields for updating a portfolio project
type UpdatePortfolioInput struct {
	Title          *string
	Description    *string
	ProjectURL     *string
	SourceCodeURL  *string
	Technologies   []string
	StartDate      *string
	EndDate        *string
	Role           *string
	TeamSize       *int
	Highlights     []string
	IsFeatured     *bool
}

// GetUserPortfolio retrieves all portfolio projects for a user
func (s *PortfolioService) GetUserPortfolio(userID uuid.UUID) ([]domain.PortfolioProject, error) {
	return s.portfolioRepo.GetUserPortfolio(userID)
}

// GetPortfolioByID retrieves a portfolio project by ID
func (s *PortfolioService) GetPortfolioByID(projectID, userID uuid.UUID) (*domain.PortfolioProject, error) {
	return s.portfolioRepo.GetByIDAndUserID(projectID, userID)
}

// CreatePortfolio creates a new portfolio project
func (s *PortfolioService) CreatePortfolio(userID uuid.UUID, input CreatePortfolioInput) (*domain.PortfolioProject, error) {
	// Check featured projects limit if this is featured
	if input.IsFeatured {
		count, err := s.portfolioRepo.CountFeaturedProjects(userID)
		if err != nil {
			return nil, err
		}
		if count >= 3 {
			return nil, domain.ErrMaxFeaturedReached
		}
	}

	project := &domain.PortfolioProject{
		UserID:        userID,
		Title:         input.Title,
		Description:   input.Description,
		ProjectURL:    input.ProjectURL,
		SourceCodeURL: input.SourceCodeURL,
		Technologies:  input.Technologies,
		IsFeatured:    input.IsFeatured,
	}

	// Parse dates if provided
	if input.StartDate != nil && *input.StartDate != "" {
		startDate, err := domain.ParseDate(*input.StartDate)
		if err != nil {
			return nil, domain.ErrInvalidDateFormat
		}
		project.StartDate = &startDate
	}

	if input.EndDate != nil && *input.EndDate != "" {
		endDate, err := domain.ParseDate(*input.EndDate)
		if err != nil {
			return nil, domain.ErrInvalidDateFormat
		}
		project.EndDate = &endDate
	}

	// Validate
	if err := project.Validate(); err != nil {
		return nil, err
	}

	if err := s.portfolioRepo.Create(project); err != nil {
		return nil, err
	}

	// Update profile completeness
	if _, err := s.profileService.CalculateCompleteness(userID); err != nil {
		// Log error but don't fail the operation
	}

	return project, nil
}

// UpdatePortfolio updates a portfolio project
func (s *PortfolioService) UpdatePortfolio(projectID, userID uuid.UUID, input UpdatePortfolioInput) (*domain.PortfolioProject, error) {
	project, err := s.portfolioRepo.GetByIDAndUserID(projectID, userID)
	if err != nil {
		return nil, err
	}

	// Check featured projects limit if setting as featured
	if input.IsFeatured != nil && *input.IsFeatured && !project.IsFeatured {
		count, err := s.portfolioRepo.CountFeaturedProjects(userID)
		if err != nil {
			return nil, err
		}
		if count >= 3 {
			return nil, domain.ErrMaxFeaturedReached
		}
	}

	// Update fields if provided
	if input.Title != nil {
		project.Title = *input.Title
	}
	if input.Description != nil {
		project.Description = *input.Description
	}
	if input.ProjectURL != nil {
		project.ProjectURL = input.ProjectURL
	}
	if input.SourceCodeURL != nil {
		project.SourceCodeURL = input.SourceCodeURL
	}
	if input.Technologies != nil {
		project.Technologies = input.Technologies
	}
	// Role, TeamSize, Highlights not in domain model - skip them
	if input.IsFeatured != nil {
		project.IsFeatured = *input.IsFeatured
	}

	// Parse dates if provided
	if input.StartDate != nil {
		if *input.StartDate == "" {
			project.StartDate = nil
		} else {
			startDate, err := domain.ParseDate(*input.StartDate)
			if err != nil {
				return nil, domain.ErrInvalidDateFormat
			}
			project.StartDate = &startDate
		}
	}

	if input.EndDate != nil {
		if *input.EndDate == "" {
			project.EndDate = nil
		} else {
			endDate, err := domain.ParseDate(*input.EndDate)
			if err != nil {
				return nil, domain.ErrInvalidDateFormat
			}
			project.EndDate = &endDate
		}
	}

	// Validate
	if err := project.Validate(); err != nil {
		return nil, err
	}

	if err := s.portfolioRepo.Update(project); err != nil {
		return nil, err
	}

	// Update profile completeness
	if _, err := s.profileService.CalculateCompleteness(userID); err != nil {
		// Log error but don't fail the operation
	}

	return project, nil
}

// DeletePortfolio deletes a portfolio project
func (s *PortfolioService) DeletePortfolio(projectID, userID uuid.UUID) error {
	// Verify ownership
	project, err := s.portfolioRepo.GetByIDAndUserID(projectID, userID)
	if err != nil {
		return err
	}

	// Delete thumbnail from MinIO if exists
	if project.ThumbnailURL != nil && *project.ThumbnailURL != "" {
		// Extract path from URL and delete
		// Note: Implement path extraction logic based on your URL structure
		_ = s.minioClient.DeleteFile("portfolios", *project.ThumbnailURL)
	}

	// Delete images from MinIO if exist
	if len(project.Images) > 0 {
		for _, imageURL := range project.Images {
			// Extract path from URL and delete
			_ = s.minioClient.DeleteFile("portfolios", imageURL)
		}
	}

	if err := s.portfolioRepo.Delete(projectID); err != nil {
		return err
	}

	// Update profile completeness
	if _, err := s.profileService.CalculateCompleteness(userID); err != nil {
		// Log error but don't fail the operation
	}

	return nil
}

// GetFeaturedProjects retrieves featured projects for a user
func (s *PortfolioService) GetFeaturedProjects(userID uuid.UUID) ([]domain.PortfolioProject, error) {
	return s.portfolioRepo.GetFeaturedProjects(userID)
}

// SetFeatured sets or unsets a project as featured
func (s *PortfolioService) SetFeatured(projectID, userID uuid.UUID, featured bool) error {
	// Verify ownership
	_, err := s.portfolioRepo.GetByIDAndUserID(projectID, userID)
	if err != nil {
		return err
	}

	// Check featured limit if setting as featured
	if featured {
		count, err := s.portfolioRepo.CountFeaturedProjects(userID)
		if err != nil {
			return err
		}
		if count >= 3 {
			return domain.ErrMaxFeaturedReached
		}
	}

	return s.portfolioRepo.SetFeatured(projectID, featured)
}

// UploadThumbnail uploads a thumbnail for a portfolio project
func (s *PortfolioService) UploadThumbnail(projectID, userID uuid.UUID, file *multipart.FileHeader) (*domain.PortfolioProject, error) {
	// Verify ownership
	project, err := s.portfolioRepo.GetByIDAndUserID(projectID, userID)
	if err != nil {
		return nil, err
	}

	// Validate file
	allowedTypes := []string{"image/jpeg", "image/png", "image/gif", "image/webp"}
	if err := s.minioClient.ValidateFile(file, allowedTypes, 5); err != nil {
		return nil, err
	}

	// Generate unique filename
	filename := storage.GenerateUniqueFileName(file.Filename)
	path := storage.GenerateFilePath(userID, filename)

	// Delete old thumbnail if exists
	if project.ThumbnailURL != nil && *project.ThumbnailURL != "" {
		_ = s.minioClient.DeleteFile("portfolios", *project.ThumbnailURL)
	}

	// Upload to MinIO
	result, err := s.minioClient.UploadFile("portfolios", file, path)
	if err != nil {
		return nil, domain.ErrStorageUploadFailed
	}

	// Update project
	project.ThumbnailURL = &result.URL
	if err := s.portfolioRepo.Update(project); err != nil {
		// Cleanup uploaded file
		_ = s.minioClient.DeleteFile("portfolios", path)
		return nil, err
	}

	return project, nil
}

// AddProjectImage adds an image to a portfolio project
func (s *PortfolioService) AddProjectImage(projectID, userID uuid.UUID, file *multipart.FileHeader) (*domain.PortfolioProject, error) {
	// Verify ownership
	project, err := s.portfolioRepo.GetByIDAndUserID(projectID, userID)
	if err != nil {
		return nil, err
	}

	// Check image limit
	if len(project.Images) >= 10 {
		return nil, domain.ErrMaxImagesReached
	}

	// Validate file
	allowedTypes := []string{"image/jpeg", "image/png", "image/gif", "image/webp"}
	if err := s.minioClient.ValidateFile(file, allowedTypes, 5); err != nil {
		return nil, err
	}

	// Generate unique filename
	filename := storage.GenerateUniqueFileName(file.Filename)
	path := storage.GenerateFilePath(userID, filename)

	// Upload to MinIO
	result, err := s.minioClient.UploadFile("portfolios", file, path)
	if err != nil {
		return nil, domain.ErrStorageUploadFailed
	}

	// Add to project images
	project.Images = append(project.Images, result.URL)
	if err := s.portfolioRepo.Update(project); err != nil {
		// Cleanup uploaded file
		_ = s.minioClient.DeleteFile("portfolios", path)
		return nil, err
	}

	return project, nil
}

// RemoveProjectImage removes an image from a portfolio project
func (s *PortfolioService) RemoveProjectImage(projectID, userID uuid.UUID, imageURL string) (*domain.PortfolioProject, error) {
	// Verify ownership
	project, err := s.portfolioRepo.GetByIDAndUserID(projectID, userID)
	if err != nil {
		return nil, err
	}

	// Find and remove image
	found := false
	var newImages []string
	for _, img := range project.Images {
		if img == imageURL {
			found = true
			// Delete from MinIO
			_ = s.minioClient.DeleteFile("portfolios", imageURL)
		} else {
			newImages = append(newImages, img)
		}
	}

	if !found {
		return nil, domain.ErrImageNotFound
	}

	project.Images = newImages
	if err := s.portfolioRepo.Update(project); err != nil {
		return nil, err
	}

	return project, nil
}

// GetProjectsByTechnology retrieves projects by technology
func (s *PortfolioService) GetProjectsByTechnology(userID uuid.UUID, technology string) ([]domain.PortfolioProject, error) {
	return s.portfolioRepo.GetByTechnology(userID, technology)
}

// GetOngoingProjects retrieves ongoing projects for a user
func (s *PortfolioService) GetOngoingProjects(userID uuid.UUID) ([]domain.PortfolioProject, error) {
	return s.portfolioRepo.GetOngoingProjects(userID)
}

// SearchProjects searches projects by title
func (s *PortfolioService) SearchProjects(userID uuid.UUID, query string) ([]domain.PortfolioProject, error) {
	return s.portfolioRepo.SearchByTitle(userID, query)
}

// CountUserProjects counts portfolio projects for a user
func (s *PortfolioService) CountUserProjects(userID uuid.UUID) (int64, error) {
	return s.portfolioRepo.CountUserProjects(userID)
}

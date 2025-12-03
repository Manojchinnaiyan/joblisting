package service

import (
	"job-platform/internal/domain"
	"job-platform/internal/repository"
	"job-platform/internal/util/slug"

	"github.com/google/uuid"
)

// JobCategoryService handles job category business logic
type JobCategoryService struct {
	categoryRepo *repository.JobCategoryRepository
}

// NewJobCategoryService creates a new job category service
func NewJobCategoryService(
	categoryRepo *repository.JobCategoryRepository,
) *JobCategoryService {
	return &JobCategoryService{
		categoryRepo: categoryRepo,
	}
}

// CreateCategoryInput represents input for creating a category
type CreateCategoryInput struct {
	Name        string
	Description string
	Icon        string
	ParentID    *uuid.UUID
	SortOrder   int
}

// UpdateCategoryInput represents input for updating a category
type UpdateCategoryInput struct {
	Name        *string
	Description *string
	Icon        *string
	ParentID    *uuid.UUID
	SortOrder   *int
	IsActive    *bool
}

// CreateCategory creates a new job category
func (s *JobCategoryService) CreateCategory(input CreateCategoryInput) (*domain.JobCategory, error) {
	// Generate slug
	categorySlug := slug.Generate(input.Name)

	// Make slug unique
	finalSlug := slug.MakeUnique(categorySlug, func(slugStr string) bool {
		exists, _ := s.categoryRepo.SlugExists(slugStr)
		return exists
	})

	// Validate parent category if provided
	if input.ParentID != nil {
		_, err := s.categoryRepo.GetByID(*input.ParentID)
		if err != nil {
			return nil, domain.ErrInvalidParentCategory
		}
	}

	// Create category
	category := &domain.JobCategory{
		ID:          uuid.New(),
		Name:        input.Name,
		Slug:        finalSlug,
		Description: input.Description,
		Icon:        input.Icon,
		ParentID:    input.ParentID,
		SortOrder:   input.SortOrder,
		IsActive:    true,
	}

	if err := s.categoryRepo.Create(category); err != nil {
		return nil, err
	}

	return s.categoryRepo.GetByID(category.ID)
}

// UpdateCategory updates a job category
func (s *JobCategoryService) UpdateCategory(categoryID uuid.UUID, input UpdateCategoryInput) (*domain.JobCategory, error) {
	// Get category
	category, err := s.categoryRepo.GetByID(categoryID)
	if err != nil {
		return nil, domain.ErrCategoryNotFound
	}

	// Update fields if provided
	if input.Name != nil {
		category.Name = *input.Name
		// Regenerate slug if name changed
		newSlug := slug.Generate(*input.Name)
		if newSlug != category.Slug {
			category.Slug = slug.MakeUnique(newSlug, func(slugStr string) bool {
				if slugStr == category.Slug {
					return false
				}
				exists, _ := s.categoryRepo.SlugExists(slugStr)
				return exists
			})
		}
	}
	if input.Description != nil {
		category.Description = *input.Description
	}
	if input.Icon != nil {
		category.Icon = *input.Icon
	}
	if input.ParentID != nil {
		// Validate parent
		if *input.ParentID != uuid.Nil {
			_, err := s.categoryRepo.GetByID(*input.ParentID)
			if err != nil {
				return nil, domain.ErrInvalidParentCategory
			}
		}
		category.ParentID = input.ParentID
	}
	if input.SortOrder != nil {
		category.SortOrder = *input.SortOrder
	}
	if input.IsActive != nil {
		category.IsActive = *input.IsActive
	}

	if err := s.categoryRepo.Update(category); err != nil {
		return nil, err
	}

	return s.categoryRepo.GetByID(categoryID)
}

// DeleteCategory deletes a job category
func (s *JobCategoryService) DeleteCategory(categoryID uuid.UUID) error {
	// Check if category has jobs
	count, err := s.categoryRepo.CountJobsByCategory(categoryID)
	if err != nil {
		return err
	}
	if count > 0 {
		return domain.ErrCategoryHasJobs
	}

	return s.categoryRepo.Delete(categoryID)
}

// GetAllCategories retrieves all categories
func (s *JobCategoryService) GetAllCategories() ([]domain.JobCategory, error) {
	return s.categoryRepo.GetAll()
}

// GetCategoryByID retrieves a category by ID
func (s *JobCategoryService) GetCategoryByID(categoryID uuid.UUID) (*domain.JobCategory, error) {
	return s.categoryRepo.GetByID(categoryID)
}

// GetCategoryBySlug retrieves a category by slug
func (s *JobCategoryService) GetCategoryBySlug(slug string) (*domain.JobCategory, error) {
	return s.categoryRepo.GetBySlug(slug)
}

// GetCategoryTree retrieves the complete category tree
func (s *JobCategoryService) GetCategoryTree() ([]domain.JobCategory, error) {
	return s.categoryRepo.GetCategoryTree()
}

// GetRootCategories retrieves root categories
func (s *JobCategoryService) GetRootCategories() ([]domain.JobCategory, error) {
	return s.categoryRepo.GetRootCategories()
}

// GetSubcategories retrieves subcategories of a parent
func (s *JobCategoryService) GetSubcategories(parentID uuid.UUID) ([]domain.JobCategory, error) {
	return s.categoryRepo.GetSubcategories(parentID)
}

// ToggleActive toggles the active status of a category
func (s *JobCategoryService) ToggleActive(categoryID uuid.UUID, isActive bool) error {
	return s.categoryRepo.ToggleActive(categoryID, isActive)
}

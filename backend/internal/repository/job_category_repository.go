package repository

import (
	"job-platform/internal/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// JobCategoryRepository handles job category database operations
type JobCategoryRepository struct {
	db *gorm.DB
}

// NewJobCategoryRepository creates a new job category repository
func NewJobCategoryRepository(db *gorm.DB) *JobCategoryRepository {
	return &JobCategoryRepository{db: db}
}

// Create creates a new job category
func (r *JobCategoryRepository) Create(category *domain.JobCategory) error {
	return r.db.Create(category).Error
}

// Update updates a job category
func (r *JobCategoryRepository) Update(category *domain.JobCategory) error {
	return r.db.Save(category).Error
}

// Delete deletes a job category
func (r *JobCategoryRepository) Delete(categoryID uuid.UUID) error {
	return r.db.Delete(&domain.JobCategory{}, "id = ?", categoryID).Error
}

// GetByID retrieves a category by ID
func (r *JobCategoryRepository) GetByID(categoryID uuid.UUID) (*domain.JobCategory, error) {
	var category domain.JobCategory
	err := r.db.
		Preload("Parent").
		Preload("Subcategories").
		Where("id = ?", categoryID).
		First(&category).Error
	if err != nil {
		return nil, err
	}
	return &category, nil
}

// GetBySlug retrieves a category by slug
func (r *JobCategoryRepository) GetBySlug(slug string) (*domain.JobCategory, error) {
	var category domain.JobCategory
	err := r.db.
		Preload("Parent").
		Preload("Subcategories").
		Where("slug = ?", slug).
		First(&category).Error
	if err != nil {
		return nil, err
	}
	return &category, nil
}

// GetAll retrieves all categories
func (r *JobCategoryRepository) GetAll() ([]domain.JobCategory, error) {
	var categories []domain.JobCategory
	err := r.db.
		Preload("Subcategories").
		Where("is_active = ?", true).
		Order("sort_order ASC, name ASC").
		Find(&categories).Error
	return categories, err
}

// GetRootCategories retrieves all root categories (no parent)
func (r *JobCategoryRepository) GetRootCategories() ([]domain.JobCategory, error) {
	var categories []domain.JobCategory
	err := r.db.
		Preload("Subcategories").
		Where("parent_id IS NULL AND is_active = ?", true).
		Order("sort_order ASC, name ASC").
		Find(&categories).Error
	return categories, err
}

// GetSubcategories retrieves subcategories of a parent category
func (r *JobCategoryRepository) GetSubcategories(parentID uuid.UUID) ([]domain.JobCategory, error) {
	var categories []domain.JobCategory
	err := r.db.
		Where("parent_id = ? AND is_active = ?", parentID, true).
		Order("sort_order ASC, name ASC").
		Find(&categories).Error
	return categories, err
}

// SlugExists checks if a slug already exists
func (r *JobCategoryRepository) SlugExists(slug string) (bool, error) {
	var count int64
	err := r.db.Model(&domain.JobCategory{}).
		Where("slug = ?", slug).
		Count(&count).Error
	return count > 0, err
}

// CountJobsByCategory counts jobs in a category
func (r *JobCategoryRepository) CountJobsByCategory(categoryID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&domain.JobCategoryMapping{}).
		Where("category_id = ?", categoryID).
		Count(&count).Error
	return count, err
}

// GetCategoryTree retrieves the complete category tree
func (r *JobCategoryRepository) GetCategoryTree() ([]domain.JobCategory, error) {
	var categories []domain.JobCategory
	err := r.db.
		Preload("Subcategories", func(db *gorm.DB) *gorm.DB {
			return db.Where("is_active = ?", true).Order("sort_order ASC, name ASC")
		}).
		Where("parent_id IS NULL AND is_active = ?", true).
		Order("sort_order ASC, name ASC").
		Find(&categories).Error
	return categories, err
}

// UpdateSortOrder updates the sort order of categories
func (r *JobCategoryRepository) UpdateSortOrder(categoryID uuid.UUID, sortOrder int) error {
	return r.db.Model(&domain.JobCategory{}).
		Where("id = ?", categoryID).
		Update("sort_order", sortOrder).Error
}

// ToggleActive toggles the active status of a category
func (r *JobCategoryRepository) ToggleActive(categoryID uuid.UUID, isActive bool) error {
	return r.db.Model(&domain.JobCategory{}).
		Where("id = ?", categoryID).
		Update("is_active", isActive).Error
}

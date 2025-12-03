package repository

import (
	"job-platform/internal/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// PortfolioRepository handles portfolio project data access
type PortfolioRepository struct {
	db *gorm.DB
}

// NewPortfolioRepository creates a new portfolio repository
func NewPortfolioRepository(db *gorm.DB) *PortfolioRepository {
	return &PortfolioRepository{db: db}
}

// Create creates a new portfolio project
func (r *PortfolioRepository) Create(project *domain.PortfolioProject) error {
	return r.db.Create(project).Error
}

// GetByID retrieves a portfolio project by ID
func (r *PortfolioRepository) GetByID(id uuid.UUID) (*domain.PortfolioProject, error) {
	var project domain.PortfolioProject
	err := r.db.Where("id = ?", id).First(&project).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, domain.ErrPortfolioNotFound
		}
		return nil, err
	}
	return &project, nil
}

// GetByIDAndUserID retrieves a portfolio project by ID and user ID
func (r *PortfolioRepository) GetByIDAndUserID(id, userID uuid.UUID) (*domain.PortfolioProject, error) {
	var project domain.PortfolioProject
	err := r.db.Where("id = ? AND user_id = ?", id, userID).First(&project).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, domain.ErrPortfolioNotFound
		}
		return nil, err
	}
	return &project, nil
}

// GetUserPortfolio retrieves all portfolio projects for a user
func (r *PortfolioRepository) GetUserPortfolio(userID uuid.UUID) ([]domain.PortfolioProject, error) {
	var projects []domain.PortfolioProject
	err := r.db.Where("user_id = ?", userID).
		Order("is_featured DESC, created_at DESC").
		Find(&projects).Error
	return projects, err
}

// Update updates a portfolio project
func (r *PortfolioRepository) Update(project *domain.PortfolioProject) error {
	return r.db.Save(project).Error
}

// Delete deletes a portfolio project
func (r *PortfolioRepository) Delete(id uuid.UUID) error {
	return r.db.Where("id = ?", id).Delete(&domain.PortfolioProject{}).Error
}

// GetFeaturedProjects retrieves featured projects for a user
func (r *PortfolioRepository) GetFeaturedProjects(userID uuid.UUID) ([]domain.PortfolioProject, error) {
	var projects []domain.PortfolioProject
	err := r.db.Where("user_id = ? AND is_featured = ?", userID, true).
		Order("created_at DESC").
		Find(&projects).Error
	return projects, err
}

// CountFeaturedProjects counts featured projects for a user
func (r *PortfolioRepository) CountFeaturedProjects(userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&domain.PortfolioProject{}).
		Where("user_id = ? AND is_featured = ?", userID, true).
		Count(&count).Error
	return count, err
}

// CountUserProjects counts portfolio projects for a user
func (r *PortfolioRepository) CountUserProjects(userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&domain.PortfolioProject{}).
		Where("user_id = ?", userID).
		Count(&count).Error
	return count, err
}

// SetFeatured sets or unsets a project as featured
func (r *PortfolioRepository) SetFeatured(id uuid.UUID, featured bool) error {
	return r.db.Model(&domain.PortfolioProject{}).
		Where("id = ?", id).
		Update("is_featured", featured).Error
}

// UnsetAllFeatured unsets all featured projects for a user
func (r *PortfolioRepository) UnsetAllFeatured(userID uuid.UUID) error {
	return r.db.Model(&domain.PortfolioProject{}).
		Where("user_id = ? AND is_featured = ?", userID, true).
		Update("is_featured", false).Error
}

// GetByTechnology retrieves projects by technology
func (r *PortfolioRepository) GetByTechnology(userID uuid.UUID, technology string) ([]domain.PortfolioProject, error) {
	var projects []domain.PortfolioProject
	err := r.db.Where("user_id = ? AND ? = ANY(technologies)", userID, technology).
		Order("created_at DESC").
		Find(&projects).Error
	return projects, err
}

// GetOngoingProjects retrieves ongoing projects for a user
func (r *PortfolioRepository) GetOngoingProjects(userID uuid.UUID) ([]domain.PortfolioProject, error) {
	var projects []domain.PortfolioProject
	err := r.db.Where("user_id = ? AND start_date IS NOT NULL AND end_date IS NULL", userID).
		Order("start_date DESC").
		Find(&projects).Error
	return projects, err
}

// ExistsByID checks if a portfolio project exists
func (r *PortfolioRepository) ExistsByID(id uuid.UUID) (bool, error) {
	var count int64
	err := r.db.Model(&domain.PortfolioProject{}).
		Where("id = ?", id).
		Count(&count).Error
	return count > 0, err
}

// DeleteUserPortfolio deletes all portfolio projects for a user
func (r *PortfolioRepository) DeleteUserPortfolio(userID uuid.UUID) error {
	return r.db.Where("user_id = ?", userID).Delete(&domain.PortfolioProject{}).Error
}

// GetProjectsWithLinks retrieves projects that have project or source code URLs
func (r *PortfolioRepository) GetProjectsWithLinks(userID uuid.UUID) ([]domain.PortfolioProject, error) {
	var projects []domain.PortfolioProject
	err := r.db.Where("user_id = ?", userID).
		Where("project_url IS NOT NULL OR source_code_url IS NOT NULL").
		Order("created_at DESC").
		Find(&projects).Error
	return projects, err
}

// GetProjectsWithMedia retrieves projects that have images or thumbnails
func (r *PortfolioRepository) GetProjectsWithMedia(userID uuid.UUID) ([]domain.PortfolioProject, error) {
	var projects []domain.PortfolioProject
	err := r.db.Where("user_id = ?", userID).
		Where("thumbnail_url IS NOT NULL OR CARDINALITY(images) > 0").
		Order("created_at DESC").
		Find(&projects).Error
	return projects, err
}

// SearchByTitle searches projects by title
func (r *PortfolioRepository) SearchByTitle(userID uuid.UUID, query string) ([]domain.PortfolioProject, error) {
	var projects []domain.PortfolioProject
	err := r.db.Where("user_id = ? AND title ILIKE ?", userID, "%"+query+"%").
		Order("created_at DESC").
		Find(&projects).Error
	return projects, err
}

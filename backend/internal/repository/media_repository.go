package repository

import (
	"job-platform/internal/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// MediaRepository handles company media data operations
type MediaRepository struct {
	db *gorm.DB
}

// NewMediaRepository creates a new media repository
func NewMediaRepository(db *gorm.DB) *MediaRepository {
	return &MediaRepository{db: db}
}

// Create creates a new media item
func (r *MediaRepository) Create(media *domain.CompanyMedia) error {
	return r.db.Create(media).Error
}

// GetByID retrieves a media item by ID
func (r *MediaRepository) GetByID(id uuid.UUID) (*domain.CompanyMedia, error) {
	var media domain.CompanyMedia
	err := r.db.Where("id = ?", id).First(&media).Error
	if err != nil {
		return nil, err
	}
	return &media, nil
}

// GetCompanyMedia retrieves all media for a company
func (r *MediaRepository) GetCompanyMedia(companyID uuid.UUID) ([]*domain.CompanyMedia, error) {
	var media []*domain.CompanyMedia
	err := r.db.Where("company_id = ?", companyID).
		Order("is_featured DESC, sort_order ASC, created_at DESC").
		Find(&media).Error
	return media, err
}

// GetByType retrieves media by type for a company
func (r *MediaRepository) GetByType(companyID uuid.UUID, mediaType domain.MediaType) ([]*domain.CompanyMedia, error) {
	var media []*domain.CompanyMedia
	err := r.db.Where("company_id = ? AND type = ?", companyID, mediaType).
		Order("is_featured DESC, sort_order ASC, created_at DESC").
		Find(&media).Error
	return media, err
}

// GetFeaturedMedia retrieves featured media for a company
func (r *MediaRepository) GetFeaturedMedia(companyID uuid.UUID) ([]*domain.CompanyMedia, error) {
	var media []*domain.CompanyMedia
	err := r.db.Where("company_id = ? AND is_featured = ?", companyID, true).
		Order("sort_order ASC, created_at DESC").
		Find(&media).Error
	return media, err
}

// Update updates a media item
func (r *MediaRepository) Update(media *domain.CompanyMedia) error {
	return r.db.Save(media).Error
}

// UpdateSortOrder updates the sort order of a media item
func (r *MediaRepository) UpdateSortOrder(id uuid.UUID, sortOrder int) error {
	return r.db.Model(&domain.CompanyMedia{}).
		Where("id = ?", id).
		Update("sort_order", sortOrder).Error
}

// SetFeatured sets a media item as featured
func (r *MediaRepository) SetFeatured(id uuid.UUID, isFeatured bool) error {
	return r.db.Model(&domain.CompanyMedia{}).
		Where("id = ?", id).
		Update("is_featured", isFeatured).Error
}

// UnfeatureAll removes featured status from all media for a company
func (r *MediaRepository) UnfeatureAll(companyID uuid.UUID) error {
	return r.db.Model(&domain.CompanyMedia{}).
		Where("company_id = ?", companyID).
		Update("is_featured", false).Error
}

// Delete deletes a media item
func (r *MediaRepository) Delete(id uuid.UUID) error {
	return r.db.Where("id = ?", id).Delete(&domain.CompanyMedia{}).Error
}

// DeleteCompanyMedia deletes all media for a company
func (r *MediaRepository) DeleteCompanyMedia(companyID uuid.UUID) error {
	return r.db.Where("company_id = ?", companyID).Delete(&domain.CompanyMedia{}).Error
}

// CountByCompany counts media items for a company
func (r *MediaRepository) CountByCompany(companyID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&domain.CompanyMedia{}).
		Where("company_id = ?", companyID).
		Count(&count).Error
	return count, err
}

// CountByType counts media items by type for a company
func (r *MediaRepository) CountByType(companyID uuid.UUID, mediaType domain.MediaType) (int64, error) {
	var count int64
	err := r.db.Model(&domain.CompanyMedia{}).
		Where("company_id = ? AND type = ?", companyID, mediaType).
		Count(&count).Error
	return count, err
}

// ReorderMedia updates sort orders for multiple media items
func (r *MediaRepository) ReorderMedia(updates map[uuid.UUID]int) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		for mediaID, sortOrder := range updates {
			if err := tx.Model(&domain.CompanyMedia{}).
				Where("id = ?", mediaID).
				Update("sort_order", sortOrder).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

// GetMaxSortOrder gets the maximum sort order for a company's media
func (r *MediaRepository) GetMaxSortOrder(companyID uuid.UUID) (int, error) {
	var maxSort int
	err := r.db.Model(&domain.CompanyMedia{}).
		Where("company_id = ?", companyID).
		Select("COALESCE(MAX(sort_order), 0)").
		Scan(&maxSort).Error
	return maxSort, err
}

// BulkCreate creates multiple media items
func (r *MediaRepository) BulkCreate(media []*domain.CompanyMedia) error {
	return r.db.Create(&media).Error
}

// GetImages retrieves all images for a company
func (r *MediaRepository) GetImages(companyID uuid.UUID) ([]*domain.CompanyMedia, error) {
	return r.GetByType(companyID, domain.MediaTypeImage)
}

// GetVideos retrieves all videos for a company
func (r *MediaRepository) GetVideos(companyID uuid.UUID) ([]*domain.CompanyMedia, error) {
	return r.GetByType(companyID, domain.MediaTypeVideo)
}

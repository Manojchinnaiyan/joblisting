package repository

import (
	"job-platform/internal/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// BenefitRepository handles company benefit data operations
type BenefitRepository struct {
	db *gorm.DB
}

// NewBenefitRepository creates a new benefit repository
func NewBenefitRepository(db *gorm.DB) *BenefitRepository {
	return &BenefitRepository{db: db}
}

// Create creates a new benefit
func (r *BenefitRepository) Create(benefit *domain.CompanyBenefit) error {
	return r.db.Create(benefit).Error
}

// GetByID retrieves a benefit by ID
func (r *BenefitRepository) GetByID(id uuid.UUID) (*domain.CompanyBenefit, error) {
	var benefit domain.CompanyBenefit
	err := r.db.Where("id = ?", id).First(&benefit).Error
	if err != nil {
		return nil, err
	}
	return &benefit, nil
}

// GetCompanyBenefits retrieves all benefits for a company
func (r *BenefitRepository) GetCompanyBenefits(companyID uuid.UUID) ([]*domain.CompanyBenefit, error) {
	var benefits []*domain.CompanyBenefit
	err := r.db.Where("company_id = ?", companyID).
		Order("sort_order ASC, created_at ASC").
		Find(&benefits).Error
	return benefits, err
}

// GetByCategory retrieves benefits by category for a company
func (r *BenefitRepository) GetByCategory(companyID uuid.UUID, category domain.BenefitCategory) ([]*domain.CompanyBenefit, error) {
	var benefits []*domain.CompanyBenefit
	err := r.db.Where("company_id = ? AND category = ?", companyID, category).
		Order("sort_order ASC, created_at ASC").
		Find(&benefits).Error
	return benefits, err
}

// Update updates a benefit
func (r *BenefitRepository) Update(benefit *domain.CompanyBenefit) error {
	return r.db.Save(benefit).Error
}

// UpdateSortOrder updates the sort order of a benefit
func (r *BenefitRepository) UpdateSortOrder(id uuid.UUID, sortOrder int) error {
	return r.db.Model(&domain.CompanyBenefit{}).
		Where("id = ?", id).
		Update("sort_order", sortOrder).Error
}

// Delete deletes a benefit
func (r *BenefitRepository) Delete(id uuid.UUID) error {
	return r.db.Where("id = ?", id).Delete(&domain.CompanyBenefit{}).Error
}

// DeleteCompanyBenefits deletes all benefits for a company
func (r *BenefitRepository) DeleteCompanyBenefits(companyID uuid.UUID) error {
	return r.db.Where("company_id = ?", companyID).Delete(&domain.CompanyBenefit{}).Error
}

// CountByCompany counts benefits for a company
func (r *BenefitRepository) CountByCompany(companyID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&domain.CompanyBenefit{}).
		Where("company_id = ?", companyID).
		Count(&count).Error
	return count, err
}

// CountByCategory counts benefits by category for a company
func (r *BenefitRepository) CountByCategory(companyID uuid.UUID, category domain.BenefitCategory) (int64, error) {
	var count int64
	err := r.db.Model(&domain.CompanyBenefit{}).
		Where("company_id = ? AND category = ?", companyID, category).
		Count(&count).Error
	return count, err
}

// ReorderBenefits updates sort orders for multiple benefits
func (r *BenefitRepository) ReorderBenefits(updates map[uuid.UUID]int) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		for benefitID, sortOrder := range updates {
			if err := tx.Model(&domain.CompanyBenefit{}).
				Where("id = ?", benefitID).
				Update("sort_order", sortOrder).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

// GetMaxSortOrder gets the maximum sort order for a company's benefits
func (r *BenefitRepository) GetMaxSortOrder(companyID uuid.UUID) (int, error) {
	var maxSort int
	err := r.db.Model(&domain.CompanyBenefit{}).
		Where("company_id = ?", companyID).
		Select("COALESCE(MAX(sort_order), 0)").
		Scan(&maxSort).Error
	return maxSort, err
}

// BulkCreate creates multiple benefits
func (r *BenefitRepository) BulkCreate(benefits []*domain.CompanyBenefit) error {
	return r.db.Create(&benefits).Error
}

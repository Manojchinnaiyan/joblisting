package service

import (
	"job-platform/internal/domain"
	"job-platform/internal/repository"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// BenefitService handles company benefit business logic
type BenefitService struct {
	benefitRepo *repository.BenefitRepository
	companyRepo *repository.CompanyRepository
}

// NewBenefitService creates a new benefit service
func NewBenefitService(
	benefitRepo *repository.BenefitRepository,
	companyRepo *repository.CompanyRepository,
) *BenefitService {
	return &BenefitService{
		benefitRepo: benefitRepo,
		companyRepo: companyRepo,
	}
}

// CreateBenefit creates a new company benefit
func (s *BenefitService) CreateBenefit(companyID uuid.UUID, req *domain.CompanyBenefit) (*domain.CompanyBenefit, error) {
	// Check if company exists
	_, err := s.companyRepo.GetByID(companyID)
	if err != nil {
		return nil, domain.ErrCompanyNotFound
	}

	// Get max sort order
	maxSort, err := s.benefitRepo.GetMaxSortOrder(companyID)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	benefit := &domain.CompanyBenefit{
		ID:          uuid.New(),
		CompanyID:   companyID,
		Title:       req.Title,
		Description: req.Description,
		Category:    req.Category,
		Icon:        req.Icon,
		SortOrder:   maxSort + 1,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	if err := s.benefitRepo.Create(benefit); err != nil {
		return nil, err
	}

	return benefit, nil
}

// GetBenefitByID retrieves a benefit by ID
func (s *BenefitService) GetBenefitByID(id uuid.UUID) (*domain.CompanyBenefit, error) {
	benefit, err := s.benefitRepo.GetByID(id)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, domain.ErrBenefitNotFound
		}
		return nil, err
	}
	return benefit, nil
}

// GetCompanyBenefits retrieves all benefits for a company
func (s *BenefitService) GetCompanyBenefits(companyID uuid.UUID) ([]*domain.CompanyBenefit, error) {
	return s.benefitRepo.GetCompanyBenefits(companyID)
}

// GetBenefitsByCategory retrieves benefits by category for a company
func (s *BenefitService) GetBenefitsByCategory(companyID uuid.UUID, category domain.BenefitCategory) ([]*domain.CompanyBenefit, error) {
	return s.benefitRepo.GetByCategory(companyID, category)
}

// UpdateBenefit updates a company benefit
func (s *BenefitService) UpdateBenefit(id uuid.UUID, req *domain.CompanyBenefit) (*domain.CompanyBenefit, error) {
	benefit, err := s.benefitRepo.GetByID(id)
	if err != nil {
		return nil, domain.ErrBenefitNotFound
	}

	benefit.Title = req.Title
	benefit.Description = req.Description
	benefit.Category = req.Category
	benefit.Icon = req.Icon
	benefit.UpdatedAt = time.Now()

	if err := s.benefitRepo.Update(benefit); err != nil {
		return nil, err
	}

	return benefit, nil
}

// DeleteBenefit deletes a company benefit
func (s *BenefitService) DeleteBenefit(id uuid.UUID) error {
	_, err := s.benefitRepo.GetByID(id)
	if err != nil {
		return domain.ErrBenefitNotFound
	}

	return s.benefitRepo.Delete(id)
}

// ReorderBenefits updates sort orders for multiple benefits
func (s *BenefitService) ReorderBenefits(updates map[uuid.UUID]int) error {
	return s.benefitRepo.ReorderBenefits(updates)
}

// CountByCompany counts benefits for a company
func (s *BenefitService) CountByCompany(companyID uuid.UUID) (int64, error) {
	return s.benefitRepo.CountByCompany(companyID)
}

// CountByCategory counts benefits by category for a company
func (s *BenefitService) CountByCategory(companyID uuid.UUID, category domain.BenefitCategory) (int64, error) {
	return s.benefitRepo.CountByCategory(companyID, category)
}

// BulkCreateBenefits creates multiple benefits for a company
func (s *BenefitService) BulkCreateBenefits(companyID uuid.UUID, benefits []*domain.CompanyBenefit) error {
	// Check if company exists
	_, err := s.companyRepo.GetByID(companyID)
	if err != nil {
		return domain.ErrCompanyNotFound
	}

	// Get max sort order
	maxSort, err := s.benefitRepo.GetMaxSortOrder(companyID)
	if err != nil {
		return err
	}

	now := time.Now()
	for i, benefit := range benefits {
		benefit.ID = uuid.New()
		benefit.CompanyID = companyID
		benefit.SortOrder = maxSort + i + 1
		benefit.CreatedAt = now
		benefit.UpdatedAt = now
	}

	return s.benefitRepo.BulkCreate(benefits)
}

// UpdateSortOrder updates the sort order of a benefit
func (s *BenefitService) UpdateSortOrder(id uuid.UUID, sortOrder int) error {
	_, err := s.benefitRepo.GetByID(id)
	if err != nil {
		return domain.ErrBenefitNotFound
	}

	return s.benefitRepo.UpdateSortOrder(id, sortOrder)
}

// GetBenefitsByCompanyGrouped retrieves benefits grouped by category
func (s *BenefitService) GetBenefitsByCompanyGrouped(companyID uuid.UUID) (map[domain.BenefitCategory][]*domain.CompanyBenefit, error) {
	benefits, err := s.benefitRepo.GetCompanyBenefits(companyID)
	if err != nil {
		return nil, err
	}

	grouped := make(map[domain.BenefitCategory][]*domain.CompanyBenefit)
	for _, benefit := range benefits {
		grouped[benefit.Category] = append(grouped[benefit.Category], benefit)
	}

	return grouped, nil
}

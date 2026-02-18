package repository

import (
	"fmt"
	"job-platform/internal/domain"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/gosimple/slug"
	"gorm.io/gorm"
)

// CompanyRepository handles company data operations
type CompanyRepository struct {
	db *gorm.DB
}

// NewCompanyRepository creates a new company repository
func NewCompanyRepository(db *gorm.DB) *CompanyRepository {
	return &CompanyRepository{db: db}
}

// Create creates a new company
func (r *CompanyRepository) Create(company *domain.Company) error {
	return r.db.Create(company).Error
}

// GetByID retrieves a company by ID
func (r *CompanyRepository) GetByID(id uuid.UUID) (*domain.Company, error) {
	var company domain.Company
	err := r.db.Where("id = ? AND deleted_at IS NULL", id).First(&company).Error
	if err != nil {
		return nil, err
	}
	return &company, nil
}

// GetBySlug retrieves a company by slug
func (r *CompanyRepository) GetBySlug(slug string) (*domain.Company, error) {
	var company domain.Company
	err := r.db.Where("slug = ? AND deleted_at IS NULL", slug).First(&company).Error
	if err != nil {
		return nil, err
	}
	return &company, nil
}

// GetByUserID retrieves a company created by user
func (r *CompanyRepository) GetByUserID(userID uuid.UUID) (*domain.Company, error) {
	var company domain.Company
	err := r.db.Where("created_by = ? AND deleted_at IS NULL", userID).First(&company).Error
	if err != nil {
		return nil, err
	}
	return &company, nil
}

// Update updates a company
func (r *CompanyRepository) Update(company *domain.Company) error {
	return r.db.Save(company).Error
}

// Delete soft deletes a company
func (r *CompanyRepository) Delete(id uuid.UUID) error {
	now := time.Now()
	return r.db.Model(&domain.Company{}).
		Where("id = ?", id).
		Update("deleted_at", now).Error
}

// HardDelete permanently deletes a company
func (r *CompanyRepository) HardDelete(id uuid.UUID) error {
	return r.db.Unscoped().Where("id = ?", id).Delete(&domain.Company{}).Error
}

// List retrieves companies with filters and pagination
func (r *CompanyRepository) List(filters map[string]interface{}, limit, offset int) ([]*domain.Company, int64, error) {
	var companies []*domain.Company
	var total int64

	query := r.db.Model(&domain.Company{}).Where("deleted_at IS NULL")

	// Apply filters
	if status, ok := filters["status"].(string); ok && status != "" {
		query = query.Where("status = ?", status)
	}
	if industry, ok := filters["industry"].(string); ok && industry != "" {
		query = query.Where("industry = ?", industry)
	}
	if companySize, ok := filters["company_size"].(string); ok && companySize != "" {
		query = query.Where("company_size = ?", companySize)
	}
	if verified, ok := filters["is_verified"].(bool); ok {
		query = query.Where("is_verified = ?", verified)
	}
	if featured, ok := filters["is_featured"].(bool); ok {
		query = query.Where("is_featured = ?", featured)
	}
	if city, ok := filters["city"].(string); ok && city != "" {
		// Search in locations
		query = query.Joins("JOIN company_locations ON company_locations.company_id = companies.id").
			Where("company_locations.city = ?", city)
	}
	if country, ok := filters["country"].(string); ok && country != "" {
		// Search in locations
		query = query.Joins("JOIN company_locations ON company_locations.company_id = companies.id").
			Where("company_locations.country = ?", country)
	}

	// Search
	if search, ok := filters["search"].(string); ok && search != "" {
		searchPattern := "%" + strings.ToLower(search) + "%"
		query = query.Where("LOWER(name) LIKE ? OR LOWER(description) LIKE ?", searchPattern, searchPattern)
	}

	// Count total
	countQuery := query
	if err := countQuery.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get results
	err := query.
		Preload("Locations").
		Order("is_featured DESC, is_verified DESC, created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&companies).Error

	return companies, total, err
}

// GetFeatured retrieves featured companies
func (r *CompanyRepository) GetFeatured(limit int) ([]*domain.Company, error) {
	var companies []*domain.Company
	err := r.db.
		Where("is_featured = ? AND status = ? AND deleted_at IS NULL", true, domain.CompanyStatusActive).
		Where("featured_until IS NULL OR featured_until > ?", time.Now()).
		Preload("Locations").
		Order("created_at DESC").
		Limit(limit).
		Find(&companies).Error
	return companies, err
}

// GetCompaniesForSitemap retrieves all active companies for sitemap generation (minimal data)
func (r *CompanyRepository) GetCompaniesForSitemap() ([]*domain.Company, error) {
	var companies []*domain.Company
	err := r.db.
		Select("id, slug, updated_at").
		Where("status = ? AND deleted_at IS NULL", domain.CompanyStatusActive).
		Order("updated_at DESC").
		Find(&companies).Error
	return companies, err
}

// ExistsWithSlug checks if a company with slug exists
func (r *CompanyRepository) ExistsWithSlug(slug string) (bool, error) {
	var count int64
	err := r.db.Model(&domain.Company{}).
		Where("slug = ? AND deleted_at IS NULL", slug).
		Count(&count).Error
	return count > 0, err
}

// UserHasCompany checks if user has a company
func (r *CompanyRepository) UserHasCompany(userID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.Model(&domain.Company{}).
		Where("created_by = ? AND deleted_at IS NULL", userID).
		Count(&count).Error
	return count > 0, err
}

// GenerateUniqueSlug generates a unique slug for company name
func (r *CompanyRepository) GenerateUniqueSlug(name string) (string, error) {
	baseSlug := slug.Make(name)
	currentSlug := baseSlug
	counter := 1

	for {
		exists, err := r.ExistsWithSlug(currentSlug)
		if err != nil {
			return "", err
		}
		if !exists {
			return currentSlug, nil
		}
		currentSlug = fmt.Sprintf("%s-%d", baseSlug, counter)
		counter++
	}
}

// UpdateStats updates company statistics
func (r *CompanyRepository) UpdateStats(companyID uuid.UUID, stats map[string]interface{}) error {
	return r.db.Model(&domain.Company{}).
		Where("id = ?", companyID).
		Updates(stats).Error
}

// IncrementFollowers increments followers count
func (r *CompanyRepository) IncrementFollowers(companyID uuid.UUID, delta int) error {
	return r.db.Model(&domain.Company{}).
		Where("id = ?", companyID).
		UpdateColumn("followers_count", gorm.Expr("followers_count + ?", delta)).Error
}

// IncrementReviews increments reviews count
func (r *CompanyRepository) IncrementReviews(companyID uuid.UUID, delta int) error {
	return r.db.Model(&domain.Company{}).
		Where("id = ?", companyID).
		UpdateColumn("reviews_count", gorm.Expr("reviews_count + ?", delta)).Error
}

// UpdateAverageRating updates average rating
func (r *CompanyRepository) UpdateAverageRating(companyID uuid.UUID, rating float32) error {
	return r.db.Model(&domain.Company{}).
		Where("id = ?", companyID).
		Update("average_rating", rating).Error
}

// GetPendingVerification retrieves companies pending verification
func (r *CompanyRepository) GetPendingVerification(limit, offset int) ([]*domain.Company, int64, error) {
	var companies []*domain.Company
	var total int64

	query := r.db.Model(&domain.Company{}).
		Where("status = ? AND deleted_at IS NULL", domain.CompanyStatusPending)

	// Count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get results
	err := query.
		Preload("Creator").
		Order("created_at ASC").
		Limit(limit).
		Offset(offset).
		Find(&companies).Error

	return companies, total, err
}

// Verify verifies a company
func (r *CompanyRepository) Verify(companyID, adminID uuid.UUID) error {
	now := time.Now()
	return r.db.Model(&domain.Company{}).
		Where("id = ?", companyID).
		Updates(map[string]interface{}{
			"is_verified": true,
			"verified_at": now,
			"verified_by": adminID,
			"status":      domain.CompanyStatusVerified,
		}).Error
}

// Unverify removes verification from a company
func (r *CompanyRepository) Unverify(companyID uuid.UUID) error {
	return r.db.Model(&domain.Company{}).
		Where("id = ?", companyID).
		Updates(map[string]interface{}{
			"is_verified": false,
			"verified_at": nil,
			"verified_by": nil,
			"status":      domain.CompanyStatusActive,
		}).Error
}

// Reject rejects a company verification
func (r *CompanyRepository) Reject(companyID uuid.UUID, reason string) error {
	return r.db.Model(&domain.Company{}).
		Where("id = ?", companyID).
		Updates(map[string]interface{}{
			"status":           domain.CompanyStatusRejected,
			"rejection_reason": reason,
		}).Error
}

// Feature features a company
func (r *CompanyRepository) Feature(companyID uuid.UUID, until *time.Time) error {
	updates := map[string]interface{}{
		"is_featured": true,
	}
	if until != nil {
		updates["featured_until"] = until
	}
	return r.db.Model(&domain.Company{}).
		Where("id = ?", companyID).
		Updates(updates).Error
}

// Unfeature removes featuring from a company
func (r *CompanyRepository) Unfeature(companyID uuid.UUID) error {
	return r.db.Model(&domain.Company{}).
		Where("id = ?", companyID).
		Updates(map[string]interface{}{
			"is_featured":    false,
			"featured_until": nil,
		}).Error
}

// Suspend suspends a company
func (r *CompanyRepository) Suspend(companyID uuid.UUID) error {
	return r.db.Model(&domain.Company{}).
		Where("id = ?", companyID).
		Update("status", domain.CompanyStatusSuspended).Error
}

// Activate activates a company
func (r *CompanyRepository) Activate(companyID uuid.UUID) error {
	return r.db.Model(&domain.Company{}).
		Where("id = ?", companyID).
		Update("status", domain.CompanyStatusActive).Error
}

// GetIndustries retrieves distinct industries
func (r *CompanyRepository) GetIndustries() ([]string, error) {
	var industries []string
	err := r.db.Model(&domain.Company{}).
		Where("deleted_at IS NULL").
		Distinct("industry").
		Order("industry ASC").
		Pluck("industry", &industries).Error
	return industries, err
}

// CountByStatus counts companies by status
func (r *CompanyRepository) CountByStatus(status domain.CompanyStatus) (int64, error) {
	var count int64
	err := r.db.Model(&domain.Company{}).
		Where("status = ? AND deleted_at IS NULL", status).
		Count(&count).Error
	return count, err
}

// CountCreatedSince counts companies created since a given time
func (r *CompanyRepository) CountCreatedSince(since time.Time) (int64, error) {
	var count int64
	err := r.db.Model(&domain.Company{}).
		Where("created_at >= ? AND deleted_at IS NULL", since).
		Count(&count).Error
	return count, err
}

// CountFeatured counts featured companies
func (r *CompanyRepository) CountFeatured() (int64, error) {
	var count int64
	err := r.db.Model(&domain.Company{}).
		Where("is_featured = ? AND deleted_at IS NULL", true).
		Count(&count).Error
	return count, err
}

// NameCount represents a name with count for analytics
type NameCount struct {
	Name  string `json:"name"`
	Count int64  `json:"count"`
}

// SizeCount represents a company size with count for analytics
type SizeCount struct {
	Size  string `json:"size"`
	Count int64  `json:"count"`
}

// CountByIndustry counts companies grouped by industry
func (r *CompanyRepository) CountByIndustry() ([]NameCount, error) {
	var results []NameCount
	err := r.db.Model(&domain.Company{}).
		Select("industry as name, COUNT(*) as count").
		Where("deleted_at IS NULL AND industry IS NOT NULL AND industry != ''").
		Group("industry").
		Order("count DESC").
		Scan(&results).Error
	return results, err
}

// CountBySize counts companies grouped by company size
func (r *CompanyRepository) CountBySize() ([]SizeCount, error) {
	var results []SizeCount
	err := r.db.Model(&domain.Company{}).
		Select("company_size as size, COUNT(*) as count").
		Where("deleted_at IS NULL AND company_size IS NOT NULL AND company_size != ''").
		Group("company_size").
		Order("count DESC").
		Scan(&results).Error
	return results, err
}

// CompaniesOverTimeEntry represents a time series data point
type CompaniesOverTimeEntry struct {
	Date  string `json:"date"`
	Value int64  `json:"value"`
}

// GetCompaniesOverTime returns monthly company registrations since a given time
func (r *CompanyRepository) GetCompaniesOverTime(since time.Time) ([]CompaniesOverTimeEntry, error) {
	var results []CompaniesOverTimeEntry
	err := r.db.Model(&domain.Company{}).
		Select("TO_CHAR(created_at, 'YYYY-MM') as date, COUNT(*) as value").
		Where("created_at >= ? AND deleted_at IS NULL", since).
		Group("TO_CHAR(created_at, 'YYYY-MM')").
		Order("date ASC").
		Scan(&results).Error
	return results, err
}

// GetCompanyJobs retrieves jobs for a company
func (r *CompanyRepository) GetCompanyJobs(companyID uuid.UUID, limit, offset int) ([]*domain.Job, int64, error) {
	var jobs []*domain.Job
	var total int64

	query := r.db.Model(&domain.Job{}).Where("company_id = ?", companyID)

	// Count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get results
	err := query.
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&jobs).Error

	return jobs, total, err
}

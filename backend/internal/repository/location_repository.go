package repository

import (
	"job-platform/internal/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// LocationRepository handles company location data operations
type LocationRepository struct {
	db *gorm.DB
}

// NewLocationRepository creates a new location repository
func NewLocationRepository(db *gorm.DB) *LocationRepository {
	return &LocationRepository{db: db}
}

// Create creates a new location
func (r *LocationRepository) Create(location *domain.CompanyLocation) error {
	return r.db.Create(location).Error
}

// GetByID retrieves a location by ID
func (r *LocationRepository) GetByID(id uuid.UUID) (*domain.CompanyLocation, error) {
	var location domain.CompanyLocation
	err := r.db.Where("id = ?", id).First(&location).Error
	if err != nil {
		return nil, err
	}
	return &location, nil
}

// GetCompanyLocations retrieves all locations for a company
func (r *LocationRepository) GetCompanyLocations(companyID uuid.UUID) ([]*domain.CompanyLocation, error) {
	var locations []*domain.CompanyLocation
	err := r.db.Where("company_id = ?", companyID).
		Order("is_headquarters DESC, name ASC").
		Find(&locations).Error
	return locations, err
}

// GetHeadquarters retrieves the headquarters location for a company
func (r *LocationRepository) GetHeadquarters(companyID uuid.UUID) (*domain.CompanyLocation, error) {
	var location domain.CompanyLocation
	err := r.db.Where("company_id = ? AND is_headquarters = ?", companyID, true).
		First(&location).Error
	if err != nil {
		return nil, err
	}
	return &location, nil
}

// GetHiringLocations retrieves locations where company is hiring
func (r *LocationRepository) GetHiringLocations(companyID uuid.UUID) ([]*domain.CompanyLocation, error) {
	var locations []*domain.CompanyLocation
	err := r.db.Where("company_id = ? AND is_hiring = ?", companyID, true).
		Order("is_headquarters DESC, name ASC").
		Find(&locations).Error
	return locations, err
}

// Update updates a location
func (r *LocationRepository) Update(location *domain.CompanyLocation) error {
	return r.db.Save(location).Error
}

// Delete deletes a location
func (r *LocationRepository) Delete(id uuid.UUID) error {
	return r.db.Where("id = ?", id).Delete(&domain.CompanyLocation{}).Error
}

// DeleteCompanyLocations deletes all locations for a company
func (r *LocationRepository) DeleteCompanyLocations(companyID uuid.UUID) error {
	return r.db.Where("company_id = ?", companyID).Delete(&domain.CompanyLocation{}).Error
}

// SetHeadquarters sets a location as headquarters and unsets others
func (r *LocationRepository) SetHeadquarters(companyID, locationID uuid.UUID) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Unset all headquarters for this company
		if err := tx.Model(&domain.CompanyLocation{}).
			Where("company_id = ?", companyID).
			Update("is_headquarters", false).Error; err != nil {
			return err
		}

		// Set the specified location as headquarters
		if err := tx.Model(&domain.CompanyLocation{}).
			Where("id = ? AND company_id = ?", locationID, companyID).
			Update("is_headquarters", true).Error; err != nil {
			return err
		}

		return nil
	})
}

// ToggleHiring toggles the is_hiring status of a location
func (r *LocationRepository) ToggleHiring(id uuid.UUID, isHiring bool) error {
	return r.db.Model(&domain.CompanyLocation{}).
		Where("id = ?", id).
		Update("is_hiring", isHiring).Error
}

// CountByCompany counts locations for a company
func (r *LocationRepository) CountByCompany(companyID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&domain.CompanyLocation{}).
		Where("company_id = ?", companyID).
		Count(&count).Error
	return count, err
}

// ExistsByCompany checks if a company has any locations
func (r *LocationRepository) ExistsByCompany(companyID uuid.UUID) (bool, error) {
	count, err := r.CountByCompany(companyID)
	return count > 0, err
}

// HasHeadquarters checks if a company has a headquarters location
func (r *LocationRepository) HasHeadquarters(companyID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.Model(&domain.CompanyLocation{}).
		Where("company_id = ? AND is_headquarters = ?", companyID, true).
		Count(&count).Error
	return count > 0, err
}

// SearchByCity retrieves locations in a specific city
func (r *LocationRepository) SearchByCity(city string, limit, offset int) ([]*domain.CompanyLocation, int64, error) {
	var locations []*domain.CompanyLocation
	var total int64

	query := r.db.Model(&domain.CompanyLocation{}).
		Preload("Company").
		Where("city = ?", city)

	// Count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get results
	err := query.
		Order("is_headquarters DESC, name ASC").
		Limit(limit).
		Offset(offset).
		Find(&locations).Error

	return locations, total, err
}

// SearchByCountry retrieves locations in a specific country
func (r *LocationRepository) SearchByCountry(country string, limit, offset int) ([]*domain.CompanyLocation, int64, error) {
	var locations []*domain.CompanyLocation
	var total int64

	query := r.db.Model(&domain.CompanyLocation{}).
		Preload("Company").
		Where("country = ?", country)

	// Count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get results
	err := query.
		Order("city ASC, name ASC").
		Limit(limit).
		Offset(offset).
		Find(&locations).Error

	return locations, total, err
}

// GetDistinctCities retrieves distinct cities with company locations
func (r *LocationRepository) GetDistinctCities(country *string) ([]string, error) {
	var cities []string
	query := r.db.Model(&domain.CompanyLocation{}).Distinct("city")

	if country != nil {
		query = query.Where("country = ?", *country)
	}

	err := query.Order("city ASC").Pluck("city", &cities).Error
	return cities, err
}

// GetDistinctCountries retrieves distinct countries with company locations
func (r *LocationRepository) GetDistinctCountries() ([]string, error) {
	var countries []string
	err := r.db.Model(&domain.CompanyLocation{}).
		Distinct("country").
		Order("country ASC").
		Pluck("country", &countries).Error
	return countries, err
}

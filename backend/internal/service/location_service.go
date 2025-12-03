package service

import (
	"job-platform/internal/domain"
	"job-platform/internal/repository"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// LocationService handles company location business logic
type LocationService struct {
	locationRepo *repository.LocationRepository
	companyRepo  *repository.CompanyRepository
}

// NewLocationService creates a new location service
func NewLocationService(
	locationRepo *repository.LocationRepository,
	companyRepo *repository.CompanyRepository,
) *LocationService {
	return &LocationService{
		locationRepo: locationRepo,
		companyRepo:  companyRepo,
	}
}

// CreateLocation creates a new company location
func (s *LocationService) CreateLocation(companyID uuid.UUID, req *domain.CompanyLocation) (*domain.CompanyLocation, error) {
	// Check if company exists
	_, err := s.companyRepo.GetByID(companyID)
	if err != nil {
		return nil, domain.ErrCompanyNotFound
	}

	// If this is headquarters, check if company already has one
	if req.IsHeadquarters {
		hasHQ, err := s.locationRepo.HasHeadquarters(companyID)
		if err != nil {
			return nil, err
		}
		if hasHQ {
			// Unset existing headquarters
			if err := s.locationRepo.SetHeadquarters(companyID, uuid.Nil); err != nil {
				return nil, err
			}
		}
	}

	now := time.Now()
	location := &domain.CompanyLocation{
		ID:             uuid.New(),
		CompanyID:      companyID,
		Name:           req.Name,
		Address:        req.Address,
		City:           req.City,
		State:          req.State,
		Country:        req.Country,
		PostalCode:     req.PostalCode,
		Latitude:       req.Latitude,
		Longitude:      req.Longitude,
		Phone:          req.Phone,
		Email:          req.Email,
		IsHeadquarters: req.IsHeadquarters,
		IsHiring:       req.IsHiring,
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	if err := s.locationRepo.Create(location); err != nil {
		return nil, err
	}

	return location, nil
}

// GetLocationByID retrieves a location by ID
func (s *LocationService) GetLocationByID(id uuid.UUID) (*domain.CompanyLocation, error) {
	location, err := s.locationRepo.GetByID(id)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, domain.ErrLocationNotFound
		}
		return nil, err
	}
	return location, nil
}

// GetCompanyLocations retrieves all locations for a company
func (s *LocationService) GetCompanyLocations(companyID uuid.UUID) ([]*domain.CompanyLocation, error) {
	return s.locationRepo.GetCompanyLocations(companyID)
}

// GetHeadquarters retrieves the headquarters location for a company
func (s *LocationService) GetHeadquarters(companyID uuid.UUID) (*domain.CompanyLocation, error) {
	location, err := s.locationRepo.GetHeadquarters(companyID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, domain.ErrLocationNotFound
		}
		return nil, err
	}
	return location, nil
}

// GetHiringLocations retrieves locations where company is hiring
func (s *LocationService) GetHiringLocations(companyID uuid.UUID) ([]*domain.CompanyLocation, error) {
	return s.locationRepo.GetHiringLocations(companyID)
}

// UpdateLocation updates a company location
func (s *LocationService) UpdateLocation(id uuid.UUID, req *domain.CompanyLocation) (*domain.CompanyLocation, error) {
	location, err := s.locationRepo.GetByID(id)
	if err != nil {
		return nil, domain.ErrLocationNotFound
	}

	// If changing to headquarters, unset other headquarters
	if req.IsHeadquarters && !location.IsHeadquarters {
		if err := s.locationRepo.SetHeadquarters(location.CompanyID, id); err != nil {
			return nil, err
		}
	}

	location.Name = req.Name
	location.Address = req.Address
	location.City = req.City
	location.State = req.State
	location.Country = req.Country
	location.PostalCode = req.PostalCode
	location.Latitude = req.Latitude
	location.Longitude = req.Longitude
	location.Phone = req.Phone
	location.Email = req.Email
	location.IsHeadquarters = req.IsHeadquarters
	location.IsHiring = req.IsHiring
	location.UpdatedAt = time.Now()

	if err := s.locationRepo.Update(location); err != nil {
		return nil, err
	}

	return location, nil
}

// DeleteLocation deletes a company location
func (s *LocationService) DeleteLocation(id uuid.UUID) error {
	location, err := s.locationRepo.GetByID(id)
	if err != nil {
		return domain.ErrLocationNotFound
	}

	// Check if this is the only location
	count, err := s.locationRepo.CountByCompany(location.CompanyID)
	if err != nil {
		return err
	}
	if count == 1 {
		return domain.ErrCannotDeleteLastLocation
	}

	return s.locationRepo.Delete(id)
}

// SetHeadquarters sets a location as headquarters
func (s *LocationService) SetHeadquarters(companyID, locationID uuid.UUID) error {
	// Check if location exists and belongs to company
	location, err := s.locationRepo.GetByID(locationID)
	if err != nil {
		return domain.ErrLocationNotFound
	}

	if location.CompanyID != companyID {
		return domain.ErrLocationNotFound
	}

	return s.locationRepo.SetHeadquarters(companyID, locationID)
}

// ToggleHiring toggles the is_hiring status of a location
func (s *LocationService) ToggleHiring(id uuid.UUID, isHiring bool) error {
	_, err := s.locationRepo.GetByID(id)
	if err != nil {
		return domain.ErrLocationNotFound
	}

	return s.locationRepo.ToggleHiring(id, isHiring)
}

// CountByCompany counts locations for a company
func (s *LocationService) CountByCompany(companyID uuid.UUID) (int64, error) {
	return s.locationRepo.CountByCompany(companyID)
}

// SearchByCity retrieves locations in a specific city
func (s *LocationService) SearchByCity(city string, limit, offset int) ([]*domain.CompanyLocation, int64, error) {
	return s.locationRepo.SearchByCity(city, limit, offset)
}

// SearchByCountry retrieves locations in a specific country
func (s *LocationService) SearchByCountry(country string, limit, offset int) ([]*domain.CompanyLocation, int64, error) {
	return s.locationRepo.SearchByCountry(country, limit, offset)
}

// GetDistinctCities retrieves distinct cities with company locations
func (s *LocationService) GetDistinctCities(country *string) ([]string, error) {
	return s.locationRepo.GetDistinctCities(country)
}

// GetDistinctCountries retrieves distinct countries with company locations
func (s *LocationService) GetDistinctCountries() ([]string, error) {
	return s.locationRepo.GetDistinctCountries()
}

// BulkCreateLocations creates multiple locations for a company
func (s *LocationService) BulkCreateLocations(companyID uuid.UUID, locations []*domain.CompanyLocation) error {
	// Check if company exists
	_, err := s.companyRepo.GetByID(companyID)
	if err != nil {
		return domain.ErrCompanyNotFound
	}

	now := time.Now()
	for _, location := range locations {
		location.ID = uuid.New()
		location.CompanyID = companyID
		location.CreatedAt = now
		location.UpdatedAt = now

		if err := s.locationRepo.Create(location); err != nil {
			return err
		}
	}

	return nil
}

// HasHeadquarters checks if a company has a headquarters location
func (s *LocationService) HasHeadquarters(companyID uuid.UUID) (bool, error) {
	return s.locationRepo.HasHeadquarters(companyID)
}

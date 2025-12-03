package dto

import (
	"job-platform/internal/domain"
	"time"

	"github.com/google/uuid"
)

// ============================================
// LOCATION REQUEST DTOs
// ============================================

// CreateLocationRequest represents the request to create a location
type CreateLocationRequest struct {
	Name           string   `json:"name" binding:"required,max=255"`
	Address        string   `json:"address" binding:"required"`
	City           string   `json:"city" binding:"required,max=100"`
	State          *string  `json:"state" binding:"omitempty,max=100"`
	Country        string   `json:"country" binding:"required,max=100"`
	PostalCode     *string  `json:"postal_code" binding:"omitempty,max=20"`
	Latitude       *float64 `json:"latitude" binding:"omitempty"`
	Longitude      *float64 `json:"longitude" binding:"omitempty"`
	Phone          *string  `json:"phone" binding:"omitempty,max=20"`
	Email          *string  `json:"email" binding:"omitempty,email"`
	IsHeadquarters bool     `json:"is_headquarters"`
	IsHiring       bool     `json:"is_hiring"`
}

// UpdateLocationRequest represents the request to update a location
type UpdateLocationRequest struct {
	Name           string   `json:"name" binding:"required,max=255"`
	Address        string   `json:"address" binding:"required"`
	City           string   `json:"city" binding:"required,max=100"`
	State          *string  `json:"state" binding:"omitempty,max=100"`
	Country        string   `json:"country" binding:"required,max=100"`
	PostalCode     *string  `json:"postal_code" binding:"omitempty,max=20"`
	Latitude       *float64 `json:"latitude" binding:"omitempty"`
	Longitude      *float64 `json:"longitude" binding:"omitempty"`
	Phone          *string  `json:"phone" binding:"omitempty,max=20"`
	Email          *string  `json:"email" binding:"omitempty,email"`
	IsHeadquarters bool     `json:"is_headquarters"`
	IsHiring       bool     `json:"is_hiring"`
}

// ToggleHiringRequest represents the request to toggle hiring status
type ToggleHiringRequest struct {
	IsHiring bool `json:"is_hiring" binding:"required"`
}

// ============================================
// LOCATION RESPONSE DTOs
// ============================================

// LocationResponse represents a location response
type LocationResponse struct {
	ID             uuid.UUID `json:"id"`
	CompanyID      uuid.UUID `json:"company_id"`
	Name           string    `json:"name"`
	Address        string    `json:"address"`
	City           string    `json:"city"`
	State          *string   `json:"state"`
	Country        string    `json:"country"`
	PostalCode     *string   `json:"postal_code"`
	Latitude       *float64  `json:"latitude"`
	Longitude      *float64  `json:"longitude"`
	Phone          *string   `json:"phone"`
	Email          *string   `json:"email"`
	IsHeadquarters bool      `json:"is_headquarters"`
	IsHiring       bool      `json:"is_hiring"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// LocationListResponse represents the list of locations
type LocationListResponse struct {
	Locations []LocationResponse `json:"locations"`
	Total     int                `json:"total"`
}

// CityResponse represents a city
type CityResponse struct {
	Name string `json:"name"`
}

// CountryResponse represents a country
type CountryResponse struct {
	Name string `json:"name"`
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// ToLocationResponse converts a location domain model to a response DTO
func ToLocationResponse(location *domain.CompanyLocation) LocationResponse {
	return LocationResponse{
		ID:             location.ID,
		CompanyID:      location.CompanyID,
		Name:           location.Name,
		Address:        location.Address,
		City:           location.City,
		State:          location.State,
		Country:        location.Country,
		PostalCode:     location.PostalCode,
		Latitude:       location.Latitude,
		Longitude:      location.Longitude,
		Phone:          location.Phone,
		Email:          location.Email,
		IsHeadquarters: location.IsHeadquarters,
		IsHiring:       location.IsHiring,
		CreatedAt:      location.CreatedAt,
		UpdatedAt:      location.UpdatedAt,
	}
}

// ToLocationListResponse converts a list of locations to a list response DTO
func ToLocationListResponse(locations []*domain.CompanyLocation) LocationListResponse {
	responses := make([]LocationResponse, len(locations))
	for i, location := range locations {
		responses[i] = ToLocationResponse(location)
	}

	return LocationListResponse{
		Locations: responses,
		Total:     len(responses),
	}
}

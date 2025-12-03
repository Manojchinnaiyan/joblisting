package handler

import (
	"errors"
	"fmt"
	"job-platform/internal/domain"
	"job-platform/internal/handler/dto"
	"job-platform/internal/middleware"
	"job-platform/internal/service"
	"job-platform/internal/storage"
	"job-platform/internal/util/response"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ProfileHandler handles profile endpoints
type ProfileHandler struct {
	profileService *service.ProfileService
	userService    *service.UserService
	storage        *storage.MinioClient
}

// NewProfileHandler creates a new profile handler
func NewProfileHandler(
	profileService *service.ProfileService,
	userService *service.UserService,
	storageClient *storage.MinioClient,
) *ProfileHandler {
	return &ProfileHandler{
		profileService: profileService,
		userService:    userService,
		storage:        storageClient,
	}
}

// GetMyProfile godoc
// @Summary Get current user's profile
// @Description Get the profile of the authenticated user
// @Tags Profile
// @Security BearerAuth
// @Produce json
// @Success 200 {object} dto.ProfileWithUserResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Router /api/v1/profile [get]
func (h *ProfileHandler) GetMyProfile(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, domain.ErrUnauthorized, nil)
		return
	}

	profile, err := h.profileService.GetProfileByUserID(userID)
	if err != nil {
		response.Error(c, http.StatusNotFound, err, nil)
		return
	}

	user, err := h.userService.GetByID(userID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, errors.New("Failed to fetch user data"), nil)
		return
	}

	response.Success(c, http.StatusOK, "Profile retrieved successfully", dto.ToProfileWithUserResponse(profile, user))
}

// CreateProfile godoc
// @Summary Create user profile
// @Description Create a profile for the authenticated user
// @Tags Profile
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param profile body dto.CreateProfileRequest true "Profile data"
// @Success 201 {object} dto.ProfileResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 409 {object} response.ErrorResponse
// @Router /api/v1/profile [post]
func (h *ProfileHandler) CreateProfile(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, domain.ErrUnauthorized, nil)
		return
	}

	var req dto.CreateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err, nil)
		return
	}

	// Create profile first
	profile, err := h.profileService.CreateProfile(userID)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err, nil)
		return
	}

	// Then update it with the provided data
	input := service.UpdateProfileInput{
		Headline:               req.Headline,
		Bio:                    req.Bio,
		City:                   req.City,
		State:                  req.State,
		Country:                req.Country,
		Phone:                  req.Phone,
		LinkedInURL:            req.LinkedInURL,
		GithubURL:              req.GitHubURL,
		PortfolioURL:           req.PortfolioURL,
		PreferredJobTypes:      req.PreferredJobTypes,
		ExpectedSalaryMin:      req.DesiredSalaryMin,
		ExpectedSalaryMax:      req.DesiredSalaryMax,
		WillingToRelocate:      req.WillingToRelocate,
		AvailableFrom:          req.AvailableFrom,
		PreferredWorkplaceTypes: req.PreferredWorkLocations,
		Visibility:             req.Visibility,
	}

	profile, err = h.profileService.UpdateProfile(userID, input)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err, nil)
		return
	}

	response.Success(c, http.StatusCreated, "Profile created successfully", dto.ToProfileResponse(profile))
}

// UpdateProfile godoc
// @Summary Update user profile
// @Description Update the profile of the authenticated user
// @Tags Profile
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param profile body dto.UpdateProfileRequest true "Profile data"
// @Success 200 {object} dto.ProfileResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Router /api/v1/profile [put]
func (h *ProfileHandler) UpdateProfile(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, domain.ErrUnauthorized, nil)
		return
	}

	var req dto.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err, nil)
		return
	}

	input := service.UpdateProfileInput{
		Headline:                req.Headline,
		Bio:                     req.Bio,
		City:                    req.City,
		State:                   req.State,
		Country:                 req.Country,
		Phone:                   req.Phone,
		DateOfBirth:             req.DateOfBirth,
		LinkedInURL:             req.LinkedInURL,
		GithubURL:               req.GitHubURL,
		PortfolioURL:            req.PortfolioURL,
		PreferredJobTypes:       req.PreferredJobTypes,
		ExpectedSalaryMin:       req.DesiredSalaryMin,
		ExpectedSalaryMax:       req.DesiredSalaryMax,
		WillingToRelocate:       req.WillingToRelocate,
		AvailableFrom:           req.AvailableFrom,
		PreferredWorkplaceTypes: req.PreferredWorkLocations,
		Visibility:              req.Visibility,
		ShowEmail:               req.ShowEmail,
		ShowPhone:               req.ShowPhone,
		OpenToOpportunities:     req.OpenToOpportunities,
	}

	profile, err := h.profileService.UpdateProfile(userID, input)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err, nil)
		return
	}

	user, err := h.userService.GetByID(userID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, errors.New("Failed to fetch user data"), nil)
		return
	}

	response.Success(c, http.StatusOK, "Profile updated successfully", dto.ToProfileWithUserResponse(profile, user))
}

// DeleteProfile godoc
// @Summary Delete user profile
// @Description Delete the profile of the authenticated user
// @Tags Profile
// @Security BearerAuth
// @Produce json
// @Success 200 {object} response.MessageResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Router /api/v1/profile [delete]
func (h *ProfileHandler) DeleteProfile(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, domain.ErrUnauthorized, nil)
		return
	}

	if err := h.profileService.DeleteProfile(userID); err != nil {
		response.Error(c, http.StatusNotFound, err, nil)
		return
	}

	response.Success(c, http.StatusOK, "Profile deleted successfully", nil)
}

// GetProfileCompleteness godoc
// @Summary Get profile completeness
// @Description Get profile completeness score with detailed breakdown
// @Tags Profile
// @Security BearerAuth
// @Produce json
// @Success 200 {object} dto.CompletenessBreakdownResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Router /api/v1/profile/completeness [get]
func (h *ProfileHandler) GetProfileCompleteness(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, domain.ErrUnauthorized, nil)
		return
	}

	breakdown, err := h.profileService.GetCompletenessBreakdown(userID)
	if err != nil {
		response.Error(c, http.StatusNotFound, err, nil)
		return
	}

	// Convert to DTO
	sections := make(map[string]dto.SectionScore)
	for name, section := range breakdown.Sections {
		sections[name] = dto.SectionScore{
			CurrentScore: section.Score,
			MaxScore:     section.Weight,
			Percentage:   0, // Calculate if needed
			IsComplete:   section.Completed,
			Description:  "", // Not available in service
		}
	}

	resp := dto.CompletenessBreakdownResponse{
		TotalScore:      breakdown.Score,
		MaxScore:        100, // Or calculate from sections
		Percentage:      breakdown.Score,
		Sections:        sections,
		MissingSections: []string{}, // Not available in service
		Recommendations: []string{}, // Not available in service
	}

	response.Success(c, http.StatusOK, "Completeness retrieved successfully", resp)
}

// UpdateVisibility godoc
// @Summary Update profile visibility
// @Description Update the visibility setting of user's profile
// @Tags Profile
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param visibility body dto.UpdateVisibilityRequest true "Visibility setting"
// @Success 200 {object} dto.ProfileResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Router /api/v1/profile/visibility [patch]
func (h *ProfileHandler) UpdateVisibility(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, domain.ErrUnauthorized, nil)
		return
	}

	var req dto.UpdateVisibilityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err, nil)
		return
	}

	// Update visibility through UpdateProfile
	input := service.UpdateProfileInput{
		Visibility: &req.Visibility,
	}
	profile, err := h.profileService.UpdateProfile(userID, input)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err, nil)
		return
	}

	response.Success(c, http.StatusOK, "Visibility updated successfully", dto.ToProfileResponse(profile))
}

// UploadAvatar godoc
// @Summary Upload profile avatar
// @Description Upload an avatar image for the user's profile
// @Tags Profile
// @Security BearerAuth
// @Accept multipart/form-data
// @Produce json
// @Param file formData file true "Avatar image"
// @Success 200 {object} dto.ProfileResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Router /api/v1/profile/avatar [post]
func (h *ProfileHandler) UploadAvatar(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, domain.ErrUnauthorized, nil)
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		response.Error(c, http.StatusBadRequest, errors.New("File is required"), nil)
		return
	}

	// Validate file type (only images)
	ext := strings.ToLower(filepath.Ext(file.Filename))
	allowedExts := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".gif": true, ".webp": true}
	if !allowedExts[ext] {
		response.Error(c, http.StatusBadRequest, errors.New("Only image files are allowed (jpg, jpeg, png, gif, webp)"), nil)
		return
	}

	// Validate file size (max 5MB)
	if file.Size > 5*1024*1024 {
		response.Error(c, http.StatusBadRequest, errors.New("File size must not exceed 5MB"), nil)
		return
	}

	// Generate unique filename
	filename := fmt.Sprintf("%s%s", uuid.New().String(), ext)
	avatarPath := fmt.Sprintf("avatars/%s/%s", userID.String(), filename)

	// Upload to MinIO
	result, err := h.storage.UploadFile(h.storage.GetConfig().BucketAvatars, file, avatarPath)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, errors.New("Failed to upload avatar"), nil)
		return
	}

	// Construct the avatar URL
	avatarURL := fmt.Sprintf("/storage/%s/%s", result.Bucket, result.Path)

	// Update profile with new avatar URL
	err = h.profileService.UpdateAvatarURL(userID, avatarURL)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err, nil)
		return
	}

	profile, err := h.profileService.GetProfileByUserID(userID)
	if err != nil {
		response.Error(c, http.StatusNotFound, err, nil)
		return
	}

	user, err := h.userService.GetByID(userID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, errors.New("Failed to fetch user data"), nil)
		return
	}

	response.Success(c, http.StatusOK, "Avatar uploaded successfully", dto.ToProfileWithUserResponse(profile, user))
}

// DeleteAvatar godoc
// @Summary Delete profile avatar
// @Description Delete the avatar image from user's profile
// @Tags Profile
// @Security BearerAuth
// @Produce json
// @Success 200 {object} dto.ProfileResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Router /api/v1/profile/avatar [delete]
func (h *ProfileHandler) DeleteAvatar(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, domain.ErrUnauthorized, nil)
		return
	}

	err = h.profileService.RemoveAvatar(userID)
	if err != nil {
		response.Error(c, http.StatusNotFound, err, nil)
		return
	}

	profile, err := h.profileService.GetProfileByUserID(userID)
	if err != nil {
		response.Error(c, http.StatusNotFound, err, nil)
		return
	}

	response.Success(c, http.StatusOK, "Avatar deleted successfully", dto.ToProfileResponse(profile))
}

// GetProfileByUserID godoc
// @Summary Get profile by user ID
// @Description Get a user's public profile (respects visibility settings)
// @Tags Profile
// @Produce json
// @Param id path string true "User ID"
// @Success 200 {object} dto.ProfileWithUserResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 403 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Router /api/v1/profiles/{id} [get]
func (h *ProfileHandler) GetProfileByUserID(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		response.Error(c, http.StatusBadRequest, domain.ErrInvalidID, nil)
		return
	}

	// Get viewer ID if authenticated (optional - don't fail if not authenticated)
	var viewerID *uuid.UUID
	vID, err := middleware.GetUserIDFromContext(c)
	if err == nil {
		viewerID = &vID
	}

	// Get viewer role if authenticated
	viewerRole := ""
	if viewerID != nil {
		viewer, _ := h.userService.GetByID(*viewerID)
		if viewer != nil {
			viewerRole = string(viewer.Role)
		}
	}

	// Use GetPublicProfile which handles visibility checks
	profile, err := h.profileService.GetPublicProfile(userID, viewerID, viewerRole)
	if err != nil {
		response.Error(c, http.StatusForbidden, err, nil)
		return
	}

	user, err := h.userService.GetByID(userID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, errors.New("Failed to fetch user data"), nil)
		return
	}

	// Increment profile views if viewer is different user
	if viewerID != nil && *viewerID != userID {
		_ = h.profileService.IncrementProfileViews(userID)
	}

	response.Success(c, http.StatusOK, "Profile retrieved successfully", dto.ToProfileWithUserResponse(profile, user))
}

// GetPublicProfiles godoc
// @Summary Get public profiles
// @Description Get list of public profiles (employers can see more based on visibility settings)
// @Tags Profile
// @Produce json
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} dto.ProfileSearchResponse
// @Failure 400 {object} response.ErrorResponse
// @Router /api/v1/profiles [get]
func (h *ProfileHandler) GetPublicProfiles(c *gin.Context) {
	limit := 20
	offset := 0

	if l, ok := c.GetQuery("limit"); ok {
		if parsedLimit, err := parseIntQuery(l); err == nil && parsedLimit > 0 {
			limit = parsedLimit
			if limit > 100 {
				limit = 100
			}
		}
	}

	if o, ok := c.GetQuery("offset"); ok {
		if parsedOffset, err := parseIntQuery(o); err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	// Use SearchProfiles with empty filters to get all visible profiles
	filters := make(map[string]interface{})
	profiles, total, err := h.profileService.SearchProfiles(filters, limit, offset)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err, nil)
		return
	}

	// Convert to response DTOs
	var profileResponses []dto.ProfileWithUserResponse
	for _, profile := range profiles {
		user, err := h.userService.GetByID(profile.UserID)
		if err == nil {
			profileResponses = append(profileResponses, *dto.ToProfileWithUserResponse(&profile, user))
		}
	}

	totalPages := int(total) / limit
	if int(total)%limit > 0 {
		totalPages++
	}

	resp := dto.ProfileSearchResponse{
		Profiles:   profileResponses,
		Total:      total,
		Limit:      limit,
		Offset:     offset,
		Page:       (offset / limit) + 1,
		TotalPages: totalPages,
	}

	response.Success(c, http.StatusOK, "Profiles retrieved successfully", resp)
}

// Helper function to parse int query
func parseIntQuery(s string) (int, error) {
	var i int
	_, err := fmt.Sscanf(s, "%d", &i)
	return i, err
}

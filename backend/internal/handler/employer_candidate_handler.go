package handler

import (
	"job-platform/internal/domain"
	"job-platform/internal/middleware"
	"job-platform/internal/service"
	"job-platform/internal/util/response"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// EmployerCandidateHandler handles employer candidate search endpoints
type EmployerCandidateHandler struct {
	candidateService *service.CandidateSearchService
	profileService   *service.ProfileService
	userService      *service.UserService
	skillService     *service.SkillService
}

// NewEmployerCandidateHandler creates a new employer candidate handler
func NewEmployerCandidateHandler(
	candidateService *service.CandidateSearchService,
	profileService *service.ProfileService,
	userService *service.UserService,
	skillService *service.SkillService,
) *EmployerCandidateHandler {
	return &EmployerCandidateHandler{
		candidateService: candidateService,
		profileService:   profileService,
		userService:      userService,
		skillService:     skillService,
	}
}

// SearchCandidatesRequest represents the request for searching candidates
type SearchCandidatesRequest struct {
	Keywords           string   `form:"keywords"`
	Skills             []string `form:"skills"`
	Location           string   `form:"location"`
	YearsExperienceMin *float32 `form:"years_experience_min"`
	YearsExperienceMax *float32 `form:"years_experience_max"`
	Availability       string   `form:"availability"`
	Page               int      `form:"page"`
	Limit              int      `form:"limit"`
}

// CandidateResponse represents a candidate in the response
type CandidateResponse struct {
	ID                string   `json:"id"`
	UserID            string   `json:"user_id"`
	FirstName         string   `json:"first_name"`
	LastName          string   `json:"last_name"`
	Email             string   `json:"email,omitempty"`
	AvatarURL         string   `json:"avatar_url,omitempty"`
	Headline          string   `json:"headline,omitempty"`
	Location          string   `json:"location,omitempty"`
	YearsOfExperience *float32 `json:"years_of_experience,omitempty"`
	Skills            []string `json:"skills"`
	IsOpenToWork      bool     `json:"is_open_to_work"`
	IsSaved           bool     `json:"is_saved"`
	Availability      string   `json:"availability,omitempty"`
}

// SearchCandidates godoc
// @Summary Search candidates
// @Description Search for candidates based on filters
// @Tags Employer Candidates
// @Accept json
// @Produce json
// @Param keywords query string false "Search keywords"
// @Param skills query []string false "Required skills"
// @Param location query string false "Location"
// @Param years_experience_min query number false "Minimum years of experience"
// @Param years_experience_max query number false "Maximum years of experience"
// @Param availability query string false "Availability status"
// @Param page query int false "Page number"
// @Param limit query int false "Items per page"
// @Success 200 {object} map[string]interface{}
// @Security BearerAuth
// @Router /employer/candidates [get]
func (h *EmployerCandidateHandler) SearchCandidates(c *gin.Context) {
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	var req SearchCandidatesRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set defaults
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.Limit <= 0 {
		req.Limit = 20
	}
	offset := (req.Page - 1) * req.Limit

	// Build filters
	filters := service.CandidateSearchFilters{
		Keyword:            req.Keywords,
		Skills:             req.Skills,
		MinExperienceYears: req.YearsExperienceMin,
		MaxExperienceYears: req.YearsExperienceMax,
		Limit:              req.Limit,
		Offset:             offset,
	}

	if req.Availability != "" {
		filters.AvailableFrom = &req.Availability
	}

	if req.Location != "" {
		filters.Locations = []string{req.Location}
	}

	result, err := h.candidateService.SearchCandidates(user.ID, filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Convert to response format
	candidates := make([]CandidateResponse, len(result.Profiles))
	for i, p := range result.Profiles {
		// Check if saved
		isSaved, _ := h.candidateService.IsCandidateSaved(user.ID, p.UserID)

		// Get user info for name
		firstName := ""
		lastName := ""
		if userInfo, err := h.userService.GetByID(p.UserID); err == nil && userInfo != nil {
			firstName = userInfo.FirstName
			lastName = userInfo.LastName
		}

		// Get skills
		skills := make([]string, 0)
		if userSkills, err := h.skillService.GetUserSkills(p.UserID); err == nil {
			for _, s := range userSkills {
				skills = append(skills, s.Name)
			}
		}

		// Build location string
		location := buildLocationString(p.City, p.State, p.Country)

		candidates[i] = CandidateResponse{
			ID:                p.UserID.String(), // Use UserID as the main ID for API consistency
			UserID:            p.UserID.String(),
			FirstName:         firstName,
			LastName:          lastName,
			AvatarURL:         stringPtrToString(p.AvatarURL),
			Headline:          stringPtrToString(p.Headline),
			Location:          location,
			YearsOfExperience: p.TotalExperienceYears,
			Skills:            skills,
			IsOpenToWork:      p.OpenToOpportunities,
			IsSaved:           isSaved,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"candidates": candidates,
		"total":      result.Total,
		"page":       req.Page,
		"limit":      req.Limit,
	})
}

// GetCandidateProfile godoc
// @Summary Get candidate profile
// @Description Get detailed profile of a candidate
// @Tags Employer Candidates
// @Accept json
// @Produce json
// @Param id path string true "Candidate ID (User ID)"
// @Success 200 {object} map[string]interface{}
// @Security BearerAuth
// @Router /employer/candidates/{id} [get]
func (h *EmployerCandidateHandler) GetCandidateProfile(c *gin.Context) {
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	candidateIDStr := c.Param("id")
	candidateID, err := uuid.Parse(candidateIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid candidate id"})
		return
	}

	profile, err := h.candidateService.GetCandidateProfile(candidateID, user.ID)
	if err != nil {
		if err == domain.ErrCannotViewProfile {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusNotFound, gin.H{"error": "candidate not found"})
		return
	}

	// Check if saved
	isSaved, _ := h.candidateService.IsCandidateSaved(user.ID, profile.UserID)

	// Get user info for name
	firstName := ""
	lastName := ""
	if userInfo, err := h.userService.GetByID(profile.UserID); err == nil && userInfo != nil {
		firstName = userInfo.FirstName
		lastName = userInfo.LastName
	}

	// Get skills
	skills := make([]string, 0)
	if userSkills, err := h.skillService.GetUserSkills(profile.UserID); err == nil {
		for _, s := range userSkills {
			skills = append(skills, s.Name)
		}
	}

	// Build location string
	location := buildLocationString(profile.City, profile.State, profile.Country)

	c.JSON(http.StatusOK, gin.H{
		"candidate": gin.H{
			"id":                  profile.UserID.String(), // Use UserID as main ID for consistency
			"user_id":             profile.UserID.String(),
			"first_name":          firstName,
			"last_name":           lastName,
			"avatar_url":          profile.AvatarURL,
			"headline":            profile.Headline,
			"bio":                 profile.Bio,
			"location":            location,
			"website":             profile.WebsiteURL,
			"linkedin_url":        profile.LinkedInURL,
			"github_url":          profile.GithubURL,
			"years_of_experience": profile.TotalExperienceYears,
			"skills":              skills,
			"is_open_to_work":     profile.OpenToOpportunities,
			"is_saved":            isSaved,
		},
	})
}

// SaveCandidateRequest represents the request for saving a candidate
type SaveCandidateRequest struct {
	CandidateID string  `json:"candidate_id" binding:"required"`
	Notes       *string `json:"notes"`
	Folder      *string `json:"folder"`
}

// SaveCandidate godoc
// @Summary Save a candidate
// @Description Save a candidate to the employer's list
// @Tags Employer Candidates
// @Accept json
// @Produce json
// @Param request body SaveCandidateRequest true "Save candidate request"
// @Success 201 {object} map[string]interface{}
// @Security BearerAuth
// @Router /employer/saved-candidates [post]
func (h *EmployerCandidateHandler) SaveCandidate(c *gin.Context) {
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	var req SaveCandidateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	candidateID, err := uuid.Parse(req.CandidateID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid candidate_id"})
		return
	}

	input := service.SaveCandidateInput{
		CandidateID: candidateID,
	}
	if req.Notes != nil {
		input.Notes = *req.Notes
	}
	if req.Folder != nil {
		input.Folder = *req.Folder
	}

	saved, err := h.candidateService.SaveCandidate(user.ID, input)
	if err != nil {
		if err == domain.ErrUserNotFound || err == domain.ErrNotACandidate {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err == domain.ErrCandidateAlreadySaved {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response.Created(c, "Candidate saved successfully", gin.H{
		"saved_candidate": gin.H{
			"id":           saved.ID.String(),
			"candidate_id": saved.CandidateID.String(),
			"notes":        saved.Notes,
			"folder":       saved.Folder,
			"saved_at":     saved.CreatedAt,
		},
	})
}

// GetSavedCandidates godoc
// @Summary Get saved candidates
// @Description Get all saved candidates for the employer
// @Tags Employer Candidates
// @Accept json
// @Produce json
// @Param page query int false "Page number"
// @Param limit query int false "Items per page"
// @Success 200 {object} map[string]interface{}
// @Security BearerAuth
// @Router /employer/saved-candidates [get]
func (h *EmployerCandidateHandler) GetSavedCandidates(c *gin.Context) {
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit

	saved, total, err := h.candidateService.GetSavedCandidates(user.ID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Build response with candidate details
	candidates := make([]gin.H, len(saved))
	for i, s := range saved {
		// Get candidate profile for details
		profile, _ := h.profileService.GetProfileByUserID(s.CandidateID)

		candidateData := gin.H{
			"id":         s.CandidateID.String(),
			"first_name": "",
			"last_name":  "",
			"skills":     []string{},
		}

		if profile != nil {
			// Get user info for name
			firstName := ""
			lastName := ""
			if userInfo, err := h.userService.GetByID(s.CandidateID); err == nil && userInfo != nil {
				firstName = userInfo.FirstName
				lastName = userInfo.LastName
			}

			// Get skills
			skills := make([]string, 0)
			if userSkills, err := h.skillService.GetUserSkills(s.CandidateID); err == nil {
				for _, sk := range userSkills {
					skills = append(skills, sk.Name)
				}
			}

			// Build location string
			location := buildLocationString(profile.City, profile.State, profile.Country)

			candidateData = gin.H{
				"id":                  profile.ID.String(),
				"user_id":             profile.UserID.String(),
				"first_name":          firstName,
				"last_name":           lastName,
				"avatar_url":          profile.AvatarURL,
				"headline":            profile.Headline,
				"location":            location,
				"years_of_experience": profile.TotalExperienceYears,
				"skills":              skills,
				"is_open_to_work":     profile.OpenToOpportunities,
			}
		}

		candidates[i] = gin.H{
			"id":           s.ID.String(),
			"candidate_id": s.CandidateID.String(),
			"candidate":    candidateData,
			"notes":        s.Notes,
			"folder":       s.Folder,
			"saved_at":     s.CreatedAt,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"candidates": candidates,
		"total":      total,
		"page":       page,
		"limit":      limit,
	})
}

// RemoveSavedCandidate godoc
// @Summary Remove saved candidate
// @Description Remove a candidate from saved list
// @Tags Employer Candidates
// @Accept json
// @Produce json
// @Param id path string true "Candidate ID"
// @Success 200 {object} map[string]interface{}
// @Security BearerAuth
// @Router /employer/saved-candidates/{id} [delete]
func (h *EmployerCandidateHandler) RemoveSavedCandidate(c *gin.Context) {
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	candidateIDStr := c.Param("id")
	candidateID, err := uuid.Parse(candidateIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid candidate id"})
		return
	}

	err = h.candidateService.UnsaveCandidate(user.ID, candidateID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "saved candidate not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Candidate removed from saved list"})
}

// UpdateSavedCandidateRequest represents the request for updating saved candidate
type UpdateSavedCandidateRequest struct {
	Notes  *string `json:"notes"`
	Folder *string `json:"folder"`
}

// UpdateSavedCandidate godoc
// @Summary Update saved candidate
// @Description Update notes or folder for a saved candidate
// @Tags Employer Candidates
// @Accept json
// @Produce json
// @Param id path string true "Candidate ID"
// @Param request body UpdateSavedCandidateRequest true "Update request"
// @Success 200 {object} map[string]interface{}
// @Security BearerAuth
// @Router /employer/saved-candidates/{id} [put]
func (h *EmployerCandidateHandler) UpdateSavedCandidate(c *gin.Context) {
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	candidateIDStr := c.Param("id")
	candidateID, err := uuid.Parse(candidateIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid candidate id"})
		return
	}

	var req UpdateSavedCandidateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	input := service.UpdateSavedCandidateInput{
		Notes:  req.Notes,
		Folder: req.Folder,
	}

	saved, err := h.candidateService.UpdateSavedCandidate(user.ID, candidateID, input)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "saved candidate not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"saved_candidate": gin.H{
			"id":           saved.ID.String(),
			"candidate_id": saved.CandidateID.String(),
			"notes":        saved.Notes,
			"folder":       saved.Folder,
			"saved_at":     saved.CreatedAt,
		},
	})
}

// GetCandidateNotes godoc
// @Summary Get candidate notes
// @Description Get internal notes for a candidate
// @Tags Employer Candidates
// @Accept json
// @Produce json
// @Param id path string true "Candidate User ID"
// @Success 200 {object} map[string]interface{}
// @Security BearerAuth
// @Router /employer/candidates/{id}/notes [get]
func (h *EmployerCandidateHandler) GetCandidateNotes(c *gin.Context) {
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	candidateIDStr := c.Param("id")
	candidateID, err := uuid.Parse(candidateIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid candidate id"})
		return
	}

	// Get notes from saved candidate record
	saved, err := h.candidateService.IsCandidateSaved(user.ID, candidateID)
	if err != nil || !saved {
		// Return empty notes if candidate is not saved
		c.JSON(http.StatusOK, gin.H{"notes": []string{}})
		return
	}

	// Get the saved candidate to retrieve notes
	savedCandidates, _, err := h.candidateService.GetSavedCandidates(user.ID, 100, 0)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"notes": []string{}})
		return
	}

	notes := []string{}
	for _, sc := range savedCandidates {
		if sc.CandidateID == candidateID && sc.Notes != nil && *sc.Notes != "" {
			notes = append(notes, *sc.Notes)
		}
	}

	c.JSON(http.StatusOK, gin.H{"notes": notes})
}

// AddCandidateNoteRequest represents the request for adding a note
type AddCandidateNoteRequest struct {
	Note string `json:"note" binding:"required"`
}

// AddCandidateNote godoc
// @Summary Add candidate note
// @Description Add an internal note for a candidate
// @Tags Employer Candidates
// @Accept json
// @Produce json
// @Param id path string true "Candidate User ID"
// @Param request body AddCandidateNoteRequest true "Note content"
// @Success 200 {object} map[string]interface{}
// @Security BearerAuth
// @Router /employer/candidates/{id}/notes [post]
func (h *EmployerCandidateHandler) AddCandidateNote(c *gin.Context) {
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	candidateIDStr := c.Param("id")
	candidateID, err := uuid.Parse(candidateIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid candidate id"})
		return
	}

	var req AddCandidateNoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if candidate is saved, if not save them first
	saved, _ := h.candidateService.IsCandidateSaved(user.ID, candidateID)
	if !saved {
		// Auto-save the candidate when adding a note
		_, err := h.candidateService.SaveCandidate(user.ID, service.SaveCandidateInput{
			CandidateID: candidateID,
			Notes:       req.Note,
		})
		if err != nil && err != domain.ErrCandidateAlreadySaved {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save candidate"})
			return
		}
	} else {
		// Update existing notes
		_, err := h.candidateService.UpdateSavedCandidate(user.ID, candidateID, service.UpdateSavedCandidateInput{
			Notes: &req.Note,
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update notes"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"note": req.Note})
}

// Helper functions
func stringPtrToString(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func buildLocationString(city, state, country *string) string {
	parts := make([]string, 0, 3)
	if city != nil && *city != "" {
		parts = append(parts, *city)
	}
	if state != nil && *state != "" {
		parts = append(parts, *state)
	}
	if country != nil && *country != "" {
		parts = append(parts, *country)
	}

	if len(parts) == 0 {
		return ""
	}

	result := parts[0]
	for i := 1; i < len(parts); i++ {
		result += ", " + parts[i]
	}
	return result
}

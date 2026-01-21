package handler

import (
	"job-platform/internal/repository"
	"job-platform/internal/service"
	"job-platform/internal/util/response"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// AdminResumeHandler handles admin resume management endpoints
type AdminResumeHandler struct {
	resumeRepo    *repository.ResumeRepository
	resumeService *service.ResumeService
	userRepo      *repository.UserRepository
	skillRepo     *repository.UserSkillRepository
}

// NewAdminResumeHandler creates a new admin resume handler
func NewAdminResumeHandler(
	resumeRepo *repository.ResumeRepository,
	resumeService *service.ResumeService,
	userRepo *repository.UserRepository,
	skillRepo *repository.UserSkillRepository,
) *AdminResumeHandler {
	return &AdminResumeHandler{
		resumeRepo:    resumeRepo,
		resumeService: resumeService,
		userRepo:      userRepo,
		skillRepo:     skillRepo,
	}
}

// ListResumes retrieves all resumes with pagination and filters
func (h *AdminResumeHandler) ListResumes(c *gin.Context) {
	// Parse pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))

	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}

	offset := (page - 1) * perPage

	// Parse filters
	filters := make(map[string]interface{})
	if userID := c.Query("user_id"); userID != "" {
		filters["user_id"] = userID
	}
	if search := c.Query("search"); search != "" {
		filters["search"] = search
	}
	if mimeType := c.Query("mime_type"); mimeType != "" {
		filters["mime_type"] = mimeType
	}
	if isPrimary := c.Query("is_primary"); isPrimary == "true" {
		filters["is_primary"] = true
	} else if isPrimary == "false" {
		filters["is_primary"] = false
	}

	// Get resumes
	resumes, total, err := h.resumeRepo.GetAllResumes(filters, perPage, offset)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	// Transform response to include user info
	var resumeResponses []gin.H
	for _, resume := range resumes {
		resumeData := gin.H{
			"id":             resume.ID,
			"user_id":        resume.UserID,
			"file_name":      resume.FileName,
			"original_name":  resume.OriginalName,
			"file_size":      resume.FileSize,
			"mime_type":      resume.MimeType,
			"title":          resume.Title,
			"is_primary":     resume.IsPrimary,
			"download_count": resume.DownloadCount,
			"created_at":     resume.CreatedAt,
			"updated_at":     resume.UpdatedAt,
		}

		// Add user info if available
		if resume.User != nil {
			resumeData["user"] = gin.H{
				"id":         resume.User.ID,
				"email":      resume.User.Email,
				"first_name": resume.User.FirstName,
				"last_name":  resume.User.LastName,
				"role":       resume.User.Role,
			}
		}

		resumeResponses = append(resumeResponses, resumeData)
	}

	// Calculate total pages
	totalPages := int(total) / perPage
	if int(total)%perPage > 0 {
		totalPages++
	}

	response.Paginated(c, "Resumes retrieved successfully", resumeResponses, response.PaginationMeta{
		CurrentPage: page,
		PerPage:     perPage,
		Total:       total,
		TotalPages:  totalPages,
	})
}

// GetResume retrieves a specific resume
func (h *AdminResumeHandler) GetResume(c *gin.Context) {
	resumeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, err)
		return
	}

	resume, err := h.resumeRepo.GetByID(resumeID)
	if err != nil {
		response.NotFound(c, err)
		return
	}

	// Get user info
	user, _ := h.userRepo.GetByID(resume.UserID)

	resumeData := gin.H{
		"id":             resume.ID,
		"user_id":        resume.UserID,
		"file_name":      resume.FileName,
		"original_name":  resume.OriginalName,
		"file_path":      resume.FilePath,
		"file_size":      resume.FileSize,
		"mime_type":      resume.MimeType,
		"title":          resume.Title,
		"is_primary":     resume.IsPrimary,
		"download_count": resume.DownloadCount,
		"created_at":     resume.CreatedAt,
		"updated_at":     resume.UpdatedAt,
	}

	if user != nil {
		resumeData["user"] = gin.H{
			"id":         user.ID,
			"email":      user.Email,
			"first_name": user.FirstName,
			"last_name":  user.LastName,
			"role":       user.Role,
			"status":     user.Status,
		}
	}

	response.OK(c, "Resume retrieved successfully", gin.H{"resume": resumeData})
}

// GetResumeDownloadURL generates a download URL for a resume
func (h *AdminResumeHandler) GetResumeDownloadURL(c *gin.Context) {
	resumeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, err)
		return
	}

	// Get resume first to get user ID
	resume, err := h.resumeRepo.GetByID(resumeID)
	if err != nil {
		response.NotFound(c, err)
		return
	}

	// Generate download URL (admin can download any resume)
	downloadURL, err := h.resumeService.GetResumeDownloadURL(resumeID, resume.UserID)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	// Increment download count
	h.resumeRepo.IncrementDownloadCount(resumeID)

	response.OK(c, "Download URL generated successfully", gin.H{
		"download_url": downloadURL,
		"file_name":    resume.OriginalName,
		"mime_type":    resume.MimeType,
		"file_size":    resume.FileSize,
	})
}

// GetResumeStats retrieves resume statistics
func (h *AdminResumeHandler) GetResumeStats(c *gin.Context) {
	stats, err := h.resumeRepo.GetResumeStats()
	if err != nil {
		response.InternalError(c, err)
		return
	}

	response.OK(c, "Resume stats retrieved successfully", gin.H{"stats": stats})
}

// GetUserResumes retrieves all resumes for a specific user
func (h *AdminResumeHandler) GetUserResumes(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("user_id"))
	if err != nil {
		response.BadRequest(c, err)
		return
	}

	resumes, err := h.resumeRepo.GetUserResumes(userID)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	response.OK(c, "User resumes retrieved successfully", gin.H{"resumes": resumes})
}

// DeleteResume permanently deletes a resume (admin only)
func (h *AdminResumeHandler) DeleteResume(c *gin.Context) {
	resumeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, err)
		return
	}

	// Hard delete the resume
	if err := h.resumeRepo.HardDelete(resumeID); err != nil {
		response.InternalError(c, err)
		return
	}

	response.OK(c, "Resume deleted successfully", nil)
}

// SearchUsersBySkills searches users by their skills
func (h *AdminResumeHandler) SearchUsersBySkills(c *gin.Context) {
	// Parse pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))

	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}

	// Parse filters
	filters := make(map[string]interface{})
	if role := c.Query("role"); role != "" {
		filters["role"] = role
	}
	if status := c.Query("status"); status != "" {
		filters["status"] = status
	}
	if search := c.Query("search"); search != "" {
		filters["search"] = search
	}

	// Parse skills filter (comma-separated, case-insensitive)
	if skillsParam := c.Query("skills"); skillsParam != "" {
		skillsList := strings.Split(skillsParam, ",")
		// Trim whitespace and convert to lowercase
		cleanSkills := make([]string, 0, len(skillsList))
		for _, s := range skillsList {
			trimmed := strings.TrimSpace(strings.ToLower(s))
			if trimmed != "" {
				cleanSkills = append(cleanSkills, trimmed)
			}
		}
		if len(cleanSkills) > 0 {
			filters["skills"] = cleanSkills
		}
	}

	// Get users with skills filter
	users, total, err := h.userRepo.ListWithSkillsFilter(filters, page, perPage)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	// Transform response to include user skills
	var userResponses []gin.H
	for _, user := range users {
		// Get user skills
		skills, _ := h.skillRepo.GetUserSkills(user.ID)

		userData := gin.H{
			"id":             user.ID,
			"email":          user.Email,
			"first_name":     user.FirstName,
			"last_name":      user.LastName,
			"role":           user.Role,
			"status":         user.Status,
			"email_verified": user.EmailVerified,
			"created_at":     user.CreatedAt,
			"last_login_at":  user.LastLoginAt,
		}

		// Add profile info if available
		if user.Profile != nil {
			userData["profile"] = gin.H{
				"headline":              user.Profile.Headline,
				"city":                  user.Profile.City,
				"country":               user.Profile.Country,
				"current_title":         user.Profile.CurrentTitle,
				"completeness_score":    user.Profile.CompletenessScore,
				"open_to_opportunities": user.Profile.OpenToOpportunities,
			}
		}

		// Add skills
		skillsList := make([]gin.H, 0, len(skills))
		for _, skill := range skills {
			skillsList = append(skillsList, gin.H{
				"id":               skill.ID,
				"name":             skill.Name,
				"level":            skill.Level,
				"years_experience": skill.YearsExperience,
			})
		}
		userData["skills"] = skillsList

		userResponses = append(userResponses, userData)
	}

	// Calculate total pages
	totalPages := int(total) / perPage
	if int(total)%perPage > 0 {
		totalPages++
	}

	response.Paginated(c, "Users retrieved successfully", userResponses, response.PaginationMeta{
		CurrentPage: page,
		PerPage:     perPage,
		Total:       total,
		TotalPages:  totalPages,
	})
}

// GetTopSkills retrieves the most common skills across all users
func (h *AdminResumeHandler) GetTopSkills(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	if limit < 1 || limit > 200 {
		limit = 50
	}

	skills, err := h.skillRepo.GetTopSkills(limit)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	response.OK(c, "Top skills retrieved successfully", gin.H{"skills": skills})
}

// SearchSkills searches for skill names (for autocomplete)
func (h *AdminResumeHandler) SearchSkills(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		response.OK(c, "Skills retrieved successfully", gin.H{"skills": []string{}})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if limit < 1 || limit > 100 {
		limit = 20
	}

	skills, err := h.skillRepo.SearchSkills(query, limit)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	response.OK(c, "Skills retrieved successfully", gin.H{"skills": skills})
}

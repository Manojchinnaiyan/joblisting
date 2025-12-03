package handler

import (
	"job-platform/internal/domain"
	"job-platform/internal/handler/dto"
	"job-platform/internal/middleware"
	"job-platform/internal/service"
	"job-platform/internal/util/response"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ResumeHandler handles resume-related HTTP requests
type ResumeHandler struct {
	resumeService *service.ResumeService
}

// NewResumeHandler creates a new resume handler
func NewResumeHandler(resumeService *service.ResumeService) *ResumeHandler {
	return &ResumeHandler{
		resumeService: resumeService,
	}
}

// UploadResume handles resume upload
func (h *ResumeHandler) UploadResume(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, domain.ErrUnauthorized, nil)
		return
	}

	// Get file from form
	file, err := c.FormFile("file")
	if err != nil {
		response.Error(c, http.StatusBadRequest, domain.ErrInvalidInput, map[string]interface{}{
			"field": "file",
			"error": "file is required",
		})
		return
	}

	// Get title from form
	title := c.PostForm("title")
	if title == "" {
		title = file.Filename
	}

	// Upload resume
	resume, err := h.resumeService.UploadResume(userID, file, title)
	if err != nil {
		if err == domain.ErrMaxResumesReached {
			response.Error(c, http.StatusBadRequest, err, nil)
			return
		}
		if err == domain.ErrResumeUploadFailed {
			response.Error(c, http.StatusInternalServerError, err, nil)
			return
		}
		response.Error(c, http.StatusBadRequest, err, nil)
		return
	}

	// Convert to response
	resumeResp := dto.ToResumeResponse(resume)

	response.Success(c, http.StatusCreated, "Resume uploaded successfully", map[string]interface{}{
		"resume": resumeResp,
	})
}

// GetUserResumes retrieves all resumes for the current user
func (h *ResumeHandler) GetUserResumes(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, domain.ErrUnauthorized, nil)
		return
	}

	resumes, err := h.resumeService.GetUserResumes(userID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err, nil)
		return
	}

	// Convert to response
	resumeResponses := make([]dto.ResumeResponse, len(resumes))
	for i := range resumes {
		resumeResponses[i] = *dto.ToResumeResponse(&resumes[i])
	}

	// Check if user can upload more
	canUploadMore, _ := h.resumeService.CanUploadResume(userID)

	result := dto.ResumeListResponse{
		Resumes:       resumeResponses,
		Total:         len(resumes),
		MaxAllowed:    5, // TODO: Get from config
		CanUploadMore: canUploadMore,
	}

	response.Success(c, http.StatusOK, "Resumes retrieved successfully", result)
}

// GetResume retrieves a specific resume
func (h *ResumeHandler) GetResume(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, domain.ErrUnauthorized, nil)
		return
	}

	resumeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, domain.ErrInvalidInput, nil)
		return
	}

	resume, err := h.resumeService.GetResumeByID(resumeID, userID)
	if err != nil {
		if err == domain.ErrResumeNotFound {
			response.Error(c, http.StatusNotFound, err, nil)
			return
		}
		response.Error(c, http.StatusInternalServerError, err, nil)
		return
	}

	resumeResp := dto.ToResumeResponse(resume)

	response.Success(c, http.StatusOK, "Resume retrieved successfully", map[string]interface{}{
		"resume": resumeResp,
	})
}

// UpdateResume updates resume metadata
func (h *ResumeHandler) UpdateResume(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, domain.ErrUnauthorized, nil)
		return
	}

	resumeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, domain.ErrInvalidInput, nil)
		return
	}

	var req dto.UpdateResumeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, domain.ErrInvalidInput, nil)
		return
	}

	input := service.UpdateResumeInput{
		Title: req.Title,
	}

	resume, err := h.resumeService.UpdateResume(resumeID, userID, input)
	if err != nil {
		if err == domain.ErrResumeNotFound {
			response.Error(c, http.StatusNotFound, err, nil)
			return
		}
		response.Error(c, http.StatusInternalServerError, err, nil)
		return
	}

	resumeResp := dto.ToResumeResponse(resume)

	response.Success(c, http.StatusOK, "Resume updated successfully", map[string]interface{}{
		"resume": resumeResp,
	})
}

// DeleteResume deletes a resume
func (h *ResumeHandler) DeleteResume(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, domain.ErrUnauthorized, nil)
		return
	}

	resumeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, domain.ErrInvalidInput, nil)
		return
	}

	if err := h.resumeService.DeleteResume(resumeID, userID); err != nil {
		if err == domain.ErrResumeNotFound {
			response.Error(c, http.StatusNotFound, err, nil)
			return
		}
		response.Error(c, http.StatusInternalServerError, err, nil)
		return
	}

	response.Success(c, http.StatusOK, "Resume deleted successfully", nil)
}

// SetPrimaryResume sets a resume as primary
func (h *ResumeHandler) SetPrimaryResume(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, domain.ErrUnauthorized, nil)
		return
	}

	resumeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, domain.ErrInvalidInput, nil)
		return
	}

	if err := h.resumeService.SetPrimaryResume(resumeID, userID); err != nil {
		if err == domain.ErrResumeNotFound {
			response.Error(c, http.StatusNotFound, err, nil)
			return
		}
		response.Error(c, http.StatusInternalServerError, err, nil)
		return
	}

	response.Success(c, http.StatusOK, "Primary resume set successfully", nil)
}

// DownloadResume generates a download URL for a resume
func (h *ResumeHandler) DownloadResume(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, domain.ErrUnauthorized, nil)
		return
	}

	resumeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, domain.ErrInvalidInput, nil)
		return
	}

	// Get the resume first to get the file name
	resume, err := h.resumeService.GetResumeByID(resumeID, userID)
	if err != nil {
		if err == domain.ErrResumeNotFound {
			response.Error(c, http.StatusNotFound, err, nil)
			return
		}
		response.Error(c, http.StatusInternalServerError, err, nil)
		return
	}

	// Generate download URL
	downloadURL, err := h.resumeService.GetResumeDownloadURL(resumeID, userID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err, nil)
		return
	}

	// Calculate expiry time (24 hours from now, based on service config)
	expiresAt := time.Now().Add(24 * time.Hour)

	result := dto.ResumeDownloadResponse{
		DownloadURL: downloadURL,
		ExpiresAt:   expiresAt,
		FileName:    resume.FileName,
	}

	response.Success(c, http.StatusOK, "Download URL generated successfully", result)
}

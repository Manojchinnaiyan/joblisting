package handler

import (
	"job-platform/internal/middleware"
	"job-platform/internal/service"
	"job-platform/internal/util/response"

	"github.com/gin-gonic/gin"
)

// AdminCMSHandler handles admin CMS/settings endpoints
type AdminCMSHandler struct {
	cmsService *service.CMSService
}

// NewAdminCMSHandler creates a new admin CMS handler
func NewAdminCMSHandler(cmsService *service.CMSService) *AdminCMSHandler {
	return &AdminCMSHandler{
		cmsService: cmsService,
	}
}

// UpdateSettingRequest represents update setting request
type UpdateSettingRequest struct {
	Value       string  `json:"value" binding:"required"`
	Description *string `json:"description"`
}

// GetAllSettings retrieves all settings
func (h *AdminCMSHandler) GetAllSettings(c *gin.Context) {
	settings, err := h.cmsService.GetAllSettings()
	if err != nil {
		response.InternalError(c, err)
		return
	}

	response.OK(c, "Settings retrieved successfully", gin.H{
		"settings": settings,
	})
}

// GetSetting retrieves a specific setting
func (h *AdminCMSHandler) GetSetting(c *gin.Context) {
	key := c.Param("key")

	setting, err := h.cmsService.GetSetting(key)
	if err != nil {
		response.NotFound(c, err)
		return
	}

	response.OK(c, "Setting retrieved successfully", gin.H{
		"setting": setting,
	})
}

// UpdateSetting updates or creates a setting
func (h *AdminCMSHandler) UpdateSetting(c *gin.Context) {
	key := c.Param("key")

	var req UpdateSettingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err)
		return
	}

	// Get current admin user ID
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	// Update setting
	if err := h.cmsService.UpdateSetting(key, req.Value, req.Description, userID); err != nil {
		response.InternalError(c, err)
		return
	}

	response.OK(c, "Setting updated successfully", nil)
}

// DeleteSetting deletes a setting
func (h *AdminCMSHandler) DeleteSetting(c *gin.Context) {
	key := c.Param("key")

	if err := h.cmsService.DeleteSetting(key); err != nil {
		response.InternalError(c, err)
		return
	}

	response.OK(c, "Setting deleted successfully", nil)
}

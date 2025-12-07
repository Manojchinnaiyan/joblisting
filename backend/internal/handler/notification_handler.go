package handler

import (
	"net/http"
	"strconv"

	"job-platform/internal/middleware"
	"job-platform/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// NotificationHandler handles notification HTTP requests
type NotificationHandler struct {
	notificationService *service.NotificationService
}

// NewNotificationHandler creates a new notification handler
func NewNotificationHandler(notificationService *service.NotificationService) *NotificationHandler {
	return &NotificationHandler{
		notificationService: notificationService,
	}
}

// GetNotifications retrieves notifications for the authenticated user
// @Summary Get notifications
// @Description Get paginated list of notifications for the current user
// @Tags Notifications
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param per_page query int false "Items per page" default(20)
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /me/notifications [get]
func (h *NotificationHandler) GetNotifications(c *gin.Context) {
	uid, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Invalid user ID",
		})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))

	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}

	notifications, total, err := h.notificationService.GetNotifications(c.Request.Context(), uid, page, perPage)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch notifications",
		})
		return
	}

	totalPages := (total + int64(perPage) - 1) / int64(perPage)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"notifications": notifications,
			"pagination": gin.H{
				"page":        page,
				"per_page":    perPage,
				"total":       total,
				"total_pages": totalPages,
			},
		},
	})
}

// GetUnreadCount retrieves the count of unread notifications
// @Summary Get unread notification count
// @Description Get the count of unread notifications for the current user
// @Tags Notifications
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /me/notifications/unread [get]
func (h *NotificationHandler) GetUnreadCount(c *gin.Context) {
	uid, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Invalid user ID",
		})
		return
	}

	count, err := h.notificationService.GetUnreadCount(c.Request.Context(), uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to get unread count",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"unread_count": count,
		},
	})
}

// MarkAsRead marks a notification as read
// @Summary Mark notification as read
// @Description Mark a specific notification as read
// @Tags Notifications
// @Accept json
// @Produce json
// @Param id path string true "Notification ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /me/notifications/{id}/read [put]
func (h *NotificationHandler) MarkAsRead(c *gin.Context) {
	uid, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Invalid user ID",
		})
		return
	}

	notificationID := c.Param("id")
	nid, err := uuid.Parse(notificationID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid notification ID",
		})
		return
	}

	if err := h.notificationService.MarkAsRead(c.Request.Context(), nid, uid); err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Notification not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Notification marked as read",
	})
}

// MarkAllAsRead marks all notifications as read
// @Summary Mark all notifications as read
// @Description Mark all notifications as read for the current user
// @Tags Notifications
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /me/notifications/read-all [put]
func (h *NotificationHandler) MarkAllAsRead(c *gin.Context) {
	uid, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Invalid user ID",
		})
		return
	}

	if err := h.notificationService.MarkAllAsRead(c.Request.Context(), uid); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to mark all as read",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "All notifications marked as read",
	})
}

// Delete deletes a notification
// @Summary Delete notification
// @Description Delete a specific notification
// @Tags Notifications
// @Accept json
// @Produce json
// @Param id path string true "Notification ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /me/notifications/{id} [delete]
func (h *NotificationHandler) Delete(c *gin.Context) {
	uid, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Invalid user ID",
		})
		return
	}

	notificationID := c.Param("id")
	nid, err := uuid.Parse(notificationID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid notification ID",
		})
		return
	}

	if err := h.notificationService.Delete(c.Request.Context(), nid, uid); err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Notification not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Notification deleted",
	})
}

// ClearRead deletes all read notifications
// @Summary Clear read notifications
// @Description Delete all read notifications for the current user
// @Tags Notifications
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /me/notifications/clear [delete]
func (h *NotificationHandler) ClearRead(c *gin.Context) {
	uid, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Invalid user ID",
		})
		return
	}

	if err := h.notificationService.ClearRead(c.Request.Context(), uid); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to clear read notifications",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Read notifications cleared",
	})
}

// GetPreferences retrieves notification preferences
// @Summary Get notification preferences
// @Description Get notification preferences for the current user
// @Tags Notifications
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /me/notification-preferences [get]
func (h *NotificationHandler) GetPreferences(c *gin.Context) {
	uid, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Invalid user ID",
		})
		return
	}

	prefs, err := h.notificationService.GetPreferences(c.Request.Context(), uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to get preferences",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"preferences": prefs,
		},
	})
}

// UpdatePreferencesInput represents input for updating notification preferences
type UpdatePreferencesInput struct {
	// Email notifications
	EmailApplicationStatus   *bool `json:"email_application_status"`
	EmailNewApplication      *bool `json:"email_new_application"`
	EmailNewJob              *bool `json:"email_new_job"`
	EmailJobExpiring         *bool `json:"email_job_expiring"`
	EmailProfileViewed       *bool `json:"email_profile_viewed"`
	EmailCompanyReview       *bool `json:"email_company_review"`
	EmailTeamInvitation      *bool `json:"email_team_invitation"`
	EmailJobModeration       *bool `json:"email_job_moderation"`
	EmailCompanyVerification *bool `json:"email_company_verification"`

	// In-app notifications
	AppApplicationStatus   *bool `json:"app_application_status"`
	AppNewApplication      *bool `json:"app_new_application"`
	AppNewJob              *bool `json:"app_new_job"`
	AppJobExpiring         *bool `json:"app_job_expiring"`
	AppProfileViewed       *bool `json:"app_profile_viewed"`
	AppCompanyReview       *bool `json:"app_company_review"`
	AppTeamInvitation      *bool `json:"app_team_invitation"`
	AppJobModeration       *bool `json:"app_job_moderation"`
	AppCompanyVerification *bool `json:"app_company_verification"`
}

// UpdatePreferences updates notification preferences
// @Summary Update notification preferences
// @Description Update notification preferences for the current user
// @Tags Notifications
// @Accept json
// @Produce json
// @Param input body UpdatePreferencesInput true "Preferences to update"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /me/notification-preferences [put]
func (h *NotificationHandler) UpdatePreferences(c *gin.Context) {
	uid, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Invalid user ID",
		})
		return
	}

	var input UpdatePreferencesInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	// Get current preferences
	prefs, err := h.notificationService.GetPreferences(c.Request.Context(), uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to get current preferences",
		})
		return
	}

	// Update only provided fields
	if input.EmailApplicationStatus != nil {
		prefs.EmailApplicationStatus = *input.EmailApplicationStatus
	}
	if input.EmailNewApplication != nil {
		prefs.EmailNewApplication = *input.EmailNewApplication
	}
	if input.EmailNewJob != nil {
		prefs.EmailNewJob = *input.EmailNewJob
	}
	if input.EmailJobExpiring != nil {
		prefs.EmailJobExpiring = *input.EmailJobExpiring
	}
	if input.EmailProfileViewed != nil {
		prefs.EmailProfileViewed = *input.EmailProfileViewed
	}
	if input.EmailCompanyReview != nil {
		prefs.EmailCompanyReview = *input.EmailCompanyReview
	}
	if input.EmailTeamInvitation != nil {
		prefs.EmailTeamInvitation = *input.EmailTeamInvitation
	}
	if input.EmailJobModeration != nil {
		prefs.EmailJobModeration = *input.EmailJobModeration
	}
	if input.EmailCompanyVerification != nil {
		prefs.EmailCompanyVerification = *input.EmailCompanyVerification
	}

	if input.AppApplicationStatus != nil {
		prefs.AppApplicationStatus = *input.AppApplicationStatus
	}
	if input.AppNewApplication != nil {
		prefs.AppNewApplication = *input.AppNewApplication
	}
	if input.AppNewJob != nil {
		prefs.AppNewJob = *input.AppNewJob
	}
	if input.AppJobExpiring != nil {
		prefs.AppJobExpiring = *input.AppJobExpiring
	}
	if input.AppProfileViewed != nil {
		prefs.AppProfileViewed = *input.AppProfileViewed
	}
	if input.AppCompanyReview != nil {
		prefs.AppCompanyReview = *input.AppCompanyReview
	}
	if input.AppTeamInvitation != nil {
		prefs.AppTeamInvitation = *input.AppTeamInvitation
	}
	if input.AppJobModeration != nil {
		prefs.AppJobModeration = *input.AppJobModeration
	}
	if input.AppCompanyVerification != nil {
		prefs.AppCompanyVerification = *input.AppCompanyVerification
	}

	if err := h.notificationService.UpdatePreferences(c.Request.Context(), prefs); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to update preferences",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Preferences updated",
		"data": gin.H{
			"preferences": prefs,
		},
	})
}
